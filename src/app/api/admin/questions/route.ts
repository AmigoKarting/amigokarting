import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireManager } from "@/lib/supabase/middleware";

export async function POST(req: NextRequest) {
  await requireManager();
  const body = await req.json();

  if (body.action === "add") {
    await supabaseAdmin.from("conversation_questions").insert({
      question_text: body.questionText,
      is_priority: body.isPriority || false,
      source: "manual",
    });
    return NextResponse.json({ success: true });
  }

  if (body.action === "togglePriority") {
    await supabaseAdmin
      .from("conversation_questions")
      .update({ is_priority: body.isPriority })
      .eq("id", body.questionId);
    return NextResponse.json({ success: true });
  }

  if (body.action === "delete") {
    await supabaseAdmin
      .from("conversation_questions")
      .delete()
      .eq("id", body.questionId);
    return NextResponse.json({ success: true });
  }

  if (body.action === "generate") {
    return NextResponse.json({ error: "La génération automatique nécessite une clé OpenAI. Ajoute les questions manuellement." }, { status: 400 });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}