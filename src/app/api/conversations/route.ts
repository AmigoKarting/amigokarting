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
  if (ctx.weakQuestions.length > 0 && ctx.weakSubjects.length > 0) {
    parts.push(`J'ai regardé tes résultats de quiz. T'as ${ctx.wrongAnswers} erreur${ctx.wrongAnswers > 1 ? "s" : ""}, surtout en ${ctx.weakSubjects[0]}. On va se concentrer là-dessus aujourd'hui.`);
    parts.push(`Première question : ${simplifyQuestion(ctx.weakQuestions[0])}`);
  } else if (ctx.weakQuestions.length > 0) {
    parts.push(`T'as raté ${ctx.wrongAnswers} question${ctx.wrongAnswers > 1 ? "s" : ""} au quiz. On va les revoir ensemble.`);
    parts.push(`On commence par celle-ci : ${simplifyQuestion(ctx.weakQuestions[0])}`);
  } else if (ctx.weakSubjects.length > 0) {
    parts.push(`Je vois que ${ctx.weakSubjects[0]} c'est ton point faible. On va travailler ça.`);
    const weakQ = getQuestionForSubject(ctx.weakSubjects[0]);
    parts.push(weakQ);
  } else if (ctx.formationPct < 50) {
    parts.push(`T'as complété ${ctx.formationPct}% de ta formation. On va quand même réviser les bases.`);
    parts.push("Première question : c'est quoi la première chose à vérifier quand tu donnes un casque à un client ?");
  } else if (ctx.globalScore >= 80) {
    parts.push("T'as un super score ! On va approfondir avec des questions plus avancées.");
    parts.push("Question : si un casque est trop grand mais que c'est le dernier de cette taille, tu fais quoi ?");
  } else {
    parts.push("On commence : c'est quoi la première chose à vérifier quand tu donnes un casque à un client ?");
  }

  return parts.join(" ");
}

// ─── Réponses mock intelligentes avec 3 niveaux ─────────────────
function getSmartMockResponse(message: string, history: any[], ctx: AIContext | null): string {
  const m = message.toLowerCase();
  const questionNumber = Math.floor(history.length / 2);

  // Analyser la qualité de la réponse
  const analysis = analyzeAnswer(m, questionNumber);

  // Questions adaptées au profil
  const questions = buildAdaptiveQuestions(ctx);
  const nextQ = questionNumber < questions.length ? questions[questionNumber] : questions[questions.length - 1];

  // ─── EXCELLENTE réponse → Féliciter + approfondir ─────
  if (analysis.quality === "excellent") {
    const praises = [
      "Wow, c'est une réponse complète !",
      "Exactement ! T'as tout compris.",
      "Parfait, t'as rien oublié !",
      "Impressionnant, c'est la réponse parfaite.",
      "Bravo ! C'est exactement ce qu'on attend.",
    ];
    const praise = praises[questionNumber % praises.length];
    
    // Approfondir avec une question bonus
    const deeperQ = getDeeperQuestion(questionNumber);
    
    if (ctx && ctx.globalScore >= 80) {
      return `${praise} Comme d'habitude, t'es un pro ! ${analysis.feedback} Petite question bonus : ${deeperQ}`;
    }
    return `${praise} ${analysis.feedback} Pour aller plus loin : ${deeperQ}`;
  }

  // ─── MOYENNE réponse → Aider et compléter ─────────────
  if (analysis.quality === "average") {
    const helps = [
      "T'es sur la bonne piste !",
      "C'est un bon début !",
      "T'as une partie de la réponse.",
      "Presque ! T'es pas loin.",
      "C'est correct, mais il manque des détails.",
    ];
    const help = helps[questionNumber % helps.length];
    
    return `${help} ${analysis.feedback} Ce qui te manque : ${analysis.missing} ${nextQ}`;
  }

  // ─── MAUVAISE réponse → Corriger simplement ───────────
  const corrections = [
    "C'est pas tout à fait ça, mais c'est pas grave !",
    "Pas exactement. Voici la bonne réponse :",
    "Non, mais t'inquiète, on est là pour apprendre.",
    "C'est pas ça, mais retiens bien ceci :",
  ];
  const correction = corrections[questionNumber % corrections.length];

  // Adapter selon le profil
  if (ctx && ctx.totalConversations > 5) {
    return `${correction} ${analysis.correctAnswer} Rappelle-toi de ça pour la prochaine fois. ${nextQ}`;
  }
  return `${correction} ${analysis.correctAnswer} ${nextQ}`;
}

// ─── Analyser la qualité d'une réponse ──────────────────────────
interface AnswerAnalysis {
  quality: "excellent" | "average" | "bad";
  feedback: string;
  missing: string;
  correctAnswer: string;
}

