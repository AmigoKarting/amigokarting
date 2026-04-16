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
      const { simulationId } = body;
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
      if (simulationId) {
        greeting = getSimulationIntro(simulationId, ctx?.firstName || employee.first_name);
      } else if (isMock) {
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
      const { sessionId, message, history = [], simulationId } = body;

      if (!sessionId || !message) {
        return NextResponse.json({ error: "sessionId et message requis" }, { status: 400 });
      }

      // Charger le contexte
      const ctx = await getEmployeeContext(employee.id);

      let response: string;

      if (simulationId) {
        response = getSimulationResponse(simulationId, message, history);
      } else if (isMock) {
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

// ─── Greeting intelligent — personnalité chef formateur ─────────
function buildSmartGreeting(ctx: AIContext | null): string {
  if (!ctx) return "Hey ! C'est ton chef formateur. Ici on travaille sérieusement mais on a du fun. Montre-moi ce que tu sais. Première question : c'est quoi la première chose à vérifier quand tu donnes un casque à un client ? Vas-y, impressionne-moi.";

  const name = ctx.firstName;
  const parts: string[] = [];

  // Salutation directe et motivante
  if (ctx.totalConversations === 0) {
    parts.push(`${name} ! Bienvenue dans ton entraînement. Je suis ton chef formateur. Mon job c'est de m'assurer que tu sois le meilleur employé qu'Amigo Karting a jamais eu. On va travailler fort, mais je crois en toi.`);
  } else if (ctx.lastConversationDate) {
    const days = Math.floor((Date.now() - new Date(ctx.lastConversationDate).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) parts.push(`${name} ! Deux sessions la même journée ? J'aime cette attitude. C'est comme ça qu'on devient le meilleur.`);
    else if (days === 1) parts.push(`${name} ! De retour aujourd'hui, c'est ça l'engagement. On lâche pas.`);
    else if (days < 7) parts.push(`${name} ! Ça fait ${days} jours. C'est correct, mais les champions s'entraînent tous les jours. On se rattrape maintenant.`);
    else parts.push(`${name} ! Ça fait trop longtemps. Un bon employé s'entraîne régulièrement. Mais t'es là, c'est ce qui compte. On recommence fort.`);
  } else {
    parts.push(`${name} ! Ton chef formateur est prêt. Et toi, t'es prêt ?`);
  }

  // Score — direct et exigeant
  if (ctx.globalScore >= 90) {
    parts.push(`Ton score est à ${ctx.globalScore}. C'est excellent. Mais on vise le 100. On arrête jamais de s'améliorer.`);
  } else if (ctx.globalScore >= 70) {
    parts.push(`Ton score est à ${ctx.globalScore}. C'est bien, mais je sais que t'es capable de plus. On va pousser ça vers le 90 aujourd'hui.`);
  } else if (ctx.globalScore >= 50) {
    parts.push(`Ton score est à ${ctx.globalScore}. Honnêtement, je m'attends à mieux de toi. On va corriger ça maintenant.`);
  } else if (ctx.globalScore > 0) {
    parts.push(`Ton score est à ${ctx.globalScore}. C'est en dessous de ce que je veux voir. Mais c'est pour ça que je suis là — on va remonter ça ensemble.`);
  }

  // Cibler les faiblesses — direct
  if (ctx.weakQuestions.length > 0 && ctx.weakSubjects.length > 0) {
    parts.push(`J'ai analysé tes résultats. T'as ${ctx.wrongAnswers} erreur${ctx.wrongAnswers > 1 ? "s" : ""}, principalement en ${ctx.weakSubjects[0]}. C'est là qu'on va frapper fort aujourd'hui. Pas de temps à perdre.`);
    parts.push(`On commence direct : ${simplifyQuestion(ctx.weakQuestions[0])}`);
  } else if (ctx.weakQuestions.length > 0) {
    parts.push(`T'as raté des questions au quiz. Un bon employé d'Amigo doit connaître ses procédures par cœur. On les revoit maintenant.`);
    parts.push(`Première question : ${simplifyQuestion(ctx.weakQuestions[0])}`);
  } else if (ctx.weakSubjects.length > 0) {
    parts.push(`Ton point faible c'est ${ctx.weakSubjects[0]}. On va travailler ça jusqu'à ce que ce soit solide.`);
    const weakQ = getQuestionForSubject(ctx.weakSubjects[0]);
    parts.push(weakQ);
  } else if (ctx.formationPct < 50) {
    parts.push(`T'as complété seulement ${ctx.formationPct}% de ta formation. Faut que ça avance. En attendant, montre-moi ce que tu sais déjà.`);
    parts.push("C'est quoi la première chose à vérifier quand tu donnes un casque à un client ?");
  } else if (ctx.globalScore >= 80) {
    parts.push("T'as un bon score, mais je vais te challenger avec des questions plus tough. Un champion est prêt pour n'importe quelle situation.");
    parts.push("Question : si un casque est trop grand mais que c'est le dernier de cette taille, tu fais quoi ?");
  } else {
    parts.push("On commence. Concentre-toi et donne-moi des réponses complètes. C'est quoi la première chose à vérifier quand tu donnes un casque à un client ?");
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

  // ─── EXCELLENTE réponse → Féliciter fort + challenger ──
  if (analysis.quality === "excellent") {
    const praises = [
      "BOOM ! Réponse parfaite.",
      "Ça c'est ce que je veux entendre !",
      "Exactement ! T'as tout dit, rien à ajouter.",
      "Impeccable. C'est du niveau pro.",
      "Oui monsieur ! C'est comme ça qu'on fait chez Amigo.",
    ];
    const praise = praises[questionNumber % praises.length];
    const deeperQ = getDeeperQuestion(questionNumber);
    
    if (ctx && ctx.globalScore >= 80) {
      return `${praise} ${analysis.feedback} T'es clairement un des meilleurs. Mais je vais te pousser plus loin : ${deeperQ}`;
    }
    return `${praise} ${analysis.feedback} Tu montes en niveau. Maintenant prouve-moi que tu peux répondre à ça : ${deeperQ}`;
  }

  // ─── MOYENNE réponse → Encourager mais exiger plus ─────
  if (analysis.quality === "average") {
    const pushes = [
      "T'es sur la bonne track, mais je veux la réponse COMPLÈTE.",
      "C'est un début. Mais chez Amigo, on vise l'excellence, pas le minimum.",
      "T'as une partie. Mais si un client te pose la question, faut que tu sois solide à 100%.",
      "Presque. Mais 'presque' c'est pas assez quand c'est la sécurité des clients.",
      "Bon effort, mais creuse plus. T'es capable.",
    ];
    const push = pushes[questionNumber % pushes.length];
    
    return `${push} Ce qui te manque : ${analysis.missing} Retiens ça. ${nextQ}`;
  }

  // ─── MAUVAISE réponse → Corriger direct, pas de jugement ──
  const corrections = [
    "Non, c'est pas ça. Mais c'est pour ça qu'on s'entraîne. Écoute bien :",
    "Mauvaise réponse. Pas de stress, personne naît en sachant tout. Voici ce que tu dois retenir :",
    "Raté. Mais un bon employé c'est pas celui qui sait tout, c'est celui qui apprend. La bonne réponse :",
    "C'est incorrect. Mais je préfère que tu te trompes ici avec moi que devant un client. Retiens ça :",
  ];
  const correction = corrections[questionNumber % corrections.length];

  if (ctx && ctx.totalConversations > 5) {
    return `${correction} ${analysis.correctAnswer} T'as déjà vu ça. La prochaine fois, je m'attends à ce que tu le saches. ${nextQ}`;
  }
  if (ctx && ctx.totalConversations > 2) {
    return `${correction} ${analysis.correctAnswer} On l'a déjà couvert. Concentre-toi et retiens-le cette fois. ${nextQ}`;
  }
  return `${correction} ${analysis.correctAnswer} Grave ça dans ta mémoire. ${nextQ}`;
}

// ─── Analyser la qualité d'une réponse (flexible, synonymes) ────
interface AnswerAnalysis {
  quality: "excellent" | "average" | "bad";
  feedback: string;
  missing: string;
  correctAnswer: string;
}

// Chaque concept a plusieurs façons de le dire
interface Concept {
  name: string;           // Nom du concept
  keywords: string[];     // Toutes les façons de le dire (synonymes, variantes)
  required: boolean;      // Obligatoire pour "excellent" ?
}

interface QuestionExpectation {
  concepts: Concept[];
  feedback: string;
  missing: string;
  correct: string;
  minForExcellent: number;  // Combien de concepts pour "excellent"
  minForAverage: number;    // Combien de concepts pour "average"
}

function matchesConcept(answer: string, concept: Concept): boolean {
  return concept.keywords.some((kw) => answer.includes(kw));
}

function analyzeAnswer(m: string, questionNumber: number): AnswerAnalysis {
  const expectations: QuestionExpectation[] = [
    { // Q0: Casque - vérifier quoi
      concepts: [
        { name: "taille", keywords: ["taille", "grandeur", "mesure", "bon format", "bonne grosseur", "trop grand", "trop petit", "bonne taille", "right size"], required: true },
        { name: "ajustement", keywords: ["ajust", "serr", "fit", "attache", "sangle", "bien mis", "correct", "stable", "bouge pas", "bouge plus", "tient bien", "pas lousse", "bien placé", "bien attaché"], required: true },
        { name: "test secouer", keywords: ["secoue", "bouge pas", "bouger", "check", "vérif", "test", "branle", "shake", "hocher", "tourne la tête", "gauche droite"], required: false },
      ],
      feedback: "La taille et l'ajustement, c'est la base. Il faut que le casque bouge pas quand le client secoue la tête.",
      missing: "il faut vérifier que le casque bouge pas quand le client secoue la tête.",
      correct: "Quand tu donnes un casque, tu vérifies la taille et l'ajustement. Le casque doit pas bouger quand le client secoue la tête.",
      minForExcellent: 2, minForAverage: 1,
    },
    { // Q1: Casque fissuré
      concepts: [
        { name: "retirer", keywords: ["retir", "enlev", "ôte", "sort", "met de côté", "utilise plus", "jeter", "enlève", "garde pas", "prend", "isol"], required: true },
        { name: "bac rouge", keywords: ["bac rouge", "bac", "rouge", "poubelle", "défectueux", "range", "met dans", "place dans", "conteneur", "boite"], required: true },
        { name: "registre", keywords: ["registre", "note", "écri", "numéro", "documenter", "rapport", "log", "inscri", "marqu"], required: false },
        { name: "gestionnaire", keywords: ["gestionnaire", "gérant", "boss", "patron", "supérieur", "responsable", "avise", "avertir", "dire", "informer", "signaler", "appeler", "prévenir"], required: false },
      ],
      feedback: "On retire, bac rouge, registre et on avise le gestionnaire. Procédure complète !",
      missing: "il faut aussi noter le numéro dans le registre et aviser le gestionnaire.",
      correct: "Un casque fissuré : on le retire immédiatement, on le met dans le bac rouge, on note le numéro dans le registre et on avise le gestionnaire.",
      minForExcellent: 3, minForAverage: 1,
    },
    { // Q2: Désinfection casques
      concepts: [
        { name: "chaque utilisation", keywords: ["chaque", "après", "tout le temps", "à chaque fois", "toujours", "entre chaque", "à chaque client", "entre les client", "systématique"], required: true },
        { name: "spray", keywords: ["spray", "produit", "désinfect", "nettoyer", "vaporis", "pulvéris", "liquide", "antibactérien", "nettoyant"], required: true },
        { name: "bleu", keywords: ["bleu", "antibactérien bleu"], required: false },
        { name: "30 secondes", keywords: ["30 seconde", "30 sec", "trente seconde", "sécher", "attendre", "laisser sécher", "temps de séchage", "pause"], required: false },
      ],
      feedback: "Spray antibactérien bleu après chaque utilisation, 30 secondes de séchage.",
      missing: "c'est le spray antibactérien bleu, et il faut laisser sécher 30 secondes.",
      correct: "On désinfecte après chaque utilisation avec le spray antibactérien bleu. On laisse sécher 30 secondes avant de le redonner.",
      minForExcellent: 3, minForAverage: 1,
    },
    { // Q3: Distance entre karts
      concepts: [
        { name: "2 mètres", keywords: ["2 mètre", "deux mètre", "2m", "2 m", "deux m", "quelques mètre"], required: true },
        { name: "longueur kart", keywords: ["longueur", "un kart", "kart de distance", "kart entre", "longueur de kart", "grandeur d'un kart", "espace d'un kart"], required: false },
      ],
      feedback: "2 mètres, c'est environ une longueur de kart. Facile à retenir !",
      missing: "c'est exactement 2 mètres, environ une longueur de kart.",
      correct: "La distance minimale entre deux karts c'est 2 mètres, environ une longueur de kart.",
      minForExcellent: 2, minForAverage: 1,
    },
    { // Q4: Accident sur la piste
      concepts: [
        { name: "drapeau rouge", keywords: ["drapeau rouge", "rouge", "flag", "arrêter la course", "arrêter tout", "stop", "stopper"], required: true },
        { name: "couper alimentation", keywords: ["couper", "éteindre", "alimentation", "moteur", "kill", "switch", "arrêter les kart", "fermer"], required: true },
        { name: "sécuriser", keywords: ["sécuris", "protéger", "zone", "périmètre", "dégager", "évacuer", "mettre en sécurité"], required: false },
        { name: "911", keywords: ["911", "ambulance", "urgence", "secours", "appeler", "téléphone", "pompier", "paramédic"], required: false },
        { name: "évaluer", keywords: ["évaluer", "vérifier", "check", "regarder", "voir si", "état", "conscient", "blessé", "parler"], required: false },
      ],
      feedback: "Drapeau rouge, couper l'alimentation, sécuriser la zone, évaluer le pilote, 911 si nécessaire.",
      missing: "la séquence complète c'est : drapeau rouge, couper l'alimentation, sécuriser, évaluer et 911 si nécessaire.",
      correct: "En cas d'accident : drapeau rouge, couper l'alimentation des karts, sécuriser la zone, évaluer le pilote, appeler le 911 si nécessaire.",
      minForExcellent: 3, minForAverage: 1,
    },
    { // Q5: Drapeau jaune
      concepts: [
        { name: "ralentir", keywords: ["ralentir", "slow", "réduire vitesse", "moins vite", "doucement", "tranquille", "prudent", "attention", "vigilant", "faire attention", "careful"], required: true },
        { name: "pas dépasser", keywords: ["pas de dépassement", "dépasse pas", "pas dépasser", "pas doubler", "pas passer", "dépassement interdit", "rester derrière", "pas devancer", "interdit de dépasser", "on dépasse pas", "aucun dépassement"], required: true },
      ],
      feedback: "Jaune = attention, ralentir et AUCUN dépassement permis.",
      missing: "le plus important c'est : PAS DE DÉPASSEMENT quand le jaune est sorti.",
      correct: "Le drapeau jaune signifie attention, il faut ralentir et il n'y a aucun dépassement permis.",
      minForExcellent: 2, minForAverage: 1,
    },
    { // Q6: Ouverture du centre
      concepts: [
        { name: "alarme", keywords: ["alarme", "désarmer", "code", "système", "sécurité", "débarrer"], required: true },
        { name: "lumières", keywords: ["lumière", "allumer", "éclairage", "light", "ouvrir les lumière"], required: true },
        { name: "piste", keywords: ["piste", "track", "circuit", "parcours", "vérifier la piste", "inspecter la piste", "tour de piste"], required: false },
        { name: "karts", keywords: ["kart", "véhicule", "char", "voiture", "machine", "inspecter les kart", "vérifier les kart"], required: false },
        { name: "casques", keywords: ["casque", "équipement", "préparer les casque"], required: false },
        { name: "caisse", keywords: ["caisse", "argent", "fond", "comptoir", "cash", "tiroir", "compter"], required: false },
      ],
      feedback: "Alarme, lumières, piste, karts, casques, ordis, caisse. T'as toute la séquence !",
      missing: "la séquence complète c'est : alarme, lumières, vérifier la piste, inspecter les karts, préparer les casques, allumer les ordis, compter la caisse.",
      correct: "Pour ouvrir : désarmer l'alarme, allumer les lumières, vérifier la piste, inspecter les karts, préparer les casques, allumer les ordis et compter la caisse.",
      minForExcellent: 4, minForAverage: 2,
    },
    { // Q7: Fermeture caisse
      concepts: [
        { name: "rapport Z", keywords: ["rapport z", "rapport", "z", "imprim", "ticket", "reçu de fin", "fermeture de caisse", "lecture z"], required: true },
        { name: "compter", keywords: ["compter", "comptant", "cash", "argent", "additionn", "calculer", "vérifier", "balance", "comparer"], required: true },
        { name: "enveloppe coffre", keywords: ["enveloppe", "coffre", "coffre-fort", "safe", "mettre dans", "déposer", "ranger", "date", "datée"], required: false },
        { name: "fond de caisse", keywords: ["200", "fond", "laisser", "garder", "rester", "deux cent", "fond de caisse"], required: false },
      ],
      feedback: "Rapport Z, compter le comptant, vérifier le balance, enveloppe datée au coffre, laisser 200$ de fond de caisse.",
      missing: "il faut faire le Rapport Z, compter le comptant, mettre dans l'enveloppe datée au coffre et laisser 200$ de fond de caisse.",
      correct: "Pour fermer la caisse : faire le Rapport Z, compter le comptant, vérifier que ça balance, enveloppe datée au coffre, laisser 200$ de fond de caisse.",
      minForExcellent: 3, minForAverage: 1,
    },
    { // Q8: Forfaits
      concepts: [
        { name: "tour simple", keywords: ["tour simple", "un tour", "1 tour", "simple", "single", "individuel", "régulier", "normal", "de base"], required: true },
        { name: "3 tours", keywords: ["3 tour", "trois tour", "forfait 3", "pack 3", "15%", "quinze", "rabais"], required: true },
        { name: "groupe", keywords: ["groupe", "20%", "vingt", "gang", "équipe", "corporate", "entreprise", "compagnie", "party"], required: false },
        { name: "fête", keywords: ["fête", "party", "anniversaire", "birthday", "salle", "privé", "célébr", "spécial", "événement"], required: false },
      ],
      feedback: "Tour simple, Forfait 3 tours (15% rabais), Forfait groupe (20%), Forfait fête avec salle privée. Complet !",
      missing: "on a : Tour simple, Forfait 3 tours (15% rabais), Forfait groupe (20% rabais), et Forfait fête avec salle privée.",
      correct: "Les forfaits : Tour simple, Forfait 3 tours (15% rabais), Forfait groupe (20% rabais), et Forfait fête avec salle privée.",
      minForExcellent: 3, minForAverage: 1,
    },
    { // Q9: Client refuse casque
      concepts: [
        { name: "obligatoire", keywords: ["obligatoire", "obligé", "faut", "doit", "nécessaire", "requis", "pas le choix", "condition", "loi", "règle", "règlement", "imposé"], required: true },
        { name: "pas rouler", keywords: ["pas rouler", "pas embarquer", "roule pas", "peut pas", "a pas le droit", "interdit", "refuser", "embarque pas", "monte pas", "pas aller", "pas conduire", "pas piloter", "non négociable", "aucune exception", "zéro exception", "exception"], required: true },
      ],
      feedback: "Le casque c'est non négociable, zéro exception. Pas de casque = pas de kart.",
      missing: "c'est simple : le casque est obligatoire, zéro exception. Pas de casque, pas de kart.",
      correct: "Si un client refuse le casque, il ne peut tout simplement pas rouler. C'est obligatoire, zéro exception. Pas de casque = pas de kart.",
      minForExcellent: 2, minForAverage: 1,
    },
    { // Q10: Numéros d'urgence
      concepts: [
        { name: "911", keywords: ["911", "neuf un un", "urgence", "police", "ambulance", "pompier"], required: true },
        { name: "antipoison", keywords: ["poison", "antipoison", "1-800", "1800", "800", "463", "5060", "centre anti"], required: false },
        { name: "gestionnaire", keywords: ["gestionnaire", "gérant", "boss", "patron", "garde", "responsable", "babillard", "tableau", "affiché", "numéro du gérant", "appeler le boss"], required: true },
      ],
      feedback: "911 pour les urgences, 1-800-463-5060 pour le centre antipoison, et le gestionnaire de garde sur le babillard.",
      missing: "les 3 numéros : 911, centre antipoison (1-800-463-5060), et le numéro du gestionnaire de garde sur le babillard.",
      correct: "Les numéros d'urgence : 911, centre antipoison 1-800-463-5060, et le gestionnaire de garde (numéro sur le babillard).",
      minForExcellent: 2, minForAverage: 1,
    },
  ];

  const idx = questionNumber % expectations.length;
  const exp = expectations[idx];

  // Vérifier si "je sais pas" ou réponse vide
  if (m.includes("sais pas") || m.includes("aucune idée") || m.includes("pas sûr") || m.includes("je sais pas") || m.includes("ché pas") || m.includes("no idea") || m.length < 5) {
    return { quality: "bad", feedback: "", missing: "", correctAnswer: exp.correct };
  }

  // Compter les concepts trouvés
  const matched = exp.concepts.filter((c) => matchesConcept(m, c));
  const matchedCount = matched.length;
  const totalConcepts = exp.concepts.length;

  // Excellente : assez de concepts trouvés
  if (matchedCount >= exp.minForExcellent) {
    return { quality: "excellent", feedback: exp.feedback, missing: "", correctAnswer: "" };
  }

  // Moyenne : au moins le minimum
  if (matchedCount >= exp.minForAverage) {
    // Trouver ce qui manque
    const missingConcepts = exp.concepts.filter((c) => c.required && !matchesConcept(m, c));
    const missingText = missingConcepts.length > 0 ? exp.missing : "il manque quelques détails.";
    return { quality: "average", feedback: "", missing: missingText, correctAnswer: "" };
  }

  // Mauvaise : pas assez de concepts
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

// ═══════════════════════════════════════════════════════════════════
// MODE SIMULATION
// ═══════════════════════════════════════════════════════════════════

function getSimulationIntro(simId: string, name: string): string {
  const intros: Record<string, string> = {
    "accident": `${name}, on va simuler un accident sur la piste. Imagine : t'es à côté de la piste, tu surveilles la course. Soudain, un kart frappe le mur à la sortie du virage 3. Le kart s'arrête. Le pilote ne bouge plus. Les autres karts arrivent derrière. Qu'est-ce que tu fais en PREMIER ?`,

    "client-fache": `${name}, on simule un client fâché. Imagine : un homme arrive au comptoir, visiblement en colère. Il te dit : "Ça fait 45 minutes qu'on attend ! C'est quoi ce service de merde ? Je veux voir le gérant et je veux un remboursement complet !" Sa femme et ses deux enfants sont derrière lui, gênés. Comment tu réagis ?`,

    "panne-kart": `${name}, simulation d'une panne de kart. Imagine : une course est en cours avec 8 karts sur la piste. Le kart numéro 5 s'arrête soudainement en plein milieu de la ligne droite. Le pilote lève la main. Les autres karts arrivent à pleine vitesse derrière lui. Qu'est-ce que tu fais ?`,

    "blessure": `${name}, on simule une urgence blessure. Imagine : un enfant de 10 ans vient de terminer sa course. En sortant du kart, il trébuche et tombe par terre. Il pleure et tient son bras droit, qui a l'air enflé. Son parent court vers lui en criant : "Mon fils ! Quelqu'un appelez une ambulance !" Qu'est-ce que tu fais ?`,

    "rush": `${name}, simulation d'un rush de clients. Imagine : c'est samedi après-midi. Un autobus scolaire vient d'arriver avec 15 enfants et 3 accompagnateurs. En même temps, il y a déjà 4 clients au comptoir qui attendent, la piste est pleine, et ton collègue vient de partir en pause. Tu es tout seul. Comment tu gères ça ?`,
  };

  return intros[simId] || `${name}, on commence la simulation. Décris-moi ce que tu ferais.`;
}

function getSimulationResponse(simId: string, message: string, history: any[]): string {
  const m = message.toLowerCase();
  const step = Math.floor(history.length / 2);

  switch (simId) {
    case "accident": return simulateAccident(m, step);
    case "client-fache": return simulateClientFache(m, step);
    case "panne-kart": return simulatePanneKart(m, step);
    case "blessure": return simulateBlessure(m, step);
    case "rush": return simulateRush(m, step);
    default: return "Décris-moi ce que tu ferais dans cette situation.";
  }
}

// ─── SIMULATION : Accident sur la piste ─────────────────────────
function simulateAccident(m: string, step: number): string {
  if (step === 0) {
    if (m.includes("drapeau") || m.includes("rouge") || m.includes("arrêter") || m.includes("stop"))
      return "Correct ! Tu sors le drapeau rouge pour arrêter la course. Les karts ralentissent. Maintenant, le pilote accidenté est toujours immobile dans son kart. Qu'est-ce que tu fais ensuite ?";
    if (m.includes("courir") || m.includes("aller voir") || m.includes("pilote"))
      return "Attention ! Avant d'aller voir le pilote, tu dois d'abord arrêter la course pour pas qu'un autre kart le frappe. C'est quoi le signal pour arrêter la course ?";
    return "Réfléchis bien. Il y a des karts qui roulent encore derrière. Ta première action doit protéger tout le monde. Qu'est-ce que tu fais pour arrêter la course ?";
  }
  if (step === 1) {
    if (m.includes("couper") || m.includes("alimentation") || m.includes("moteur") || m.includes("éteindre"))
      return "Parfait ! Tu coupes l'alimentation des karts. Plus rien ne bouge. Maintenant tu t'approches du pilote. Il gémit un peu mais ne bouge pas. Tu fais quoi ?";
    if (m.includes("aller voir") || m.includes("approche") || m.includes("pilote"))
      return "Oui, tu vas vers le pilote. Mais avant, as-tu pensé à couper l'alimentation de tous les karts pour que personne redémarre ?";
    return "Les karts sont arrêtés avec le drapeau rouge, mais les moteurs tournent encore. Qu'est-ce que tu fais avec l'alimentation ?";
  }
  if (step === 2) {
    if (m.includes("parle") || m.includes("conscient") || m.includes("ça va") || m.includes("bouge pas") || m.includes("évaluer"))
      return "Bien ! Tu lui parles pour évaluer s'il est conscient. Il te dit qu'il a mal au cou. Est-ce que tu le sors du kart ?";
    if (m.includes("911") || m.includes("ambulance") || m.includes("appeler"))
      return "Le 911 c'est une bonne idée, mais avant d'appeler, tu dois évaluer la situation. Le pilote est conscient ? Il respire ? Tu lui parles d'abord. Qu'est-ce que tu lui dis ?";
    return "Tu es à côté du pilote maintenant. Comment tu évalues son état ? Qu'est-ce que tu fais ou tu dis ?";
  }
  if (step === 3) {
    if (m.includes("non") || m.includes("bouge pas") || m.includes("pas bouger") || m.includes("pas sortir") || m.includes("attendre"))
      return "Excellent ! Si quelqu'un a mal au cou, on ne le bouge JAMAIS. Tu appelles le 911, tu restes avec lui, tu le rassures et tu attends les secours. Qui d'autre tu avises ?";
    if (m.includes("oui") || m.includes("sortir") || m.includes("lever"))
      return "NON ! Si il a mal au cou, tu ne le bouges surtout pas ! Tu pourrais aggraver une blessure à la colonne. Tu le laisses dans le kart, tu appelles le 911 et tu attends les secours. C'est une règle de base. Qui d'autre tu avises ?";
    return "Il dit qu'il a mal au cou. C'est important : est-ce que tu le sors du kart ou tu le laisses dedans ?";
  }
  if (step === 4) {
    if (m.includes("gestionnaire") || m.includes("gérant") || m.includes("patron") || m.includes("boss"))
      return "C'est ça ! Tu appelles le gestionnaire de garde. Et qu'est-ce que tu fais avec les autres clients qui étaient sur la piste ?";
    return "Pense à qui doit être au courant dans l'entreprise. Qui tu appelles après le 911 ?";
  }
  if (step === 5) {
    if (m.includes("expliquer") || m.includes("rassurer") || m.includes("excuser") || m.includes("rembours"))
      return "Très bien ! Tu rassures les autres clients, tu leur expliques la situation calmement, et tu gères les remboursements si nécessaire. Bravo, tu as bien géré cette simulation d'accident ! Tu as suivi les bonnes étapes : drapeau rouge, couper l'alimentation, évaluer sans bouger la victime, 911, aviser le gestionnaire, et gérer les clients. Tu veux continuer ou terminer ?";
    return "Les autres clients ont vu l'accident et sont inquiets. Comment tu les gères ?";
  }
  return "Tu as bien géré cette simulation ! Les étapes clés : drapeau rouge, couper l'alimentation, ne pas bouger la victime, appeler le 911, aviser le gestionnaire, et rassurer les clients. Tu veux refaire ou terminer ?";
}

// ─── SIMULATION : Client fâché ──────────────────────────────────
function simulateClientFache(m: string, step: number): string {
  if (step === 0) {
    if (m.includes("excuse") || m.includes("désolé") || m.includes("comprend") || m.includes("raison"))
      return "Bon début ! Tu restes calme et tu t'excuses pour l'attente. Le client dit : 'Des excuses ça suffit pas ! Je veux parler au gérant MAINTENANT !' Qu'est-ce que tu réponds ?";
    if (m.includes("calme") || m.includes("écouter") || m.includes("respir"))
      return "C'est bien de rester calme ! Mais le client attend une réponse. Il est devant toi, rouge de colère. Qu'est-ce que tu lui dis en premier ?";
    return "Le client est en face de toi et il crie. La première chose à faire, c'est quoi ? Pense à comment désamorcer la situation.";
  }
  if (step === 1) {
    if (m.includes("gérant") || m.includes("patron") || m.includes("supérieur") || m.includes("appeler"))
      return "Ok, tu proposes d'appeler le gérant. Mais il est pas disponible tout de suite. Le client s'impatiente encore plus : 'C'est une joke ? Personne est capable de gérer ici ?' Tu fais quoi en attendant ?";
    if (m.includes("solution") || m.includes("offrir") || m.includes("compens") || m.includes("gratuit"))
      return "Bonne approche ! Offrir une compensation, c'est proactif. Qu'est-ce que tu peux lui offrir concrètement pour le calmer ?";
    return "Le gérant est pas là. C'est toi qui dois gérer. Qu'est-ce que tu peux offrir au client pour compenser l'attente ?";
  }
  if (step === 2) {
    if (m.includes("tour gratuit") || m.includes("rabais") || m.includes("gratuit") || m.includes("réduction") || m.includes("compens"))
      return "Excellente idée ! Un tour gratuit ou un rabais, ça montre que tu prends la situation au sérieux. Le client se calme un peu : 'Bon... OK, mais mes enfants ont faim aussi.' Qu'est-ce que tu fais ?";
    if (m.includes("rembours"))
      return "Attention ! Un remboursement complet, c'est une décision que normalement le gérant doit prendre. Tu peux offrir quoi d'autre en attendant ? Un tour gratuit, un rabais ?";
    return "Pense à ce que tu as le pouvoir d'offrir : tours gratuits, rabais, priorité sur la prochaine course. Qu'est-ce que tu proposes ?";
  }
  if (step === 3) {
    if (m.includes("collation") || m.includes("boisson") || m.includes("eau") || m.includes("manger") || m.includes("attendre"))
      return "Parfait ! Tu leur offres des boissons ou collations pendant qu'ils attendent. Le client se calme. Sa femme sourit. Il te dit : 'Bon, c'est correct. Merci.' Bravo ! Tu as bien désamorcé la situation. Les clés : rester calme, s'excuser, offrir une compensation concrète, et montrer que tu te soucies d'eux. Tu veux continuer ou terminer ?";
    return "Ses enfants ont faim et ils attendent encore. Qu'est-ce que tu peux leur offrir en attendant leur tour ?";
  }
  return "Tu as bien géré ! Rappelle-toi : rester calme, écouter, s'excuser sincèrement, offrir une compensation, et aviser le gérant. Tu veux refaire ou terminer ?";
}

// ─── SIMULATION : Panne de kart ─────────────────────────────────
function simulatePanneKart(m: string, step: number): string {
  if (step === 0) {
    if (m.includes("jaune") || m.includes("drapeau") || m.includes("ralentir"))
      return "Bon réflexe ! Tu sors le drapeau jaune pour que les autres ralentissent et ne dépassent pas. Le kart 5 est toujours immobile au milieu de la piste. Les autres karts passent lentement à côté. Qu'est-ce que tu fais maintenant ?";
    if (m.includes("rouge") || m.includes("arrêter"))
      return "Le drapeau rouge c'est pour les urgences graves. Ici, c'est juste une panne. Quel drapeau tu utilises pour que les autres ralentissent sans arrêter la course ?";
    return "Il y a des karts qui arrivent vite derrière le kart en panne. Quel signal tu utilises pour les avertir ?";
  }
  if (step === 1) {
    if (m.includes("pousser") || m.includes("sortir") || m.includes("dégager") || m.includes("bord") || m.includes("côté"))
      return "Exact ! Tu vas sur la piste (en faisant attention) et tu pousses le kart sur le côté pour dégager la voie. Le pilote dit : 'Le moteur a juste arrêté d'un coup.' Qu'est-ce que tu vérifies ?";
    if (m.includes("aller voir") || m.includes("pilote"))
      return "Oui, tu vas voir le pilote. Mais d'abord, le kart est en plein milieu de la piste. C'est dangereux. Qu'est-ce que tu fais avec le kart ?";
    return "Le kart bloque la piste et les autres doivent le contourner. Comment tu sécurises la situation ?";
  }
  if (step === 2) {
    if (m.includes("essence") || m.includes("batterie") || m.includes("bouton") || m.includes("redémarrer") || m.includes("kill switch"))
      return "Bien ! Tu vérifies le kill switch, le niveau d'essence et tu essaies de redémarrer. Ça marche pas. Le client dit : 'Est-ce que je peux avoir un autre kart ?' Tu fais quoi ?";
    return "Pense aux causes fréquentes de panne : kill switch activé par accident, manque d'essence, problème électrique. Qu'est-ce que tu vérifies en premier ?";
  }
  if (step === 3) {
    if (m.includes("autre kart") || m.includes("remplacer") || m.includes("changer") || m.includes("nouveau"))
      return "C'est ça ! Tu lui donnes un autre kart et tu ajoutes du temps pour compenser. Le kart en panne, tu le mets où ?";
    return "Le client a payé pour rouler et son kart est en panne. Comment tu le satisfais ?";
  }
  if (step === 4) {
    if (m.includes("garage") || m.includes("réparation") || m.includes("hors service") || m.includes("note") || m.includes("registre"))
      return "Parfait ! Tu mets le kart au garage, tu le marques hors service, et tu notes le problème dans le registre pour le mécanicien. Bravo ! Tu as bien géré : drapeau jaune, dégager le kart, vérifier, remplacer, et documenter. Tu veux continuer ou terminer ?";
    return "Le kart est en panne. Où tu le mets pour qu'il soit réparé et que personne l'utilise par erreur ?";
  }
  return "Bien joué ! Les étapes : drapeau jaune, dégager le kart, vérifier la panne, donner un autre kart au client, et documenter le problème. Tu veux refaire ou terminer ?";
}

// ─── SIMULATION : Urgence blessure ──────────────────────────────
function simulateBlessure(m: string, step: number): string {
  if (step === 0) {
    if (m.includes("calme") || m.includes("rassurer") || m.includes("panique pas") || m.includes("approche"))
      return "Bien ! Tu gardes ton calme et tu t'approches. Le parent crie toujours. L'enfant pleure et tient son bras. Tu fais quoi avec l'enfant ?";
    if (m.includes("911") || m.includes("ambulance"))
      return "Le 911 c'est peut-être nécessaire, mais d'abord tu dois évaluer la blessure. L'enfant est conscient et pleure. Approche-toi calmement. Qu'est-ce que tu fais en premier ?";
    return "Le parent panique et l'enfant pleure. La première chose, c'est de garder ton calme. Ensuite, tu fais quoi ?";
  }
  if (step === 1) {
    if (m.includes("regarde") || m.includes("touche pas") || m.includes("évaluer") || m.includes("bras") || m.includes("demander"))
      return "C'est ça ! Tu regardes le bras sans le toucher. Il est enflé et l'enfant crie quand il essaie de bouger. C'est possiblement une fracture. Est-ce que tu bouges son bras ?";
    if (m.includes("glace") || m.includes("ice"))
      return "La glace c'est une bonne idée, mais avant il faut évaluer la blessure. Le bras est enflé. Est-ce que tu le touches ?";
    return "L'enfant tient son bras et pleure. Comment tu évalues la blessure ? Qu'est-ce que tu regardes ?";
  }
  if (step === 2) {
    if (m.includes("non") || m.includes("pas bouger") || m.includes("pas toucher") || m.includes("immobil"))
      return "Exact ! On ne bouge jamais un membre possiblement fracturé. Tu immobilises le bras dans la position où il est. Qu'est-ce que tu fais ensuite ? Tu appelles qui ?";
    if (m.includes("oui") || m.includes("bouger") || m.includes("replacer"))
      return "NON ! On ne bouge jamais un membre qui pourrait être fracturé. Tu pourrais aggraver la blessure. On immobilise dans la position où il est. Maintenant, tu appelles qui ?";
    return "Son bras est peut-être fracturé. Est-ce que tu essaies de le bouger ou de le replacer ?";
  }
  if (step === 3) {
    if (m.includes("911") || m.includes("ambulance") || m.includes("secours") || m.includes("parent"))
      return "Oui ! Tu appelles le 911, tu restes avec l'enfant et tu rassures le parent. En attendant l'ambulance, qu'est-ce que tu fais ?";
    if (m.includes("gestionnaire") || m.includes("gérant"))
      return "Oui, aviser le gestionnaire c'est important, mais en premier tu appelles qui pour l'enfant ?";
    return "L'enfant a possiblement une fracture. C'est quoi le numéro à appeler pour les urgences médicales ?";
  }
  if (step === 4) {
    if (m.includes("rester") || m.includes("rassurer") || m.includes("parler") || m.includes("couverture") || m.includes("confort"))
      return "Parfait ! Tu restes avec l'enfant, tu le rassures, tu le gardes au chaud et immobile. Tu documentes l'incident. Bravo ! Les étapes : garder son calme, évaluer sans bouger le membre, immobiliser, appeler le 911, rassurer l'enfant et le parent, documenter. Excellente simulation ! Tu veux continuer ou terminer ?";
    return "L'ambulance est en route. Comment tu gères l'attente avec l'enfant et son parent ?";
  }
  return "Bien géré ! Les clés : calme, évaluation, ne pas bouger la blessure, 911, rassurer, documenter. Tu veux refaire ou terminer ?";
}

// ─── SIMULATION : Rush de clients ───────────────────────────────
function simulateRush(m: string, step: number): string {
  if (step === 0) {
    if (m.includes("priorité") || m.includes("organiser") || m.includes("file") || m.includes("ordre") || m.includes("un à la fois"))
      return "Bon réflexe ! Tu organises une file d'attente. Mais le groupe scolaire veut tout réserver en même temps, et les 4 clients au comptoir s'impatientent. Tu gères qui en premier ?";
    if (m.includes("collègue") || m.includes("rappeler") || m.includes("aide") || m.includes("renfort"))
      return "Bonne idée de demander du renfort ! Mais en attendant que ton collègue revienne, tu es seul. Comment tu organises tout ce monde ?";
    return "T'es seul avec 15 enfants, 3 accompagnateurs et 4 clients. C'est le chaos. C'est quoi ta première action pour reprendre le contrôle ?";
  }
  if (step === 1) {
    if (m.includes("comptoir") || m.includes("4 client") || m.includes("déjà là") || m.includes("premier"))
      return "C'est ça ! Les 4 clients qui étaient déjà là passent en premier — c'est juste fair. Tu les sers rapidement. Pendant ce temps, le responsable du groupe scolaire s'approche et dit : 'On a une réservation pour 15 enfants à 14h.' Tu vérifies dans le système, mais t'as rien. Il dit que c'est confirmé par téléphone. Tu fais quoi ?";
    if (m.includes("groupe") || m.includes("scolaire") || m.includes("bus"))
      return "Le groupe est gros, mais les 4 clients au comptoir étaient là avant. Si tu t'occupes du groupe en premier, les 4 vont se fâcher. Qui tu sers en premier ?";
    return "Il y a les 4 clients qui attendent depuis plus longtemps et le groupe de 15 qui vient d'arriver. C'est quoi la règle : qui passe en premier ?";
  }
  if (step === 2) {
    if (m.includes("vérif") || m.includes("cherche") || m.includes("système") || m.includes("téléphone") || m.includes("gestionnaire"))
      return "Bien ! Tu vérifies dans le système et tu appelles le gestionnaire pour confirmer. Pendant ce temps, les 15 enfants courent partout dans le centre. C'est dangereux. Comment tu les gères ?";
    if (m.includes("accepter") || m.includes("ok") || m.includes("oui"))
      return "Attention ! Avant d'accepter, tu dois vérifier. Si la réservation existe pas et que tu acceptes 15 personnes, tu vas avoir un problème de capacité. Qu'est-ce que tu fais pour vérifier ?";
    return "Il dit qu'il a réservé mais y'a rien dans le système. Tu l'acceptes comme ça ou tu vérifies ?";
  }
  if (step === 3) {
    if (m.includes("asseoir") || m.includes("attendre") || m.includes("zone") || m.includes("accompagnateur") || m.includes("responsable") || m.includes("sécurité"))
      return "Parfait ! Tu demandes aux accompagnateurs de garder les enfants assis dans la zone d'attente pour la sécurité. Ton collègue revient de sa pause. Comment tu répartis les tâches ?";
    if (m.includes("crier") || m.includes("dire") || m.includes("arrêter"))
      return "C'est bien de leur dire d'arrêter, mais tu parles aux accompagnateurs, pas aux enfants directement. Demande aux 3 adultes de gérer leur groupe. Qu'est-ce que tu leur dis ?";
    return "15 enfants qui courent dans un centre de karting, c'est dangereux. Comment tu les calmes sans être bête ?";
  }
  if (step === 4) {
    if (m.includes("caisse") || m.includes("comptoir") || m.includes("casque") || m.includes("piste") || m.includes("répartir"))
      return "Excellent ! Tu gères la caisse, ton collègue prépare les casques et la piste. Vous travaillez en équipe. Bravo ! Tu as bien géré le rush : organiser une file, servir par ordre d'arrivée, vérifier la réservation, sécuriser les enfants, et répartir les tâches. C'est exactement ce qu'on attend d'un bon employé. Tu veux continuer ou terminer ?";
    return "Ton collègue est de retour. Tu fais quoi et lui il fait quoi ? Comment vous vous répartissez le travail ?";
  }
  return "Bien joué ! Les clés du rush : garder son calme, organiser la file, servir par ordre, vérifier les réservations, sécuriser les enfants, et travailler en équipe. Tu veux refaire ou terminer ?";
}
