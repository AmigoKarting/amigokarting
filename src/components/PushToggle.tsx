"use client";

import { useEffect, useRef, useState } from "react";

function urlB64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

type State = "loading" | "unsupported" | "off" | "on" | "denied" | "working";

export function PushToggle() {
  const [state, setState] = useState<State>("loading");
  const [msg, setMsg] = useState("");
  const tried = useRef(false);

  // Abonne l'appareil (et envoie une notif de test au premier abonnement).
  async function subscribe(sendTest: boolean) {
    const reg = await navigator.serviceWorker.ready;
    const { key } = await (await fetch("/api/push/public-key")).json();
    if (!key) throw new Error("no-key");
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(key),
    });
    const json: any = sub.toJSON();
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
    });
    if (sendTest) await fetch("/api/push/test", { method: "POST" });
  }

  // Au chargement : on active les rappels par défaut, sans demander de clic.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }

    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          setState("on");
          return;
        }

        // Déjà autorisé sur cet appareil : on (ré)abonne en silence.
        if (Notification.permission === "granted") {
          await subscribe(false);
          setState("on");
          return;
        }

        // Permission pas encore demandée : on l'active par défaut (au mieux ;
        // certains navigateurs exigent un clic, on garde alors le bouton).
        if (!tried.current) {
          tried.current = true;
          const perm = await Notification.requestPermission();
          if (perm === "granted") {
            await subscribe(true);
            setState("on");
          } else if (perm === "denied") {
            setState("denied");
          } else {
            setState("off");
          }
        } else {
          setState("off");
        }
      } catch {
        setState("off");
      }
    })();
  }, []);

  async function enable() {
    setState("working");
    setMsg("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "off");
        return;
      }
      await subscribe(true);
      setState("on");
    } catch {
      setMsg("Échec, réessaie.");
      setState("off");
    }
  }

  // Rappels actifs (ou rien à montrer) : on reste discret, aucune bannière,
  // rien qui invite à les désactiver.
  if (state === "loading" || state === "unsupported" || state === "on") return null;

  if (state === "denied") {
    // Bloqué au niveau du navigateur : petit rappel discret pour réactiver.
    return (
      <p className="px-1 text-[11px] text-gray-400">
        🔕 Notifications bloquées — réactive-les dans les réglages de ton navigateur pour ne rien manquer.
      </p>
    );
  }

  // Repli pour les navigateurs qui exigent un clic : bouton sobre.
  return (
    <button
      onClick={enable}
      disabled={state === "working"}
      className="flex w-full items-center gap-3 rounded-2xl border-2 border-orange-200 bg-orange-50 p-4 text-left transition active:scale-[0.99] disabled:opacity-60"
    >
      <span className="text-2xl">🔔</span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-orange-900">
          {state === "working" ? "Activation..." : "Activer les rappels"}
        </p>
        <p className="text-xs text-orange-600">{msg || "Reçois une notif pour garder ta série, même app fermée"}</p>
      </div>
      <span className="shrink-0 rounded-full bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white">
        {state === "working" ? "..." : "Activer"}
      </span>
    </button>
  );
}
