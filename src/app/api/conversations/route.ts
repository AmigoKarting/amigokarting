import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { handleConversation, generateGreeting } from "@/lib/openai/conversation";

interface AIContext {
  firstName: string;
  globalScore: number;
  formationPct: number;
  quizAvg: number;
  conversationHours: number;
  completedVideos: number;
  totalVideos: number;
  quizzesPassed: number;
  wrongAnswers: number;
  totalConversations: number;
  lastConversationDate: string | null;
  lastConversationRating: number | null;
  weakQuestions: string[];
  weakSubjects: string[];
  memories: Record<string, string>;
}

async function getEmployeeContext(employeeId: string): Promise<AIContext | null> {
  try {
    const { data: ctx } = await supabaseAdmin
      .from("employee_ai_context")
      .select("*")
      .eq("employee_id", employeeId)
      .single();

    const { data: mems } = await supabaseAdmin
      .from("ai_memory")
      .select("key, value")
      .eq("employee_id", employeeId);

    const memories: Record<string, string> = {};
    (mems || []).forEach((m: any) => { memories[m.key] = m.value; });

    if (!ctx) return null;

    return {
      firstName: ctx.first_name,
      globalScore: Math.round(ctx.global_score || 0),
      formationPct: Math.round(ctx.formation_pct || 0),
      quizAvg: Math.round((ctx.quiz_avg || 0) * 100),
      conversationHours: ctx.conversation_hours || 0,
      completedVideos: ctx.completed_videos || 0,
      totalVideos: ctx.total_videos || 0,
      quizzesPassed: ctx.quizzes_passed || 0,
      wrongAnswers: ctx.quiz_wrong_answers || 0,
      totalConversations: ctx.total_conversations || 0,
      lastConversationDate: ctx.last_conversation_date,
      lastConversationRating: ctx.last_conversation_rating,
      weakQuestions: ctx.weak_questions ? ctx.weak_questions.split(" | ") : [],
      weakSubjects: ctx.weak_subjects ? ctx.weak_subjects.split(" | ") : [],
      memories,
    };
  } catch {
    return null;
  }
}

