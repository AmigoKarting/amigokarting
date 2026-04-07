import { NextRequest, NextResponse } from "next/server";
import { requireManager } from "@/lib/supabase/middleware";
import { importDocument } from "@/lib/openai/rag";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    await requireManager();
    const body = await req.json();
    const { action } = body;

    // ─── Importer un document texte ──────────────────────────
    if (action === "import") {
      const { title, content, category, sourceFile } = body;

      if (!title || !content) {
        return NextResponse.json(
          { error: "title et content requis" },
          { status: 400 }
        );
      }

      const result = await importDocument(
        title,
        content,
        category || "général",
        sourceFile
      );

      return NextResponse.json({
        success: true,
        chunksCreated: result.chunksCreated,
      });
    }

    // ─── Lister les documents ────────────────────────────────
    if (action === "list") {
      const { data } = await supabaseAdmin
        .from("knowledge_documents")
        .select("id, title, category, source_file, chunk_index, token_count, created_at")
        .order("category")
        .order("title")
        .order("chunk_index");

      return NextResponse.json({ documents: data || [] });
    }

    // ─── Supprimer un document (par titre ou id) ─────────────
    if (action === "delete") {
      const { documentId, title: delTitle } = body;

      if (documentId) {
        await supabaseAdmin
          .from("knowledge_documents")
          .delete()
          .eq("id", documentId);
      } else if (delTitle) {
        // Supprimer tous les chunks d'un même document
        await supabaseAdmin
          .from("knowledge_documents")
          .delete()
          .ilike("title", `${delTitle}%`);
      }

      return NextResponse.json({ success: true });
    }

    // ─── Stats de la base de connaissances ───────────────────
    if (action === "stats") {
      const { count: totalDocs } = await supabaseAdmin
        .from("knowledge_documents")
        .select("*", { count: "exact", head: true });

      const { data: categories } = await supabaseAdmin
        .from("knowledge_documents")
        .select("category")
        .not("category", "is", null);

      const uniqueCategories = [...new Set(categories?.map((c) => c.category))];

      const { count: totalLogs } = await supabaseAdmin
        .from("qa_logs")
        .select("*", { count: "exact", head: true });

      const { data: frequentQuestions } = await supabaseAdmin
        .from("qa_frequent_questions")
        .select("*")
        .limit(10);

      return NextResponse.json({
        totalDocuments: totalDocs || 0,
        categories: uniqueCategories,
        totalQuestions: totalLogs || 0,
        frequentQuestions: frequentQuestions || [],
      });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (err) {
    console.error("Erreur API knowledge:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