function analyzeAnswer(m: string, questionNumber: number): AnswerAnalysis {
  // Définir les réponses attendues par question
  const expectations: {
    excellent: string[];  // Mots-clés pour une réponse complète
    average: string[];    // Mots-clés partiels
    feedback: string;     // Feedback positif
    missing: string;      // Ce qui manque
    correct: string;      // Réponse complète
  }[] = [
    { // Q0: Casque - vérifier quoi
      excellent: ["taille", "ajust", "bouge pas", "secoue"],
      average: ["casque", "taille"],
      feedback: "La taille et l'ajustement, c'est la base. Il faut que le casque bouge pas quand le client secoue la tête.",
      missing: "il faut vérifier que le casque bouge pas quand le client secoue la tête.",
      correct: "Quand tu donnes un casque, tu vérifies la taille et l'ajustement. Le casque doit pas bouger quand le client secoue la tête.",
    },
    { // Q1: Casque fissuré
      excellent: ["retir", "bac rouge", "registre", "gestionnaire"],
      average: ["retir", "bac rouge"],
      feedback: "On retire, bac rouge, registre et on avise le gestionnaire. Procédure complète !",
      missing: "il faut aussi noter le numéro dans le registre et aviser le gestionnaire.",
      correct: "Un casque fissuré : on le retire immédiatement, on le met dans le bac rouge, on note le numéro dans le registre et on avise le gestionnaire.",
    },
    { // Q2: Désinfection casques
      excellent: ["chaque", "spray", "bleu", "30 seconde"],
      average: ["chaque", "spray"],
      feedback: "Spray antibactérien bleu après chaque utilisation, 30 secondes de séchage.",
      missing: "c'est le spray antibactérien bleu, et il faut laisser sécher 30 secondes.",
      correct: "On désinfecte après chaque utilisation avec le spray antibactérien bleu. On laisse sécher 30 secondes avant de le redonner.",
    },
    { // Q3: Distance entre karts
      excellent: ["2 mètre", "deux mètre", "longueur de kart"],
      average: ["mètre", "distance", "longueur"],
      feedback: "2 mètres, c'est environ une longueur de kart. Facile à retenir !",
      missing: "c'est exactement 2 mètres, environ une longueur de kart.",
      correct: "La distance minimale entre deux karts c'est 2 mètres, environ une longueur de kart.",
    },
    { // Q4: Accident sur la piste
      excellent: ["drapeau rouge", "couper", "sécuriser", "911"],
      average: ["arrêter", "drapeau"],
      feedback: "Drapeau rouge, couper l'alimentation, sécuriser la zone, évaluer le pilote, 911 si nécessaire.",
      missing: "la séquence complète c'est : drapeau rouge, couper l'alimentation, sécuriser, évaluer et 911 si nécessaire.",
      correct: "En cas d'accident : drapeau rouge, couper l'alimentation des karts, sécuriser la zone, évaluer le pilote, appeler le 911 si nécessaire.",
    },
    { // Q5: Drapeau jaune
      excellent: ["ralentir", "pas de dépassement", "attention"],
      average: ["ralentir", "attention"],
      feedback: "Jaune = attention, ralentir et AUCUN dépassement permis.",
      missing: "le plus important c'est : PAS DE DÉPASSEMENT quand le jaune est sorti.",
      correct: "Le drapeau jaune signifie attention, il faut ralentir et il n'y a aucun dépassement permis.",
    },
    { // Q6: Ouverture du centre
      excellent: ["alarme", "lumière", "piste", "kart", "casque", "caisse"],
      average: ["alarme", "lumière"],
      feedback: "Alarme, lumières, piste, karts, casques, ordis, caisse. T'as tout la séquence !",
      missing: "la séquence complète c'est : alarme, lumières, vérifier la piste, inspecter les karts, préparer les casques, allumer les ordis, compter la caisse.",
      correct: "Pour ouvrir : désarmer l'alarme, allumer les lumières, vérifier la piste, inspecter les karts, préparer les casques, allumer les ordis et compter la caisse.",
    },
    { // Q7: Fermeture caisse
      excellent: ["rapport z", "comptant", "enveloppe", "coffre", "200"],
      average: ["rapport", "compter"],
      feedback: "Rapport Z, compter le comptant, vérifier le balance, enveloppe datée au coffre, laisser 200$ de fond de caisse.",
      missing: "il faut faire le Rapport Z, compter le comptant, mettre dans l'enveloppe datée au coffre et laisser 200$ de fond de caisse.",
      correct: "Pour fermer la caisse : faire le Rapport Z, compter le comptant, vérifier que ça balance, enveloppe datée au coffre, laisser 200$ de fond de caisse.",
    },
    { // Q8: Forfaits
      excellent: ["tour simple", "3 tour", "groupe", "fête"],
      average: ["forfait", "tour"],
      feedback: "Tour simple, Forfait 3 tours (15% rabais), Forfait groupe (20%), Forfait fête avec salle privée. Complet !",
      missing: "on a : Tour simple, Forfait 3 tours (15% rabais), Forfait groupe (20% rabais), et Forfait fête avec salle privée.",
      correct: "Les forfaits : Tour simple, Forfait 3 tours (15% rabais), Forfait groupe (20% rabais), et Forfait fête avec salle privée.",
    },
    { // Q9: Client refuse casque
      excellent: ["obligatoire", "pas rouler", "exception", "non négociable"],
      average: ["obligatoire", "pas rouler"],
      feedback: "Le casque c'est non négociable, zéro exception. Pas de casque = pas de kart.",
      missing: "c'est simple : le casque est obligatoire, zéro exception. Pas de casque, pas de kart.",
      correct: "Si un client refuse le casque, il ne peut tout simplement pas rouler. C'est obligatoire, zéro exception. Pas de casque = pas de kart.",
    },
    { // Q10: Numéros d'urgence
      excellent: ["911", "poison", "1-800", "gestionnaire", "babillard"],
      average: ["911", "gestionnaire"],
      feedback: "911 pour les urgences, 1-800-463-5060 pour le centre antipoison, et le gestionnaire de garde sur le babillard.",
      missing: "les 3 numéros : 911, centre antipoison (1-800-463-5060), et le numéro du gestionnaire de garde sur le babillard.",
      correct: "Les numéros d'urgence : 911, centre antipoison 1-800-463-5060, et le gestionnaire de garde (numéro sur le babillard).",
    },
  ];

  const idx = questionNumber % expectations.length;
  const exp = expectations[idx];

  // Vérifier si "je sais pas" ou réponse vide
  if (m.includes("sais pas") || m.includes("aucune idée") || m.includes("pas sûr") || m.length < 5) {
    return { quality: "bad", feedback: "", missing: "", correctAnswer: exp.correct };
  }

  // Compter les mots-clés excellents trouvés
  const excellentHits = exp.excellent.filter((kw) => m.includes(kw)).length;
  const averageHits = exp.average.filter((kw) => m.includes(kw)).length;

  // Excellente : au moins 3 mots-clés excellents OU tous les mots-clés moyens + 1 excellent
  if (excellentHits >= 3 || (averageHits >= exp.average.length && excellentHits >= 1)) {
    return { quality: "excellent", feedback: exp.feedback, missing: "", correctAnswer: "" };
  }

  // Moyenne : au moins 1 mot-clé moyen
  if (averageHits >= 1 || excellentHits >= 1) {
    return { quality: "average", feedback: "", missing: exp.missing, correctAnswer: "" };
  }

  // Mauvaise : aucun mot-clé reconnu
  return { quality: "bad", feedback: "", missing: "", correctAnswer: exp.correct };
}

