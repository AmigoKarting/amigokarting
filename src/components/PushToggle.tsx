"use client";

import { useEffect, useState } from "react";

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
    navigator.serviceWorker.ready
      .then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        setState(sub ? "on" : "off");
      })
      .catch(() => setState("off"));
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
      const reg = await navigator.serviceWorker.ready;
      const { key } = await (await fetch("/api/push/public-key")).json();
      if (!key) {
        setMsg("Configuration manquante");
        setState("off");
        return;
      }
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
      await fetch("/api/push/test", { method: "POST" });
      setMsg("Notification de test envoyée 📬");
      setState("on");
    } catch {
      setMsg("Échec, réessaie.");
      setState("off");
    }
  }

  if (state === "loading" || state === "unsupported") return null;

  if (state === "on") {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-green-50 p-4">
        <span className="text-2xl">🔔</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-green-900">Rappels activés</p>
          <p className="text-xs text-green-600">{msg || "On te préviendra pour garder ta série 🔥"}</p>
        </div>
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-gray-100 p-4">
        <span className="text-2xl">🔕</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-700">Notifications bloquées</p>
          <p className="text-xs text-gray-500">Réactive-les dans les réglages de ton navigateur.</p>
        </div>
      </div>
    );
  }

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
