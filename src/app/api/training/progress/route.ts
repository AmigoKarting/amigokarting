import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await req.json();
    const { videoId, watchedSec, maxPosition, completed } = body;

    // ─── Validation ──────────────────────────────────────────
    if (!videoId || typeof videoId !== "string") {
      return NextResponse.json({ error: "videoId manquant" }, { status: 400 });
    }
    if (typeof watchedSec !== "number" || watchedSec < 0) {
      return NextResponse.json({ error: "watchedSec invalide" }, { status: 400 });
    }

    // ─── Auth ────────────────────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: employee } = await supabase
      .from("employees")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!employee) {
      return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });
    }

    // ─── Anti-triche : vérifier la durée de la vidéo ─────────
    const { data: video } = await supabase
      .from("training_videos")
      .select("duration_sec")
      .eq("id", videoId)
      .single();

    if (!video) {
      return NextResponse.json({ error: "Vidéo introuvable" }, { status: 404 });
    }

    // Plafonner à la durée réelle de la vidéo
    const safeSec = Math.min(Math.floor(watchedSec), video.duration_sec);
    const safeMax = Math.min(
      Math.floor(maxPosition ?? watchedSec),
      video.duration_sec
    );

    // ─── Récupérer la progression existante ──────────────────
    const { data: existing } = await supabase
      .from("video_watch_log")
      .select("id, watched_sec, max_position, completed")
      .eq("employee_id", employee.id)
      .eq("video_id", videoId)
      .single();

    if (existing) {
      // Ne pas rétrograder max_position ni dé-compléter
      // (le trigger DB le fait aussi, mais on évite un appel inutile)
      if (existing.completed) {
        return NextResponse.json({ success: true, alreadyCompleted: true });
      }

      const newMax = Math.max(existing.max_position, safeMax);
      const newWatched = Math.max(existing.watched_sec, safeSec);

      const { error } = await supabase
        .from("video_watch_log")
        .update({
          watched_sec: newWatched,
          max_position: newMax,
          completed: completed === true,
        })
        .eq("id", existing.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      // Première fois — créer l'entrée
      const { error } = await supabase
        .from("video_watch_log")
        .insert({
          employee_id: employee.id,
          video_id: videoId,
          watched_sec: safeSec,
          max_position: safeMax,
          completed: completed === true,
        });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erreur API progress:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