// ─── Questions d'approfondissement (pour les réponses excellentes) ─
function getDeeperQuestion(questionNumber: number): string {
  const deeper = [
    "Si le casque est trop grand mais que c'est le dernier de cette taille, tu fais quoi ?",
    "Et si tu trouves 3 casques fissurés d'un coup, c'est quoi la priorité ?",
    "Est-ce qu'on utilise le même spray pour les casques et pour les karts ?",
    "Si un kart colle à celui d'en avant mais respecte la distance, c'est correct ?",
    "Si un pilote a l'air correct après un accident mais dit qu'il a mal à la tête, tu fais quoi ?",
    "Quelle est la différence entre le drapeau jaune et le drapeau rouge ?",
    "Si l'alarme se déclenche par erreur pendant l'ouverture, c'est quoi la procédure ?",
    "Si la caisse est en surplus de 20$, tu fais quoi avec le surplus ?",
    "Un client veut un forfait fête mais il y a déjà une réservation ce jour-là. Comment tu gères ça ?",
    "Un enfant de 6 ans veut rouler mais il est trop petit pour le casque. Tu fais quoi ?",
    "Si tu peux pas joindre le gestionnaire de garde, c'est quoi ton plan B ?",
  ];
  return deeper[questionNumber % deeper.length];
}

