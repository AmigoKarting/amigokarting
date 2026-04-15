"use client";

import { useState } from "react";

const sections = [
  {
    id: "bienvenue",
    icon: "👋",
    title: "Bienvenue chez Amigo Karting",
    content: [
      "Cette application est ton outil de formation et de communication. Tu y trouveras tout ce dont tu as besoin pour bien faire ton travail.",
      "Connecte-toi avec ton prénom et les 4 derniers chiffres de ton numéro de téléphone.",
    ],
  },
  {
    id: "formation",
    icon: "🎓",
    title: "Comment faire ta formation",
    content: [
      "1. Clique sur 'Formation' dans le menu",
      "2. Choisis un module (ex: Sécurité de base)",
      "3. Regarde chaque vidéo dans l'ordre — tu ne peux pas avancer rapidement",
      "4. Ta progression se sauvegarde automatiquement, tu peux fermer et revenir",
      "5. Quand toutes les vidéos d'un chapitre sont terminées, le quiz se débloque",
    ],
  },
  {
    id: "quiz",
    icon: "✅",
    title: "Comment faire un quiz",
    content: [
      "1. Termine toutes les vidéos d'un chapitre",
      "2. Le bouton 'Commencer le quiz' apparaît",
      "3. Réponds aux questions à choix multiples",
      "4. Tu vois immédiatement si ta réponse est bonne ou mauvaise",
      "5. À la fin, tu vois ton score total",
    ],
  },
  {
    id: "conversations",
    icon: "🎙️",
    title: "Conversations avec l'IA (Bêta)",
    content: [
      "Ton chef formateur IA te pose des questions sur les procédures et te corrige en temps réel.",
      "1. Clique sur 'Conversations' dans le menu",
      "2. Clique 'Démarrer la conversation'",
      "3. L'IA te salue et pose sa première question à voix haute",
      "4. Le micro s'active tout seul — parle normalement",
      "5. Quand tu arrêtes de parler, l'IA détecte le silence et répond",
      "6. La conversation continue automatiquement, comme un vrai appel",
      "Tu peux aussi maintenir le bouton orange pour parler si tu préfères.",
      "L'IA s'adapte à toi : elle connaît ton score, tes erreurs au quiz, et tes points faibles.",
      "Utilise Chrome sur Android ou Safari sur iPhone. Autorise le micro quand demandé.",
    ],
  },
  {
    id: "qa",
    icon: "❓",
    title: "Q&A — Chercher dans le manuel",
    content: [
      "Tu as une question sur une procédure ? Le Q&A cherche dans le manuel de l'entreprise.",
      "1. Clique sur 'Q&A' dans le menu",
      "2. Tape un mot-clé (ex: casque, accident, caisse)",
      "3. L'app affiche les sections du manuel qui correspondent",
      "Tu peux aussi cliquer sur les bulles de suggestions en bas.",
    ],
  },
  {
    id: "fiche",
    icon: "📝",
    title: "Remplir ta fiche personnelle",
    content: [
      "Ton gestionnaire a besoin de tes informations. Remplis tout pour avoir 100%.",
      "1. Clique sur 'Ma fiche' dans le menu",
      "2. Remplis : téléphone, adresse, ville, code postal, province",
      "3. Remplis le contact d'urgence (nom + téléphone)",
      "4. Choisis ta taille de chandail",
      "5. Clique 'Sauvegarder'",
    ],
  },
  {
    id: "note",
    icon: "⭐",
    title: "Comprendre ta note sur 100",
    content: [
      "Ta note est calculée automatiquement selon 4 catégories :",
      "• Formation (40%) — Pourcentage de vidéos complétées",
      "• Quiz (30%) — Moyenne de tes scores aux quiz",
      "• Conversations IA (20%) — Heures de conversation, objectif 5h",
      "• Q&A (10%) — Questions posées sur le manuel, objectif 20",
      "Plus tu utilises l'app, plus ta note monte !",
    ],
  },
  {
    id: "installer",
    icon: "📱",
    title: "Installer l'app sur ton téléphone",
    content: [
      "Android (Chrome) :",
      "1. Ouvre Chrome et va sur l'adresse de l'app",
      "2. Un banner apparaît en bas → clique 'Installer'",
      "3. Si rien n'apparaît : 3 points en haut (⋮) → 'Ajouter à l'écran d'accueil'",
      "",
      "iPhone (Safari) :",
      "1. Ouvre Safari (pas Chrome !)",
      "2. Appuie sur le bouton Partage (carré avec flèche ⬆️)",
      "3. Défile et appuie 'Sur l'écran d'accueil'",
      "4. Appuie 'Ajouter'",
    ],
  },
  {
    id: "problemes",
    icon: "🔧",
    title: "Problèmes fréquents",
    content: [
      "❌ 'Identifiant ou code incorrect' → Vérifie ton prénom (celui du système) et les 4 derniers chiffres de ton numéro",
      "⏳ 'En attente d'approbation' → Ton gestionnaire doit approuver ton compte",
      "🎤 Le micro ne marche pas → Utilise Chrome (Android) ou Safari (iPhone). Autorise le micro.",
      "📵 L'app ne charge pas → Vérifie ta connexion internet",
      "🗑️ Désinstaller → Maintiens l'icône sur ton écran d'accueil et supprime-la",
    ],
  },
];

export default function GuidePage() {
  const [openId, setOpenId] = useState<string | null>("bienvenue");

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Guide</h1>
        <p className="text-sm text-gray-500">Tout ce que tu dois savoir pour utiliser l'application</p>
      </div>

      {sections.map((section) => {
        const isOpen = openId === section.id;
        return (
          <div key={section.id} className="overflow-hidden rounded-xl bg-white shadow-sm">
            <button
              onClick={() => setOpenId(isOpen ? null : section.id)}
              className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-gray-50"
            >
              <span className="text-2xl">{section.icon}</span>
              <span className="flex-1 text-sm font-semibold text-gray-900">{section.title}</span>
              <svg className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isOpen && (
              <div className="border-t border-gray-100 px-5 py-4 space-y-2">
                {section.content.map((line, i) => (
                  <p key={i} className={`text-sm ${line === "" ? "h-2" : line.startsWith("•") ? "pl-4 text-gray-600" : "text-gray-700"}`}>
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}