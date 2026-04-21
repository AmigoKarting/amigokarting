import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function fmtDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h}h${m % 60 > 0 ? `${m % 60}min` : ""}`;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { data: employee } = await supabase
      .from("employees").select("id").eq("auth_user_id", user.id).single();
    if (!employee) return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });

    const eid = employee.id;
    const activities: any[] = [];

    // ─── Conversations IA ───────────────────────────────
    try {
      const { data: convs } = await supabaseAdmin
        .from("conversation_sessions")
        .select("id, created_at, ended_at, duration_sec, rating, total_questions")
        .eq("employee_id", eid)
        .order("created_at", { ascending: false })
        .limit(50);

      (convs || []).forEach((c: any) => {
        const score = c.rating ? c.rating * 10 : undefined;
        activities.push({
          id: `conv-${c.id}`,
          type: "conversation",
          title: "Conversation avec le Chef Formateur",
          description: `${c.total_questions || 0} question${(c.total_questions || 0) > 1 ? "s" : ""}${c.rating ? ` · Note : ${c.rating}/10` : ""}`,
          date: c.created_at,
          icon: "🎙️",
          score,
          duration: c.duration_sec ? fmtDuration(c.duration_sec) : undefined,
          link: "/conversations",
        });
      });
    } catch {}

    // ─── Quiz ───────────────────────────────────────────
    try {
      const { data: quizzes } = await supabaseAdmin
        .from("quiz_attempts")
        .select("id, created_at, score, passed, quizzes(title)")
        .eq("employee_id", eid)
        .order("created_at", { ascending: false })
        .limit(50);

      (quizzes || []).forEach((q: any) => {
        const quizTitle = (q as any).quizzes?.title || "Quiz";
        activities.push({
          id: `quiz-${q.id}`,
          type: "quiz",
          title: quizTitle,
          description: q.passed ? "Réussi" : "Échoué",
          date: q.created_at,
          icon: q.passed ? "✅" : "❌",
          score: Math.round((q.score || 0) * 100),
          link: "/training",
        });
      });
    } catch {}

    // ─── Vidéos regardées ───────────────────────────────
    try {
      const { data: videos } = await supabaseAdmin
        .from("video_watch_log")
        .select("id, completed, watched_seconds, total_seconds, updated_at, training_videos(title)")
        .eq("employee_id", eid)
        .order("updated_at", { ascending: false })
        .limit(50);

      (videos || []).forEach((v: any) => {
        const videoTitle = (v as any).training_videos?.title || "Vidéo";
        const percent = v.total_seconds > 0 ? Math.round((v.watched_seconds / v.total_seconds) * 100) : 0;
        activities.push({
          id: `vid-${v.id}`,
          type: "video",
          title: videoTitle,
          description: v.completed ? "Terminée" : `${percent}% regardée`,
          date: v.updated_at,
          icon: v.completed ? "🎬" : "▶️",
          score: v.completed ? 100 : percent,
          duration: v.watched_seconds ? fmtDuration(v.watched_seconds) : undefined,
          link: "/training",
        });
      });
    } catch {}

    // ─── Questions Q&A ──────────────────────────────────
    try {
      const { data: qaItems } = await supabaseAdmin
        .from("qa_history")
        .select("id, query, response_preview, sources, created_at")
        .eq("employee_id", eid)
        .order("created_at", { ascending: false })
        .limit(50);

      (qaItems || []).forEach((q: any) => {
        activities.push({
          id: `qa-${q.id}`,
          type: "qa",
          title: q.query,
          description: q.response_preview ? q.response_preview.slice(0, 80) + "..." : "Recherche dans le manuel",
          date: q.created_at,
          icon: "❓",
          link: "/qa",
        });
      });
    } catch {}

    // Trier par date (plus récent en premier)
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ activities: activities.slice(0, 100) });
  } catch (err) {
    console.error("History error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
