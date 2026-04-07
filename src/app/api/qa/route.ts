import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await req.json();
    const { action = "ask" } = body;

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

    // ─── Action : poser une question ───────────────────────
    if (action === "ask") {
      const { question } = body;

      if (!question || typeof question !== "string" || question.trim().length < 2) {
        return NextResponse.json(
          { error: "La question doit contenir au moins 2 caractères." },
          { status: 400 }
        );
      }

      const cleanQuestion = question.trim().slice(0, 1000);

      // Chercher dans la base de connaissances par mots-clés
      const results = await searchKnowledge(cleanQuestion);

      if (results.length === 0) {
        return NextResponse.json({
          answer: "Je n'ai pas trouvé cette information dans le manuel. Essaie avec d'autres mots-clés ou demande à ton gestionnaire.",
          sources: [],
          confidence: 0,
        });
      }

      // Construire la réponse à partir des documents trouvés
      const answer = results.map((r) => r.content).join("\n\n---\n\n");
      const sources = results.map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        similarity: r.score,
      }));

      return NextResponse.json({
        answer,
        sources,
        confidence: results[0].score,
      });
    }

    // ─── Action : recherche autocomplete ───────────────────
    if (action === "search") {
      const { query } = body;

      if (!query || query.trim().length < 2) {
        return NextResponse.json({ results: [] });
      }

      const results = await searchKnowledge(query.trim());

      return NextResponse.json({
        results: results.map((r) => ({
          id: r.id,
          title: r.title,
          category: r.category,
          preview: r.content.slice(0, 120) + "...",
        })),
      });
    }

    // ─── Action : récupérer un document par ID ─────────────
    if (action === "getDocument") {
      const { documentId } = body;

      const { data: doc } = await supabaseAdmin
        .from("knowledge_documents")
        .select("id, title, content, category")
        .eq("id", documentId)
        .single();

      if (!doc) {
        return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
      }

      return NextResponse.json({
        answer: doc.content,
        sources: [{ id: doc.id, title: doc.title, category: doc.category, similarity: 1 }],
        confidence: 1,
      });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (err) {
    console.error("Erreur API Q&A:", err);
    return NextResponse.json(
      { error: "Erreur lors du traitement de ta question. Réessaie." },
      { status: 500 }
    );
  }
}

// ─── Recherche par mots-clés dans knowledge_documents ───────────
async function searchKnowledge(query: string): Promise<Array<{
  id: string;
  title: string;
  content: string;
  category: string;
  score: number;
}>> {
  // Extraire les mots-clés (enlever les mots courts et les accents)
  const stopWords = new Set([
    "le", "la", "les", "un", "une", "des", "de", "du", "au", "aux",
    "et", "ou", "est", "sont", "a", "en", "dans", "pour", "par",
    "sur", "avec", "qui", "que", "quoi", "comment", "quel", "quelle",
    "quels", "quelles", "ce", "cette", "ces", "mon", "ton", "son",
    "ma", "ta", "sa", "mes", "tes", "ses", "ne", "pas", "plus",
    "je", "tu", "il", "elle", "nous", "vous", "ils", "elles",
    "se", "me", "te", "lui", "leur", "on", "ca", "ça", "cest",
    "c'est", "quoi", "fait", "faire", "faut", "peut", "doit",
  ]);

  const words = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Enlever les accents
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stopWords.has(w));

  if (words.length === 0) {
    // Si aucun mot-clé, chercher avec la requête complète
    const { data } = await supabaseAdmin
      .from("knowledge_documents")
      .select("id, title, content, category")
      .ilike("content", `%${query.trim().slice(0, 50)}%`)
      .limit(3);

    return (data || []).map((d) => ({ ...d, score: 0.5 }));
  }

  // Chercher chaque mot-clé et scorer les résultats
  const allDocs = new Map<string, { doc: any; matchCount: number }>();

  for (const word of words) {
    const { data: byContent } = await supabaseAdmin
      .from("knowledge_documents")
      .select("id, title, content, category")
      .ilike("content", `%${word}%`)
      .limit(10);

    const { data: byTitle } = await supabaseAdmin
      .from("knowledge_documents")
      .select("id, title, content, category")
      .ilike("title", `%${word}%`)
      .limit(5);

    const combined = [...(byContent || []), ...(byTitle || [])];

    for (const doc of combined) {
      const existing = allDocs.get(doc.id);
      if (existing) {
        existing.matchCount++;
      } else {
        allDocs.set(doc.id, { doc, matchCount: 1 });
      }
    }
  }

  // Trier par nombre de mots-clés matchés
  const sorted = Array.from(allDocs.values())
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, 5);

  return sorted.map((item) => ({
    id: item.doc.id,
    title: item.doc.title,
    content: item.doc.content,
    category: item.doc.category || "général",
    score: Math.min(item.matchCount / words.length, 1),
  }));
}
