import { openai } from "./client";
import { supabaseAdmin } from "@/lib/supabase/admin";

// ─── Types ─────────────────────────────────────────────────────
interface SourceDoc {
  id: string;
  title: string;
  content: string;
  category: string | null;
  similarity: number;
}

interface QAResult {
  answer: string;
  sources: { id: string; title: string; category: string | null; similarity: number }[];
  confidence: number;
  tokensUsed: number;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── System prompt ─────────────────────────────────────────────
const SYSTEM_PROMPT = `Tu es l'assistant IA d'Amigo Karting. Tu aides les employés en répondant à leurs questions sur les procédures, le manuel, la sécurité et le fonctionnement du karting.

RÈGLES STRICTES :
1. Réponds UNIQUEMENT en te basant sur le contexte fourni ci-dessous.
2. Si l'information n'est pas dans le contexte, dis clairement : "Je n'ai pas cette information dans le manuel. Demande à ton gestionnaire pour en savoir plus."
3. Ne jamais inventer ou supposer des procédures de sécurité.
4. Réponds en français québécois naturel, de manière concise et claire.
5. Si la question porte sur la sécurité, sois précis et complet — pas de raccourcis.
6. Utilise des listes à puces quand c'est pertinent pour la clarté.
7. Si plusieurs documents du contexte se contredisent, mentionne-le.

STYLE :
- Tutoie l'employé (ton informel mais professionnel)
- Sois direct, pas de formules de politesse excessives
- Limite ta réponse à 3-4 phrases maximum sauf si la question demande plus de détails`;

// ─── Recherche vectorielle ─────────────────────────────────────
async function searchDocuments(
  question: string,
  matchCount: number = 5,
  threshold: number = 0.5
): Promise<SourceDoc[]> {
  // Générer l'embedding de la question
  const embeddingRes = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: question,
  });
  const queryEmbedding = embeddingRes.data[0].embedding;

  // Recherche dans Supabase via pgvector
  const { data, error } = await supabaseAdmin.rpc("match_documents", {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: matchCount,
  });

  if (error) {
    console.error("Erreur recherche vectorielle:", error);
    return [];
  }

  return (data as SourceDoc[]) || [];
}

// ─── Assembler le contexte ─────────────────────────────────────
function buildContext(docs: SourceDoc[]): string {
  if (docs.length === 0) {
    return "AUCUN DOCUMENT TROUVÉ DANS LE MANUEL.";
  }

  return docs
    .map((doc, i) => {
      const cat = doc.category ? ` [${doc.category}]` : "";
      return `--- Document ${i + 1}${cat} : ${doc.title} (pertinence: ${Math.round(doc.similarity * 100)}%) ---\n${doc.content}`;
    })
    .join("\n\n");
}

// ─── Répondre à une question ───────────────────────────────────
export async function answerQuestion(
  question: string,
  employeeId: string,
  conversationHistory: ConversationMessage[] = [],
  inputType: "text" | "voice" = "text"
): Promise<QAResult> {
  const startTime = Date.now();

  // 1. Recherche vectorielle
  const docs = await searchDocuments(question);

  // 2. Construire le contexte
  const context = buildContext(docs);

  // 3. Construire les messages avec l'historique de conversation
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    {
      role: "system",
      content: `${SYSTEM_PROMPT}\n\nCONTEXTE DU MANUEL :\n${context}`,
    },
  ];

  // Ajouter l'historique récent (max 6 messages pour garder le contexte léger)
  const recentHistory = conversationHistory.slice(-6);
  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }

  // Ajouter la question courante
  messages.push({ role: "user", content: question });

  // 4. Appeler GPT-4o
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    temperature: 0.2,
    max_tokens: 600,
  });

  const answer = response.choices[0].message.content || "Désolé, je n'ai pas pu générer de réponse.";
  const tokensUsed = response.usage?.total_tokens || 0;

  // 5. Calculer la confiance (moyenne des similarités)
  const confidence = docs.length > 0
    ? docs.reduce((sum, d) => sum + d.similarity, 0) / docs.length
    : 0;

  // 6. Logger dans Supabase
  const responseMs = Date.now() - startTime;
  try {
    await supabaseAdmin.from("qa_logs").insert({
      employee_id: employeeId,
      question,
      answer,
      source_docs: docs.map((d) => d.id),
      input_type: inputType,
      confidence: Math.round(confidence * 100) / 100,
      response_ms: responseMs,
    });
  } catch (err) {
    console.error("Erreur log Q&A:", err);
  }

  return {
    answer,
    sources: docs.map((d) => ({
      id: d.id,
      title: d.title,
      category: d.category,
      similarity: Math.round(d.similarity * 100) / 100,
    })),
    confidence: Math.round(confidence * 100) / 100,
    tokensUsed,
  };
}

// ─── Importer un document dans la base de connaissances ────────
// Découpe le texte en chunks et génère les embeddings
export async function importDocument(
  title: string,
  fullText: string,
  category: string,
  sourceFile?: string,
  chunkSize: number = 800,
  chunkOverlap: number = 100
): Promise<{ chunksCreated: number }> {
  // Découper en chunks
  const chunks = chunkText(fullText, chunkSize, chunkOverlap);

  let created = 0;
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkTitle = chunks.length > 1
      ? `${title} (partie ${i + 1}/${chunks.length})`
      : title;

    // Générer l'embedding
    const embeddingRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: chunk,
    });

    const embedding = embeddingRes.data[0].embedding;
    const tokenCount = embeddingRes.usage.total_tokens;

    // Insérer dans Supabase
    const { error } = await supabaseAdmin.from("knowledge_documents").insert({
      title: chunkTitle,
      content: chunk,
      category,
      source_file: sourceFile || null,
      chunk_index: i,
      embedding,
      token_count: tokenCount,
    });

    if (error) {
      console.error(`Erreur insertion chunk ${i}:`, error);
    } else {
      created++;
    }
  }

  return { chunksCreated: created };
}

// ─── Découper du texte en chunks ───────────────────────────────
function chunkText(text: string, maxTokens: number, overlap: number): string[] {
  // Approximation : 1 token ~ 4 caractères en français
  const maxChars = maxTokens * 4;
  const overlapChars = overlap * 4;

  // Découper par paragraphes d'abord
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    if ((currentChunk + "\n\n" + trimmed).length > maxChars && currentChunk) {
      chunks.push(currentChunk.trim());
      // Garder une partie du chunk précédent pour le contexte (overlap)
      const words = currentChunk.split(/\s+/);
      const overlapWords = Math.floor(overlapChars / 5); // ~5 chars par mot
      currentChunk = words.slice(-overlapWords).join(" ") + "\n\n" + trimmed;
    } else {
      currentChunk = currentChunk ? currentChunk + "\n\n" + trimmed : trimmed;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // Si un seul chunk ou aucun paragraphe trouvé, découper par phrases
  if (chunks.length === 0 && text.trim()) {
    chunks.push(text.trim().slice(0, maxChars));
  }

  return chunks;
}

// ─── Mettre à jour un feedback (pouce haut/bas) ────────────────
export async function updateQAFeedback(
  logId: string,
  helpful: boolean
): Promise<void> {
  await supabaseAdmin
    .from("qa_logs")
    .update({ helpful })
    .eq("id", logId);
}
