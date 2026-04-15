"use client";

import { useState } from "react";

const sections = [
  {
    id: "bienvenue",
    icon: "👋",
    title: "Bienvenue — Vue d'ensemble",
    content: [
      "Tu es gestionnaire, patron ou développeur. Tu as accès à tous les outils pour gérer ton équipe.",
      "Cette section t'explique comment tout fonctionne.",
    ],
  },
  {
    id: "approuver",
    icon: "✅",
    title: "Approuver les nouveaux comptes",
    content: [
      "Quand un employé crée son compte, il ne peut PAS se connecter tout de suite.",
      "1. Connecte-toi à l'app",
      "2. Sur le Tableau de bord, un encadré orange apparaît avec les comptes en attente",
      "3. Clique 'Approuver' pour autoriser la personne",
      "4. Ou clique 'Refuser' pour bloquer le compte",
      "Sans ton approbation, personne ne peut accéder à l'app.",
    ],
  },
  {
    id: "roles",
    icon: "👥",
    title: "Gérer les rôles des employés",
    content: [
      "Il y a 4 rôles : Employé, Gérant, Patron, Développeur.",
      "Pour rendre quelqu'un Gérant : clique sur le badge 'Employé' dans la liste des employés.",
      "Pour rendre quelqu'un Patron ou Développeur : va dans Supabase > Table Editor > employees > change la colonne 'role'.",
      "Seul le patron et le développeur peuvent changer les rôles.",
      "Le code PIN du patron est caché (****) pour les gérants.",
      "Le développeur est invisible dans la liste pour les gérants.",
    ],
  },
  {
    id: "annonces",
    icon: "📢",
    title: "Publier une annonce",
    content: [
      "1. Va dans 'Annonces' dans le menu",
      "2. Écris un titre et un message",
      "3. Choisis la priorité : Normal (bleu), Important (jaune), Urgent (rouge)",
      "4. Clique 'Publier'",
      "Un popup plein écran apparaît automatiquement pour tous les employés à leur prochaine connexion. Ils doivent cliquer 'Lu' pour fermer.",
    ],
  },
  {
    id: "scores",
    icon: "📊",
    title: "Voir les scores des employés",
    content: [
      "Va dans 'Notes globales' dans le menu.",
      "Tu vois le score sur 100 de chaque employé avec un code couleur :",
      "• Vert (80+) = Excellent",
      "• Orange (60-79) = Bon",
      "• Jaune (40-59) = À améliorer",
      "• Rouge (0-39) = Critique",
      "Clique sur un employé pour voir le détail par catégorie.",
    ],
  },
  {
    id: "difficultes",
    icon: "⚠️",
    title: "Voir les difficultés des quiz",
    content: [
      "Va dans 'Difficultés quiz' dans le menu.",
      "En haut : les questions les plus ratées par tout le monde.",
      "En bas : par employé, chaque question ratée et combien de fois.",
      "Ça te montre quoi retravailler avec ton équipe.",
    ],
  },
  {
    id: "formation",
    icon: "🎓",
    title: "Suivre la formation des employés",
    content: [
      "Va dans 'Suivi formation' dans le menu.",
      "Tu vois la progression de chaque employé : vidéos regardées, quiz complétés.",
      "Clique sur un employé pour voir sa fiche détaillée.",
    ],
  },
  {
    id: "conversations",
    icon: "🎙️",
    title: "Conversations IA — Comment ça marche",
    content: [
      "Les employés parlent avec une IA qui leur pose des questions sur les procédures.",
      "L'IA utilise le micro du navigateur (gratuit, pas besoin de clé API).",
      "10 questions progressives sur : casques, désinfection, sécurité, accidents, drapeaux, etc.",
      "Va dans 'Rapport conversations' pour voir les heures et les notes de chaque employé.",
    ],
  },
  {
    id: "qa",
    icon: "❓",
    title: "Q&A — Le manuel de l'entreprise",
    content: [
      "Les employés peuvent chercher des réponses dans le manuel directement dans l'app.",
      "Le contenu du manuel est dans la base de données (Supabase > knowledge_documents).",
      "Pour ajouter du contenu : va dans Supabase > Table Editor > knowledge_documents > Insert Row.",
      "Remplis le titre, le contenu et la catégorie. C'est en ligne immédiatement.",
    ],
  },
  {
    id: "employes",
    icon: "👤",
    title: "Gérer les employés",
    content: [
      "Va dans 'Employés' dans le menu.",
      "Tu vois toutes les informations de chaque employé : nom, rôle, téléphone, adresse, urgence, chandail.",
      "Les informations manquantes sont en rouge.",
      "Clique sur un nom pour voir sa fiche détaillée avec son historique de formation.",
    ],
  },
  {
    id: "miseajour",
    icon: "🔄",
    title: "Mettre à jour l'application",
    content: [
      "Pour changer du contenu (quiz, manuel) : fais-le dans Supabase, pas besoin de code.",
      "Pour changer l'app : modifie les fichiers sur l'ordinateur, puis dans PowerShell :",
      "git add .",
      "git commit -m \"description\"",
      "git push",
      "Vercel met le site à jour en 2-3 minutes automatiquement.",
      "Pour des changements plus gros : demande à Claude sur claude.ai.",
    ],
  },
  {
    id: "supabase",
    icon: "🗄️",
    title: "Utiliser Supabase (la base de données)",
    content: [
      "Supabase contient toutes les données de l'app.",
      "Va sur supabase.com > connecte-toi > ton projet.",
      "Table Editor : voir et modifier les données (employés, quiz, manuel).",
      "SQL Editor : exécuter des commandes avancées.",
      "Tu peux ajouter du contenu au Q&A, des questions de quiz, modifier des employés — tout sans toucher au code.",
    ],
  },
  {
    id: "zonpatron",
    icon: "👑",
    title: "Zone Patron",
    content: [
      "Page exclusive visible seulement par le patron et le développeur.",
      "Affiche un message d'accueil selon l'heure, une citation motivationnelle, les stats globales (employés, vidéos, quiz, fiches), les dernières inscriptions et des raccourcis rapides.",
    ],
  },
  {
    id: "problemes",
    icon: "🔧",
    title: "Problèmes fréquents",
    content: [
      "❌ Un employé ne peut pas se connecter → Vérifie que son compte est approuvé dans le Tableau de bord",
      "🔑 Code PIN oublié → C'est les 4 derniers chiffres de son téléphone. Vérifie dans Supabase > employees",
      "🔄 Réinitialiser un compte → Dans Supabase SQL Editor : UPDATE employees SET auth_user_id = NULL WHERE first_name = 'Prénom';",
      "🚫 'permission denied' → Exécute les GRANT dans le SQL Editor (voir le guide PDF)",
      "📱 Le micro ne marche pas → Chrome (Android) ou Safari (iPhone) seulement, en HTTPS",
    ],
  },
];

export default function AdminGuidePage() {
  const [openId, setOpenId] = useState<string | null>("bienvenue");

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Guide du gestionnaire</h1>
        <p className="text-sm text-gray-500">Tout ce que tu dois savoir pour gérer l'app et ton équipe</p>
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
                  <p key={i} className={`text-sm ${line === "" ? "h-2" : line.startsWith("•") ? "pl-4 text-gray-600" : line.startsWith("git ") ? "pl-4 font-mono text-xs bg-gray-100 rounded px-2 py-1 text-gray-800" : "text-gray-700"}`}>
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