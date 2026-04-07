import { openai } from "./client";
import { supabaseAdmin } from "@/lib/supabase/admin";

// ─── Types ─────────────────────────────────────────────────────
interface ConversationContext {
  employeeId: string;
  employeeName: string;
  sessionId: string;
  message: string;
  history: { role: "user" | "assistant"; content: string }[];
}

interface ConversationResult {
  response: string;
  questionAsked?: string;
  questionId?: string;
  wasCorrect?: boolean;
}

// ─── System prompt ─────────────────────────────────────────────
function buildSystemPrompt(
  employeeName: string,
  priorityQuestions: string[],
  wrongAnswers: { question: string; explanation: string }[],
  knowledgeContext: string
): string {
  return `Tu es un formateur vocal IA pour Amigo Karting. Tu parles avec ${employeeName} dans une conversation de style appel téléphonique pour réviser les procédures du karting.

TON RÔLE :
- Tu poses UNE question à la fois sur les procédures, la sécurité ou le fonctionnement
- Tu évalues la réponse de l'employé
- Si la réponse est correcte : félicite brièvement (1 phrase), puis pose la prochaine question
- Si la réponse est incorrecte ou incomplète : corrige avec bienveillance, donne l'explication, puis passe à la suivante
- Si l'employé dit "je sais pas" : donne la réponse complète sans jugement

STYLE VOCAL (important — tes réponses seront lues à voix haute) :
- Parle en français québécois naturel et conversationnel
- Phrases courtes (max 2-3 phrases par tour)
- Pas de listes à puces, pas de formatage — juste du texte parlé
- Tutoie l'employé
- Sois encourageant et énergique, comme un bon coach

QUESTIONS PRIORITAIRES (pose celles-ci en premier) :
${priorityQuestions.length > 0 ? priorityQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n") : "Aucune question prioritaire pour le moment."}

ERREURS AU QUIZ À RETRAVAILLER :
${wrongAnswers.length > 0 ? wrongAnswers.map((w) => `- "${w.question}" → Bonne réponse : ${w.explanation}`).join("\n") : "Aucune erreur de quiz à revoir."}

CONTEXTE DU MANUEL (utilise ces infos pour valider les réponses) :
${knowledgeContext || "Aucun contexte disponible."}

RÈGLE ABSOLUE : ne pose JAMAIS de question dont tu ne connais pas la réponse via le contexte ci-dessus.`;
}

// ─── Récupérer le contexte de la base de connaissances ──────────
async function getKnowledgeContext(): Promise<string> {
  const { data: docs } = await supabaseAdmin
    .from("knowledge_documents")
    .select("title, content, category")
    .limit(15);

  if (!docs || docs.length === 0) return "";

  return docs
    .map((d) => `[${d.category || "général"}] ${d.title}\n${d.content}`)
    .join("\n\n---\n\n");
}

// ─── Gérer un message dans la conversation ──────────────────────
export async function handleConversation(
  ctx: ConversationContext
): Promise<ConversationResult> {
  // 1. Récupérer les questions prioritaires
  const { data: priorityQs } = await supabaseAdmin
    .from("conversation_questions")
    .select("id, question_text")
    .eq("is_priority", true)
    .limit(10);

  // 2. Récupérer les erreurs de quiz de l'employé
  const { data: wrongAnswers } = await supabaseAdmin
    .from("employee_wrong_answers")
    .select("question_text, explanation")
    .eq("employee_id", ctx.employeeId)
    .limit(15);

  // 3. Récupérer le contexte du manuel
  const knowledgeContext = await getKnowledgeContext();

  // 4. Construire le system prompt
  const systemPrompt = buildSystemPrompt(
    ctx.employeeName,
    priorityQs?.map((q) => q.question_text) || [],
    wrongAnswers?.map((w) => ({
      question: w.question_text,
      explanation: w.explanation || "",
    })) || [],
    knowledgeContext
  );

  // 5. Appeler GPT-4o
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      ...ctx.history.slice(-10), // Garder les 10 derniers messages
      { role: "user", content: ctx.message },
    ],
    temperature: 0.7,
    max_tokens: 300, // Court pour le vocal
  });

  const aiMessage = response.choices[0].message.content || "";

  // 6. Sauvegarder les messages
  try {
    await supabaseAdmin.from("conversation_messages").insert([
      {
        session_id: ctx.sessionId,
        role: "employee",
        content: ctx.message,
      },
      {
        session_id: ctx.sessionId,
        role: "ai",
        content: aiMessage,
      },
    ]);
  } catch (err) {
    console.error("Erreur sauvegarde messages:", err);
  }

  return { response: aiMessage };
}

// ─── Générer le message d'accueil ───────────────────────────────
export async function generateGreeting(employeeName: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `Tu es un formateur vocal IA pour Amigo Karting. Génère un message d'accueil court (2 phrases max) pour commencer une session de révision avec ${employeeName}. Style vocal, en français québécois, encourageant. Termine par ta première question de révision sur la sécurité.`,
      },
    ],
    temperature: 0.8,
    max_tokens: 150,
  });

  return (
    response.choices[0].message.content ||
    `Salut ${employeeName} ! On commence par une question facile : c'est quoi la première chose à vérifier quand tu donnes un casque à un client ?`
  );
}
