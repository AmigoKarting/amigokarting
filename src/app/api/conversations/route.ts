import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { handleConversation, generateGreeting } from "@/lib/openai/conversation";

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await req.json();
    const { action } = body;

    // ─── Auth ──────────────────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: employee } = await supabase
      .from("employees")
      .select("id, first_name")
      .eq("auth_user_id", user.id)
      .single();

    if (!employee) {
      return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });
    }

    // ─── Mode test ? ────────────────────────────────────────
    const isMock = process.env.USE_MOCK_AI === "true"
      || !process.env.OPENAI_API_KEY
      || process.env.OPENAI_API_KEY === "sk-...";

    // ─── Démarrer une session ──────────────────────────────
    if (action === "start") {
      let sessionId = `mock-${Date.now()}`;

      // Essayer de créer dans Supabase (si la table existe)
      try {
        const { data: session } = await supabaseAdmin
          .from("conversation_sessions")
          .insert({ employee_id: employee.id })
          .select("id")
          .single();
        if (session) sessionId = session.id;
      } catch {}

      // Greeting mock ou OpenAI
      let greeting: string;
      if (isMock) {
        greeting = `Salut ${employee.first_name} ! Prêt pour une petite révision ? On commence : c'est quoi la première chose à vérifier quand tu donnes un casque à un client ?`;
      } else {
        try {
          greeting = await generateGreeting(employee.first_name);
        } catch {
          greeting = `Salut ${employee.first_name} ! On va revoir les procédures ensemble. Première question : que fais-tu quand un client arrive chez Amigo Karting ?`;
        }
      }

      // Sauvegarder (ignorer si la table n'existe pas)
      try {
        await supabaseAdmin.from("conversation_messages").insert({
          session_id: sessionId,
          role: "ai",
          content: greeting,
        });
      } catch {}

      return NextResponse.json({ sessionId, greeting });
    }

    // ─── Envoyer un message ────────────────────────────────
    if (action === "message") {
      const { sessionId, message, history = [] } = body;

      if (!sessionId || !message) {
        return NextResponse.json({ error: "sessionId et message requis" }, { status: 400 });
      }

      let response: string;

      if (isMock) {
        response = getMockConversationResponse(message, history);
      } else {
        try {
          const result = await handleConversation({
            employeeId: employee.id,
            employeeName: employee.first_name,
            sessionId,
            message,
            history,
          });
          response = result.response;
        } catch {
          response = getMockConversationResponse(message, history)
            + "\n\n(⚠️ Réponse de secours — l'IA est temporairement indisponible)";
        }
      }

      return NextResponse.json({ response });
    }

    // ─── Terminer la session ───────────────────────────────
    if (action === "end") {
      const { sessionId, rating, ratingComment, durationSec } = body;

      if (!sessionId) {
        return NextResponse.json({ error: "sessionId requis" }, { status: 400 });
      }

      // Compter les messages de la session
      const { count: msgCount } = await supabaseAdmin
        .from("conversation_messages")
        .select("*", { count: "exact", head: true })
        .eq("session_id", sessionId)
        .eq("role", "ai");

      await supabaseAdmin
        .from("conversation_sessions")
        .update({
          ended_at: new Date().toISOString(),
          duration_sec: durationSec || 0,
          rating: rating || null,
          rating_comment: ratingComment || null,
          total_questions: msgCount || 0,
        })
        .eq("id", sessionId);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (err) {
    console.error("Erreur API conversations:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── Réponses mock pour les conversations ───────────────────────
// Utilise l'historique pour savoir où on en est dans la conversation
function getMockConversationResponse(message: string, history: any[] = []): string {
  const m = message.toLowerCase();
  const questionNumber = Math.floor(history.length / 2); // Chaque échange = 2 messages (user + ai)

  // D'abord, vérifier si la réponse correspond au sujet en cours
  // Réponses contextuelles basées sur les mots-clés
  const contextual = getContextualResponse(m);

  // Questions progressives — chaque fois l'IA pose une NOUVELLE question
  const questions = [
    "Bonne réponse ! Passons à autre chose : c'est quoi la procédure quand un casque est fissuré ?",
    "Bien ! On continue : à quelle fréquence on désinfecte les casques ?",
    "Exact ! Prochaine question : c'est quoi la distance minimale à garder entre deux karts sur la piste ?",
    "T'es bon ! Maintenant : quelles sont les étapes en cas d'accident sur la piste ?",
    "Ok ! Question suivante : que signifie le drapeau jaune ?",
    "Bien joué ! Allez : c'est quoi les étapes pour ouvrir le centre le matin ?",
    "Super ! Dis-moi : comment on fait la fermeture de la caisse à la fin de la journée ?",
    "Excellent ! Autre sujet : quels sont les forfaits qu'on offre aux clients ?",
    "T'as raison ! On passe à : que fais-tu si un client refuse de porter le casque ?",
    "Parfait ! Dernière question : c'est quoi les numéros d'urgence qu'on doit connaître ?",
    "Wow, t'as fait le tour ! Tu connais bien tes procédures. On peut continuer à réviser si tu veux, ou tu peux terminer la conversation.",
  ];

  // Combiner la réponse contextuelle + la prochaine question
  const nextQ = questionNumber < questions.length ? questions[questionNumber] : questions[questions.length - 1];

  if (contextual) {
    return contextual + " " + nextQ;
  }

  // Si on ne reconnaît pas la réponse, encourager quand même
  const encouragements = [
    "Pas tout à fait, mais c'est pas grave !",
    "C'est un bon effort !",
    "Presque ! On va revoir ça.",
    "Continue comme ça, tu progresses !",
  ];
  const randEncourage = encouragements[questionNumber % encouragements.length];

  return randEncourage + " " + nextQ;
}

function getContextualResponse(m: string): string | null {
  if (m.includes("casque") || m.includes("taille") || m.includes("ajustement"))
    return "Exact ! La taille et l'ajustement, c'est la base. Le casque doit pas bouger quand le client secoue la tête.";

  if (m.includes("fissur") || m.includes("bac rouge") || m.includes("défectueux") || m.includes("retir"))
    return "C'est ça ! On le retire immédiatement et on le met dans le bac rouge. On note le numéro dans le registre et on avise le gestionnaire.";

  if (m.includes("obligatoire") || m.includes("pas rouler") || m.includes("refus"))
    return "Parfait ! Le casque c'est non négociable, zéro exception.";

  if (m.includes("chaque") || m.includes("désinfect") || m.includes("spray"))
    return "Oui ! Après chaque utilisation avec le spray antibactérien bleu. Laisser sécher 30 secondes.";

  if (m.includes("2 mètre") || m.includes("deux mètre") || m.includes("longueur") || m.includes("distance"))
    return "C'est ça ! 2 mètres, environ une longueur de kart.";

  if (m.includes("drapeau rouge") || m.includes("arrêter") || m.includes("couper") || m.includes("urgence"))
    return "Oui ! Drapeau rouge, couper l'alimentation, sécuriser la zone, évaluer le pilote, appeler le 911 si nécessaire.";

  if (m.includes("jaune") || m.includes("ralentir") || m.includes("attention"))
    return "Exact ! Jaune = attention, ralentir, et surtout PAS DE DÉPASSEMENT.";

  if (m.includes("vert"))
    return "Oui ! Vert = départ ou course normale, tout va bien.";

  if (m.includes("damier") || m.includes("carreau") || m.includes("fin"))
    return "C'est ça ! Le damier = fin de course, dernier tour puis on rentre au stand.";

  if (m.includes("alarme") || m.includes("lumière") || m.includes("kart") || m.includes("ouverture") || m.includes("ouvrir"))
    return "Bien ! Désarmer l'alarme, allumer les lumières, vérifier la piste, inspecter les karts, préparer les casques, allumer les ordis, compter la caisse.";

  if (m.includes("caisse") || m.includes("rapport z") || m.includes("argent") || m.includes("comptant"))
    return "Exact ! Rapport Z, compter le comptant, vérifier que ça balance, enveloppe datée au coffre, laisser 200$ de fond de caisse.";

  if (m.includes("forfait") || m.includes("prix") || m.includes("tour simple"))
    return "C'est ça ! Tour simple, Forfait 3 tours (15% rabais), Forfait groupe (20%), et Forfait fête avec salle privée.";

  if (m.includes("911") || m.includes("poison") || m.includes("numéro"))
    return "Oui ! 911 pour les urgences, 1-800-463-5060 pour le centre antipoison, et le gestionnaire de garde sur le babillard.";

  if (m.includes("sais pas") || m.includes("aucune idée") || m.includes("pas sûr") || m.includes("je sais pas"))
    return "Pas de stress ! C'est normal de pas tout savoir. On est là pour apprendre.";

  return null;
}
