"use client";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

export default function SettingsPage() {
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
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Paramètres</h1>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="font-semibold">Génération de questions IA</h2>
        <p className="mt-1 text-sm text-gray-500">
          Générer automatiquement des questions pour les conversations IA à partir des thèmes de formation.
        </p>
        <Button onClick={handleGenerateQuestions} disabled={generating} className="mt-4">
          {generating ? "Génération en cours..." : "Générer 20 questions"}
        </Button>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="font-semibold">Notifications SMS</h2>
        <p className="mt-1 text-sm text-gray-500">
          Configuration des rappels automatiques Agendrix et des alertes d'informations manquantes.
        </p>
        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" defaultChecked className="rounded accent-brand-500" />
            Rappel Agendrix (6h avant la date limite)
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" defaultChecked className="rounded accent-brand-500" />
            Alerte informations manquantes
          </label>
        </div>
      </section>
    </div>
  );
}
