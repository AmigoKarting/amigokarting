"use client";
import { useState } from "react";

export function SettingsClient() {
  const [generating, setGenerating] = useState(false);

  async function handleGenerateQuestions() {
    setGenerating(true);
    await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate", topic: "Procédures de sécurité karting", count: 20 }),
    });
    setGenerating(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Paramètres</h1>

      {/* ─── Génération de questions IA ─── */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900">Génération de questions</h2>
        <p className="mt-1 text-sm text-gray-500">
          Générer des questions pour les conversations à partir des thèmes de formation.
        </p>
        <button
          onClick={handleGenerateQuestions}
          disabled={generating}
          className="mt-4 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          {generating ? "Génération en cours…" : "Générer 20 questions"}
        </button>
      </section>
    </div>
  );
}