async function saveMemory(employeeId: string, key: string, value: string) {
  try {
    await supabaseAdmin
      .from("ai_memory")
      .upsert({ employee_id: employeeId, key, value, updated_at: new Date().toISOString() }, 
        { onConflict: "employee_id,key" });
  } catch {}
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await req.json();
    const { action } = body;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { data: employee } = await supabase
      .from("employees")
      .select("id, first_name")
      .eq("auth_user_id", user.id)
      .single();

    if (!employee) return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });

    const isMock = process.env.USE_MOCK_AI === "true"
      || !process.env.OPENAI_API_KEY
      || process.env.OPENAI_API_KEY === "sk-...";

    // ─── Démarrer une session ──────────────────────────────
    if (action === "start") {
      let sessionId = `mock-${Date.now()}`;

      try {
        const { data: session } = await supabaseAdmin
          .from("conversation_sessions")
          .insert({ employee_id: employee.id })
          .select("id")
          .single();
        if (session) sessionId = session.id;
      } catch {}

      // Charger le contexte
      const ctx = await getEmployeeContext(employee.id);

      let greeting: string;
      if (isMock) {
        greeting = buildSmartGreeting(ctx);
      } else {
        try {
          greeting = await generateGreeting(employee.first_name);
        } catch {
          greeting = buildSmartGreeting(ctx);
        }
      }

      try {
        await supabaseAdmin.from("conversation_messages").insert({
          session_id: sessionId, role: "ai", content: greeting,
        });
      } catch {}

      // Sauvegarder la date de dernière conversation
      await saveMemory(employee.id, "last_session_start", new Date().toISOString());

      return NextResponse.json({ sessionId, greeting });
    }

    // ─── Envoyer un message ────────────────────────────────
    if (action === "message") {
      const { sessionId, message, history = [] } = body;

      if (!sessionId || !message) {
        return NextResponse.json({ error: "sessionId et message requis" }, { status: 400 });
      }

      // Charger le contexte
      const ctx = await getEmployeeContext(employee.id);

      let response: string;

      if (isMock) {
        response = getSmartMockResponse(message, history, ctx);
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
          response = getSmartMockResponse(message, history, ctx);
        }
      }

      // Sauvegarder les messages
      try {
        await supabaseAdmin.from("conversation_messages").insert([
          { session_id: sessionId, role: "user", content: message },
          { session_id: sessionId, role: "ai", content: response },
        ]);
      } catch {}

      // Compter les erreurs de l'employé dans cette conversation
      const errorCount = history.filter((h: any) => 
        h.role === "assistant" && (
          h.content.includes("Pas tout à fait") || 
          h.content.includes("Pas exactement") ||
          h.content.includes("pas grave") ||
          h.content.includes("Presque")
        )
      ).length;

      if (errorCount > 0) {
        await saveMemory(employee.id, "last_error_count", String(errorCount));
      }

      return NextResponse.json({ response });
    }

    // ─── Terminer la session ───────────────────────────────
    if (action === "end") {
      const { sessionId, rating, ratingComment, durationSec } = body;
      if (!sessionId) return NextResponse.json({ error: "sessionId requis" }, { status: 400 });

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

      // Sauvegarder en mémoire
      await saveMemory(employee.id, "last_session_duration", String(durationSec || 0));
      await saveMemory(employee.id, "last_session_messages", String(msgCount || 0));
      if (rating) await saveMemory(employee.id, "last_rating", String(rating));

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (err) {
    console.error("Erreur API conversations:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── Greeting intelligent avec contexte ─────────────────────────
function buildSmartGreeting(ctx: AIContext | null): string {
  if (!ctx) return "Salut ! Prêt pour une révision ? Première question : c'est quoi la première chose à vérifier quand tu donnes un casque à un client ?";

  const name = ctx.firstName;
  const parts: string[] = [];

  // Salutation personnalisée
  if (ctx.totalConversations === 0) {
    parts.push(`Salut ${name} ! C'est ta première conversation avec moi, bienvenue !`);
  } else if (ctx.lastConversationDate) {
    const days = Math.floor((Date.now() - new Date(ctx.lastConversationDate).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) parts.push(`Re-salut ${name} ! Encore une session aujourd'hui, j'aime ta motivation !`);
    else if (days === 1) parts.push(`Salut ${name} ! Content de te revoir, c'était bien hier !`);
    else if (days < 7) parts.push(`Hey ${name} ! Ça fait ${days} jours, on se remet dedans ?`);
    else parts.push(`Salut ${name} ! Ça fait un moment ! Content de te retrouver.`);
  } else {
    parts.push(`Salut ${name} !`);
  }

  // Commentaire sur le score
  if (ctx.globalScore >= 80) {
    parts.push(`Ton score est à ${ctx.globalScore} sur 100, c'est excellent !`);
  } else if (ctx.globalScore >= 50) {
    parts.push(`Ton score est à ${ctx.globalScore} sur 100, on va l'améliorer ensemble.`);
  } else if (ctx.globalScore > 0) {
    parts.push(`Ton score est à ${ctx.globalScore} sur 100, on a du travail mais c'est correct !`);
  }

  // Cibler les sujets faibles
  if (ctx.weakSubjects.length > 0) {
    parts.push(`Je vois que t'as de la difficulté avec ${ctx.weakSubjects[0]}. On va travailler ça.`);
    // Poser une question sur le sujet faible
    const weakQ = getQuestionForSubject(ctx.weakSubjects[0]);
    parts.push(weakQ);
  } else if (ctx.weakQuestions.length > 0) {
    parts.push("On va revoir les questions que t'as ratées au quiz.");
    parts.push(`Première question : ${simplifyQuestion(ctx.weakQuestions[0])}`);
  } else {
    parts.push("On commence : c'est quoi la première chose à vérifier quand tu donnes un casque à un client ?");
  }

  return parts.join(" ");
}

// ─── Réponses mock intelligentes ────────────────────────────────
function getSmartMockResponse(message: string, history: any[], ctx: AIContext | null): string {
  const m = message.toLowerCase();
  const questionNumber = Math.floor(history.length / 2);

  // Réponse contextuelle basée sur les mots-clés
  const contextual = getContextualResponse(m);

  // Questions adaptées au profil de l'employé
  const questions = buildAdaptiveQuestions(ctx);
  const nextQ = questionNumber < questions.length ? questions[questionNumber] : questions[questions.length - 1];

  if (contextual) {
    // Féliciter différemment selon le score
    let praise = "";
    if (ctx && ctx.globalScore >= 80) {
      praise = "Comme d'habitude, t'es solide ! ";
    } else if (ctx && ctx.wrongAnswers > 5) {
      praise = "Eh ben ! Tu t'améliores ! ";
    }
    return praise + contextual + " " + nextQ;
  }

  // Réponse incorrecte — adapter selon l'historique
  let encouragement: string;
  if (ctx && ctx.wrongAnswers > 10) {
    encouragement = "C'est pas grave, on est là pour apprendre ! Rappelle-toi : ";
  } else if (ctx && ctx.totalConversations > 3) {
    encouragement = "Presque ! T'as déjà vu ça, essaie de te rappeler : ";
  } else {
    encouragement = "Pas tout à fait, mais continue ! ";
  }

  // Donner un indice basé sur la question en cours
  const hint = getHintForQuestion(questionNumber);

  return encouragement + hint + " " + nextQ;
}

function buildAdaptiveQuestions(ctx: AIContext | null): string[] {
  const baseQuestions = [
    "Passons à autre chose : c'est quoi la procédure quand un casque est fissuré ?",
    "On continue : à quelle fréquence on désinfecte les casques ?",
    "Prochaine question : c'est quoi la distance minimale entre deux karts sur la piste ?",
    "Maintenant : quelles sont les étapes en cas d'accident sur la piste ?",
    "Question suivante : que signifie le drapeau jaune ?",
    "Allez : c'est quoi les étapes pour ouvrir le centre le matin ?",
    "Dis-moi : comment on fait la fermeture de la caisse ?",
    "Autre sujet : quels sont les forfaits qu'on offre aux clients ?",
    "On passe à : que fais-tu si un client refuse le casque ?",
    "C'est quoi les numéros d'urgence qu'on doit connaître ?",
  ];

  if (!ctx || ctx.weakQuestions.length === 0) return baseQuestions;

  // Insérer les questions faibles en priorité
  const adapted = [...baseQuestions];
  ctx.weakQuestions.slice(0, 3).forEach((wq, i) => {
    if (i < adapted.length) {
      adapted.splice(i * 3, 0, `On revient sur une question que t'as ratée au quiz : ${simplifyQuestion(wq)}`);
    }
  });

  // Ajouter des questions sur les sujets faibles
  ctx.weakSubjects.forEach((ws) => {
    const q = getQuestionForSubject(ws);
    if (q && !adapted.includes(q)) {
      adapted.push(q);
    }
  });

  adapted.push("Tu t'es bien amélioré ! On peut continuer ou tu peux terminer la conversation.");

  return adapted;
}

function getQuestionForSubject(subject: string): string {
  const s = subject.toLowerCase();
  if (s.includes("sécurité")) return "Question sécurité : c'est quoi les 3 règles de base sur la piste ?";
  if (s.includes("casque")) return "Parlons casques : comment tu vérifies qu'un casque est en bon état ?";
  if (s.includes("urgence")) return "Sujet important : décris-moi les étapes en cas d'accident grave.";
  if (s.includes("opération")) return "Côté opérations : c'est quoi la procédure d'ouverture du centre ?";
  if (s.includes("client") || s.includes("accueil")) return "Service client : comment tu accueilles un nouveau client qui arrive ?";
  if (s.includes("caisse")) return "Question caisse : c'est quoi les étapes de fermeture de la caisse ?";
  return "Question générale : c'est quoi le plus important à retenir selon toi ?";
}

function simplifyQuestion(question: string): string {
  // Tronquer si trop long pour l'oral
  if (question.length > 100) return question.substring(0, 100) + "... ?";
  if (!question.endsWith("?")) return question + " ?";
  return question;
}

function getHintForQuestion(qNum: number): string {
  const hints = [
    "Pense au bac rouge et au registre.",
    "C'est après chaque utilisation, avec le spray bleu.",
    "Pense à une longueur de kart.",
    "Drapeau rouge, couper l'alimentation, sécuriser.",
    "C'est le drapeau qui veut dire attention et pas de dépassement.",
    "Alarme, lumières, piste, karts, casques, ordis, caisse.",
    "Rapport Z, compter le comptant, enveloppe au coffre.",
    "Tour simple, forfait 3 tours, forfait groupe, forfait fête.",
    "Le casque c'est obligatoire, zéro exception.",
    "911, centre antipoison, et le gestionnaire de garde.",
  ];
  return hints[qNum % hints.length];
}

function getContextualResponse(m: string): string | null {
  if (m.includes("casque") || m.includes("taille") || m.includes("ajustement"))
    return "Exact ! La taille et l'ajustement, c'est la base. Le casque doit pas bouger quand le client secoue la tête.";

  if (m.includes("fissur") || m.includes("bac rouge") || m.includes("défectueux") || m.includes("retir"))
    return "C'est ça ! On le retire immédiatement et on le met dans le bac rouge. On note le numéro dans le registre.";

  if (m.includes("obligatoire") || m.includes("pas rouler") || m.includes("refus"))
    return "Parfait ! Le casque c'est non négociable, zéro exception.";

  if (m.includes("chaque") || m.includes("désinfect") || m.includes("spray"))
    return "Oui ! Après chaque utilisation avec le spray antibactérien bleu. Laisser sécher 30 secondes.";

  if (m.includes("2 mètre") || m.includes("deux mètre") || m.includes("longueur") || m.includes("distance"))
    return "C'est ça ! 2 mètres, environ une longueur de kart.";

  if (m.includes("drapeau rouge") || m.includes("arrêter") || m.includes("couper") || m.includes("urgence"))
    return "Oui ! Drapeau rouge, couper l'alimentation, sécuriser la zone, appeler le 911 si nécessaire.";

  if (m.includes("jaune") || m.includes("ralentir") || m.includes("attention"))
    return "Exact ! Jaune = attention, ralentir, PAS DE DÉPASSEMENT.";

  if (m.includes("vert"))
    return "Oui ! Vert = départ ou course normale, tout va bien.";

  if (m.includes("damier") || m.includes("carreau") || m.includes("fin"))
    return "C'est ça ! Le damier = fin de course, dernier tour puis on rentre au stand.";

  if (m.includes("alarme") || m.includes("lumière") || m.includes("ouvrir") || m.includes("ouverture"))
    return "Bien ! Désarmer l'alarme, allumer les lumières, vérifier la piste, inspecter les karts, préparer les casques, allumer les ordis, compter la caisse.";

  if (m.includes("caisse") || m.includes("rapport z") || m.includes("argent") || m.includes("comptant"))
    return "Exact ! Rapport Z, compter le comptant, vérifier le balance, enveloppe datée au coffre, 200$ de fond de caisse.";

  if (m.includes("forfait") || m.includes("prix") || m.includes("tour simple"))
    return "C'est ça ! Tour simple, Forfait 3 tours (15% rabais), Forfait groupe (20%), et Forfait fête avec salle privée.";

  if (m.includes("911") || m.includes("poison") || m.includes("numéro"))
    return "Oui ! 911 pour les urgences, 1-800-463-5060 pour le centre antipoison, et le gestionnaire de garde sur le babillard.";

  if (m.includes("sais pas") || m.includes("aucune idée") || m.includes("pas sûr") || m.includes("je sais pas"))
    return "Pas de stress ! C'est normal de pas tout savoir. Je vais t'aider.";

  if (m.includes("accueil") || m.includes("bienvenue") || m.includes("bonjour client"))
    return "Bien ! On les accueille avec le sourire, on leur explique les règles de sécurité, on ajuste le casque, et on leur montre la piste.";

  if (m.includes("pluie") || m.includes("météo") || m.includes("mouillé"))
    return "Bonne réponse ! Piste mouillée = réduire la vitesse max des karts et aviser les clients des conditions.";

  return null;
}