function buildAdaptiveQuestions(ctx: AIContext | null): string[] {
  const baseQuestions = [
    "C'est quoi la procédure quand un casque est fissuré ?",
    "À quelle fréquence on désinfecte les casques ?",
    "C'est quoi la distance minimale entre deux karts sur la piste ?",
    "Quelles sont les étapes en cas d'accident sur la piste ?",
    "Que signifie le drapeau jaune ?",
    "C'est quoi les étapes pour ouvrir le centre le matin ?",
    "Comment on fait la fermeture de la caisse ?",
    "Quels sont les forfaits qu'on offre aux clients ?",
    "Que fais-tu si un client refuse le casque ?",
    "C'est quoi les numéros d'urgence qu'on doit connaître ?",
  ];

  if (!ctx) return baseQuestions.map((q, i) => (i === 0 ? "On commence : " : "Question suivante : ") + q);

  const priorityQuestions: string[] = [];

  // ─── PRIORITÉ 1 : Questions ratées au quiz (les plus importantes) ─
  if (ctx.weakQuestions.length > 0) {
    ctx.weakQuestions.slice(0, 5).forEach((wq) => {
      priorityQuestions.push(`Tu as raté cette question au quiz, on la revoit : ${simplifyQuestion(wq)}`);
    });
  }

  // ─── PRIORITÉ 2 : Sujets faibles (catégories avec le plus d'erreurs) ─
  if (ctx.weakSubjects.length > 0) {
    ctx.weakSubjects.forEach((ws) => {
      const questions = getMultipleQuestionsForSubject(ws);
      questions.forEach((q) => {
        if (!priorityQuestions.some((pq) => pq.includes(q))) {
          priorityQuestions.push(`On travaille ton point faible (${ws}) : ${q}`);
        }
      });
    });
  }

  // ─── PRIORITÉ 3 : Sujets pas encore couverts en formation ─
  if (ctx.formationPct < 100 && ctx.completedVideos < ctx.totalVideos) {
    priorityQuestions.push("T'as pas encore fini ta formation vidéo. En attendant, dis-moi : c'est quoi les règles de sécurité de base sur la piste ?");
    priorityQuestions.push("Autre question de base : comment tu accueilles un client quand il arrive ?");
  }

  // ─── PRIORITÉ 4 : Si le score de quiz est bas, réviser les bases ─
  if (ctx.quizAvg < 60) {
    priorityQuestions.push("On revoit les bases : c'est quoi la première chose à faire quand un client arrive ?");
    priorityQuestions.push("Question de base : pourquoi le casque est obligatoire ?");
    priorityQuestions.push("Révision : c'est quoi la différence entre le drapeau jaune et le drapeau rouge ?");
  }

  // ─── Compléter avec les questions de base pas encore posées ─
  baseQuestions.forEach((bq) => {
    if (!priorityQuestions.some((pq) => pq.toLowerCase().includes(bq.toLowerCase().slice(0, 30)))) {
      priorityQuestions.push("Question suivante : " + bq);
    }
  });

  priorityQuestions.push("Tu t'es bien amélioré ! On peut continuer ou tu peux terminer la conversation.");

  return priorityQuestions;
}

// ─── Plusieurs questions par sujet faible ───────────────────────
function getMultipleQuestionsForSubject(subject: string): string[] {
  const s = subject.toLowerCase();
  
  if (s.includes("sécurité")) return [
    "C'est quoi les 3 règles de base sur la piste ?",
    "Que fais-tu si un client enlève son casque pendant la course ?",
    "Comment tu réagis si tu vois un kart qui va trop vite ?",
  ];
  if (s.includes("casque")) return [
    "Comment tu vérifies qu'un casque est en bon état ?",
    "C'est quoi la procédure pour un casque fissuré ?",
    "Quand est-ce qu'on désinfecte les casques ?",
  ];
  if (s.includes("urgence")) return [
    "Décris-moi les étapes en cas d'accident grave.",
    "C'est quoi les numéros d'urgence à connaître ?",
    "Que fais-tu si un client perd connaissance sur la piste ?",
  ];
  if (s.includes("opération")) return [
    "C'est quoi la procédure d'ouverture du centre ?",
    "Comment on ferme le centre à la fin de la journée ?",
    "Que fais-tu si un équipement est brisé ?",
  ];
  if (s.includes("client") || s.includes("accueil")) return [
    "Comment tu accueilles un nouveau client ?",
    "Un client se plaint que c'est trop cher, tu fais quoi ?",
    "Comment tu gères un groupe de 15 personnes qui arrive ?",
  ];
  if (s.includes("caisse")) return [
    "C'est quoi les étapes de fermeture de la caisse ?",
    "Si la caisse ne balance pas, tu fais quoi ?",
    "Combien on laisse de fond de caisse ?",
  ];
  if (s.includes("drapeau")) return [
    "Que signifie le drapeau jaune ?",
    "Que signifie le drapeau rouge ?",
    "C'est quoi le drapeau à damier ?",
  ];
  
  return ["C'est quoi le plus important à retenir dans ce sujet ?"];
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
