"use client";

import { useState } from "react";

const sections = [
  {
    id: "install-android",
    icon: "🤖",
    title: "Installer sur Android",
    steps: [
      { num: "1", text: "Ouvre Google Chrome sur ton téléphone" },
      { num: "2", text: "Tape l'adresse de l'app dans la barre en haut" },
      { num: "3", text: "Connecte-toi avec ton prénom et ton code à 4 chiffres" },
      { num: "4", text: "Un banner orange va apparaître en bas : « Installe l'app sur ton téléphone ». Clique Installer." },
      { num: "5", text: "Chrome va demander « Ajouter à l'écran d'accueil ? ». Clique Ajouter." },
      { num: "6", text: "L'icône AK orange est maintenant sur ton écran d'accueil !" },
    ],
    tip: "Si le banner n'apparaît pas : clique les 3 points en haut à droite de Chrome (⋮) puis « Ajouter à l'écran d'accueil ».",
  },
  {
    id: "install-iphone",
    icon: "🍎",
    title: "Installer sur iPhone / iPad",
    steps: [
      { num: "1", text: "Ouvre Safari (l'icône bleue avec la boussole). Chrome ne fonctionne PAS sur iPhone pour installer l'app." },
      { num: "2", text: "Tape l'adresse de l'app dans la barre en haut" },
      { num: "3", text: "Connecte-toi avec ton prénom et ton code à 4 chiffres" },
      { num: "4", text: "Appuie sur le bouton Partage en bas de l'écran (le carré avec la flèche vers le haut ⬆️)" },
      { num: "5", text: "Défile vers le bas et appuie « Sur l'écran d'accueil »" },
      { num: "6", text: "Appuie « Ajouter » en haut à droite" },
      { num: "7", text: "L'icône AK orange est sur ton écran d'accueil !" },
    ],
    tip: "Sur iPhone, l'app s'ouvre en plein écran sans la barre d'adresse de Safari. C'est exactement comme une vraie app.",
  },
  {
    id: "connexion",
    icon: "🔑",
    title: "Comment se connecter",
    steps: [
      { num: "1", text: "Ouvre l'app (icône AK sur ton écran d'accueil ou l'adresse dans ton navigateur)" },
      { num: "2", text: "Entre ton prénom (celui que ton gestionnaire a mis dans le système)" },
      { num: "3", text: "Entre ton code à 4 chiffres — c'est les 4 derniers chiffres de ton numéro de téléphone" },
      { num: "4", text: "Tu arrives sur ton tableau de bord. C'est tout !" },
    ],
    tip: "Exemple : si ton numéro est 450-555-8517, ton code est 8517. Si tu n'as pas de compte, clique « Nouveau ? Créer mon compte ».",
  },
  {
    id: "formation",
    icon: "🎓",
    title: "Formation (vidéos et quiz)",
    steps: [
      { num: "1", text: "Clique « Formation » dans le menu" },
      { num: "2", text: "Choisis un module, puis un chapitre" },
      { num: "3", text: "Regarde les vidéos dans l'ordre — tu ne peux pas avancer rapidement" },
      { num: "4", text: "Quand toutes les vidéos d'un chapitre sont complétées, le quiz se débloque" },
      { num: "5", text: "Réponds aux questions du quiz — tu vois immédiatement si c'est correct" },
    ],
    tip: "Ta progression est sauvegardée automatiquement. Tu peux fermer l'app et revenir plus tard.",
  },
  {
    id: "conversations",
    icon: "🎙️",
    title: "Conversations IA (vocal)",
    steps: [
      { num: "1", text: "Clique « Conversations » dans le menu" },
      { num: "2", text: "Clique « Démarrer la conversation »" },
      { num: "3", text: "L'IA va te saluer et te poser une question à voix haute" },
      { num: "4", text: "Maintiens le gros bouton orange et parle dans ton micro" },
      { num: "5", text: "Relâche le bouton — l'IA va répondre et te poser la prochaine question" },
    ],
    tip: "Utilise Chrome sur Android ou Safari sur iPhone. Le micro a besoin de ta permission — clique « Autoriser » quand le navigateur te le demande.",
  },
  {
    id: "qa",
    icon: "❓",
    title: "Q&A (questions sur le manuel)",
    steps: [
      { num: "1", text: "Clique « Q&A » dans le menu" },
      { num: "2", text: "Tape un mot-clé dans la barre (ex: casque, accident, caisse)" },
      { num: "3", text: "Des suggestions apparaissent — clique sur celle qui t'intéresse" },
      { num: "4", text: "Tu peux aussi cliquer sur les bulles en bas (Casques, Accident, Briefing, etc.)" },
    ],
    tip: "Le Q&A cherche directement dans le manuel de l'entreprise. C'est comme un Google pour les procédures d'Amigo Karting.",
  },
  {
    id: "fiche",
    icon: "📝",
    title: "Ma fiche personnelle",
    steps: [
      { num: "1", text: "Clique « Ma fiche » dans le menu" },
      { num: "2", text: "Remplis toutes tes informations : téléphone, adresse, contact d'urgence, taille de chandail" },
      { num: "3", text: "Clique « Sauvegarder »" },
    ],
    tip: "La barre de progression en haut te montre ce qu'il reste à remplir. Ton gestionnaire peut voir si ta fiche est complète ou non.",
  },
  {
    id: "note",
    icon: "⭐",
    title: "Ma note (score sur 100)",
    steps: [
      { num: "1", text: "Clique « Ma note » dans le menu" },
      { num: "2", text: "Tu vois ton score global sur 100" },
      { num: "3", text: "Le détail montre 4 catégories : Formation (40%), Quiz (30%), Conversations IA (20%), Q&A (10%)" },
      { num: "4", text: "En bas, des conseils personnalisés pour améliorer ta note" },
    ],
    tip: "Plus tu utilises l'app (vidéos, quiz, conversations, questions), plus ta note monte !",
  },
  {
    id: "problemes",
    icon: "🔧",
    title: "Problèmes fréquents",
    steps: [
      { num: "❌", text: "« Identifiant ou code incorrect » → Vérifie ton prénom (celui du système, pas un surnom) et les 4 derniers chiffres de ton numéro" },
      { num: "🎤", text: "Le micro ne marche pas → Utilise Chrome (Android) ou Safari (iPhone). Autorise le micro quand demandé." },
      { num: "📵", text: "L'app ne charge pas → Vérifie ta connexion internet (Wi-Fi ou données cellulaires)" },
      { num: "🗑️", text: "Désinstaller → Maintiens l'icône AK sur ton écran et supprime-la. Tu peux la remettre quand tu veux." },
    ],
    tip: "Si rien ne fonctionne, parle à ton gestionnaire.",
  },
];

export default function AidePage() {
  const [openId, setOpenId] = useState<string | null>("install-android");

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Aide</h1>
        <p className="text-sm text-gray-500">Comment utiliser l'application Amigo Karting</p>
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
              <svg
                className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 px-5 py-4">
                <div className="space-y-3">
                  {section.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                        {step.num}
                      </span>
                      <p className="pt-0.5 text-sm text-gray-700">{step.text}</p>
                    </div>
                  ))}
                </div>

                {section.tip && (
                  <div className="mt-4 rounded-lg border-l-4 border-orange-400 bg-orange-50 px-4 py-3">
                    <p className="text-xs text-orange-800">
                      <span className="font-semibold">💡 Astuce : </span>
                      {section.tip}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
