import { NextRequest, NextResponse } from "next/server";
import { requireManager } from "@/lib/supabase/middleware";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    await requireManager();
    const body = await req.json();
    const { action } = body;

    if (action === "import") {
      const { title, content, category, sourceFile } = body;

      if (!title || !content) {
        return NextResponse.json({ error: "title et content requis" }, { status: 400 });
      }

      // Import simple sans OpenAI — découpe en chunks de ~500 mots
      const words = content.split(/\s+/);
      const chunkSize = 500;
      const chunks: string[] = [];
      for (let i = 0; i < words.length; i += chunkSize) {
        chunks.push(words.slice(i, i + chunkSize).join(" "));
      }

      for (let i = 0; i < chunks.length; i++) {
        await supabaseAdmin.from("knowledge_documents").insert({
          title: chunks.length > 1 ? `${title} (${i + 1}/${chunks.length})` : title,
          content: chunks[i],
          category: category || "général",
          source_file: sourceFile || null,
          chunk_index: i,
          token_count: Math.round(chunks[i].split(/\s+/).length * 1.3),
        });
      }

      return NextResponse.json({ success: true, chunksCreated: chunks.length });
    }

    if (action === "list") {
      const { data } = await supabaseAdmin
        .from("knowledge_documents")
        .select("id, title, category, source_file, chunk_index, token_count, created_at")
        .order("category").order("title").order("chunk_index");
      return NextResponse.json({ documents: data || [] });
    }

    if (action === "delete") {
      const { documentId, title: delTitle } = body;
      if (documentId) {
        await supabaseAdmin.from("knowledge_documents").delete().eq("id", documentId);
      } else if (delTitle) {
        await supabaseAdmin.from("knowledge_documents").delete().ilike("title", `${delTitle}%`);
      }
      return NextResponse.json({ success: true });
    }

    if (action === "stats") {
      const { count: totalDocs } = await supabaseAdmin
        .from("knowledge_documents").select("*", { count: "exact", head: true });
      const { data: categories } = await supabaseAdmin
        .from("knowledge_documents").select("category").not("category", "is", null);
      const uniqueCategories = [...new Set(categories?.map((c) => c.category))];
      return NextResponse.json({
        totalDocuments: totalDocs || 0,
        categories: uniqueCategories,
      });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (err) {
    console.error("Erreur API knowledge:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}