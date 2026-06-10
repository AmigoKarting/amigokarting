"use client";

import { useState, useEffect } from "react";
import { VoiceInterface } from "@/components/conversations/VoiceInterface";
import { Target, HardHat, Shield, Siren, Wrench, Wallet, Users, type LucideIcon } from "lucide-react";

const topics: { id: string; Icon: LucideIcon; title: string; description: string }[] = [
  { id: "all", Icon: Target, title: "Révision complète", description: "L'IA choisit les questions selon tes faiblesses" },
  { id: "casques", Icon: HardHat, title: "Casques", description: "Ajustement, vérification, désinfection, casques défectueux" },
  { id: "securite", Icon: Shield, title: "Sécurité sur la piste", description: "Drapeaux, distances, règles de conduite" },
  { id: "urgence", Icon: Siren, title: "Urgences", description: "Accidents, blessures, numéros d'urgence" },
  { id: "operations", Icon: Wrench, title: "Opérations", description: "Ouverture, fermeture, karts, équipement" },
  { id: "caisse", Icon: Wallet, title: "Caisse", description: "Rapport Z, comptant, fermeture, fond de caisse" },
  { id: "clients", Icon: Users, title: "Service client", description: "Accueil, forfaits, plaintes, groupes" },
];

export default function ConversationsPage() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  if (selectedTopic) {
    const topic = topics.find((t) => t.id === selectedTopic);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedTopic(null)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Conversations IA</h1>
              <span className="rounded-md bg-orange-50 px-3 py-1 text-xs font-semibold text-brand-700">BÊTA</span>
            </div>
            <p className="flex items-center gap-1.5 text-sm text-gray-500">
              {topic && <topic.Icon className="h-4 w-4" strokeWidth={2} />} {topic?.title}
            </p>
          </div>
        </div>
        <VoiceInterface topicId={selectedTopic} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 lg:max-w-4xl">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Conversations IA</h1>
        <span className="rounded-md bg-orange-50 px-3 py-1 text-xs font-semibold text-brand-700">BÊTA</span>
      </div>
      <p className="text-sm text-gray-500">Choisis un sujet ou laisse l'IA décider selon tes faiblesses.</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {topics.map((topic) => (
          <button
            key={topic.id}
            onClick={() => setSelectedTopic(topic.id)}
            className={`w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-gray-300 ${topic.id === "all" ? "sm:col-span-2" : ""}`}
          >
            <div className="flex items-center gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                <topic.Icon className="h-5 w-5" strokeWidth={2} />
              </span>
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
