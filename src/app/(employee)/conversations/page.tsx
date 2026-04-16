"use client";

import { useState, useEffect } from "react";
import { VoiceInterface } from "@/components/conversations/VoiceInterface";

const topics = [
  { id: "all", icon: "🎯", title: "Révision complète", description: "L'IA choisit les questions selon tes faiblesses" },
  { id: "casques", icon: "⛑️", title: "Casques", description: "Ajustement, vérification, désinfection, casques défectueux" },
  { id: "securite", icon: "🛡️", title: "Sécurité sur la piste", description: "Drapeaux, distances, règles de conduite" },
  { id: "urgence", icon: "🚨", title: "Urgences", description: "Accidents, blessures, numéros d'urgence" },
  { id: "operations", icon: "🔧", title: "Opérations", description: "Ouverture, fermeture, karts, équipement" },
  { id: "caisse", icon: "💰", title: "Caisse", description: "Rapport Z, comptant, fermeture, fond de caisse" },
  { id: "clients", icon: "👥", title: "Service client", description: "Accueil, forfaits, plaintes, groupes" },
];

export default function ConversationsPage() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  if (selectedTopic) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedTopic(null)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600 active:bg-gray-200">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Conversations IA</h1>
              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">BÊTA</span>
            </div>
            <p className="text-sm text-gray-500">
              {topics.find((t) => t.id === selectedTopic)?.icon} {topics.find((t) => t.id === selectedTopic)?.title}
            </p>
          </div>
        </div>
        <VoiceInterface topicId={selectedTopic} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">Conversations IA</h1>
        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">BÊTA</span>
      </div>
      <p className="text-sm text-gray-500">Choisis un sujet ou laisse l'IA décider selon tes faiblesses.</p>

      <div className="space-y-3">
        {topics.map((topic) => (
          <button
            key={topic.id}
            onClick={() => setSelectedTopic(topic.id)}
            className={`w-full rounded-xl bg-white p-4 text-left shadow-sm transition active:scale-[0.99] ${topic.id === "all" ? "ring-2 ring-orange-300" : ""}`}
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">{topic.icon}</span>
              <div>
                <p className="font-semibold text-gray-900">{topic.title}</p>
                <p className="mt-0.5 text-xs text-gray-500">{topic.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
