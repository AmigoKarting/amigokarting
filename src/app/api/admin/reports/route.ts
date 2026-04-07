import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireManager } from "@/lib/supabase/middleware";

export async function GET(req: NextRequest) {
  await requireManager();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  if (type === "training") {
    const { data } = await supabaseAdmin
      .from("video_watch_log")
      .select("employee_id, completed, employees(first_name, last_name)")
      .eq("completed", true);
    return NextResponse.json({ data });
  }

  if (type === "conversations") {
    const { data } = await supabaseAdmin
      .from("conversation_employee_report")
      .select("*");
    return NextResponse.json({ data });
  }

  if (type === "quiz") {
    const { data } = await supabaseAdmin
      .from("quiz_question_stats")
      .select("*")
      .order("success_rate");
    return NextResponse.json({ data });
  }

  return NextResponse.json({ error: "Type de rapport invalide" }, { status: 400 });
}
