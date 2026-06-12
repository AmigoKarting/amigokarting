"use client";

import { useState } from "react";
import { Wrench, ShieldAlert, Wallet, Package, AlertTriangle, CheckCircle2, Send, type LucideIcon } from "lucide-react";

const TYPES: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: "kart", label: "Kart en panne", Icon: Wrench },
  { value: "equipement", label: "Équipement", Icon: Package },
  { value: "securite", label: "Sécurité / incident", Icon: ShieldAlert },
  { value: "caisse", label: "Caisse", Icon: Wallet },
  { value: "autre", label: "Autre", Icon: AlertTriangle },
];

export default function SignalerPage() {
  const [type, setType] = useState("kart");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit() {
    if (!description.trim()) return;
    setState("sending");
    try {
      const res = await fetch("/api/employee/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, location, description }),
      });
      if (!res.ok) throw new Error();
      setState("done");
    } catch {
      setState("error");
    }
  }

  function reset() {
    setType("kart");
    setLocation("");
    setDescription("");
    setState("idle");
  }

  if (state === "done") {
    return (
      <div className="mx-auto max-w-lg">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" strokeWidth={2} />
          <p className="mt-3 text-base font-semibold text-gray-900">Signalement envoyé</p>
          <p className="mt-1 text-sm text-gray-500">Un superviseur a été prévenu tout de suite. Merci !</p>
          <button onClick={reset} className="mt-5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700">
            Nouveau signalement
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Signaler un problème</h1>
        <p className="mt-1 text-sm text-gray-500">
          Préviens un superviseur en quelques secondes. Il reçoit une notification immédiatement.
        </p>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-gray-700">Type de problème</p>
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm font-medium transition ${
                type === t.value
                  ? "border-brand-600 bg-orange-50 text-brand-700"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              }`}
            >
              <t.Icon className="h-4 w-4 shrink-0" strokeWidth={2} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700">
          # de kart / endroit <span className="font-normal text-gray-400">(optionnel)</span>
        </label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Ex : Kart 12, piste, caisse 2…"
          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Décris le problème en quelques mots…"
          className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
        />
      </div>

      {state === "error" && <p className="text-sm text-red-600">Échec de l'envoi. Réessaie.</p>}

      <button
        onClick={submit}
        disabled={!description.trim() || state === "sending"}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
      >
        <Send className="h-4 w-4" strokeWidth={2} /> {state === "sending" ? "Envoi…" : "Envoyer au superviseur"}
      </button>
    </div>
  );
}
