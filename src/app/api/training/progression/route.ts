import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function getLevel(score: number) {
  if (score >= 85) return { name: "Diamant", icon: "💎", color: "#60A5FA", nextLevel: "—", pointsNeeded: 0 };
  if (score >= 65) return { name: "Or", icon: "🥇", color: "#F59E0B", nextLevel: "Diamant", pointsNeeded: 85 - score };
  if (score >= 40) return { name: "Argent", icon: "🥈", color: "#9CA3AF", nextLevel: "Or", pointsNeeded: 65 - score };
  return { name: "Bronze", icon: "🥉", color: "#D97706", nextLevel: "Argent", pointsNeeded: 40 - score };
}

function timeAgo(date: string | null) {
  if (!date) return "Jamais";
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60));
  if (diff < 1) return "À l'instant";
  if (diff < 60) return `Il y a ${diff} min`;
  if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`;
  const days = Math.floor(diff / 1440);
  if (days === 1) return "Hier";
  return `Il y a ${days} jours`;
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

    // Score global
    const { data: gs } = await supabaseAdmin
      .from("employee_global_score")
      .select("global_score, formation_pct, quiz_avg_score, conv_hours, qa_questions_asked, completed_videos, total_videos, quizzes_passed, quiz_wrong_answers")
      .eq("employee_id", eid)
      .single();

    const score = Math.round(gs?.global_score || 0);
    const level = { ...getLevel(score), score };

    // Cartes à revoir (répétition espacée)
    const { data: reviews } = await supabaseAdmin
      .from("spaced_review")
      .select("id, question_text, correct_answer, next_review_at, interval_days")
      .eq("employee_id", eid)
      .order("next_review_at", { ascending: true })
      .limit(20);

    const now = new Date();
    const reviewCards = (reviews || []).map((r: any) => {
      const due = new Date(r.next_review_at);
      const overdue = due <= now;
      const diffMs = due.getTime() - now.getTime();
      const diffH = Math.round(diffMs / (1000 * 60 * 60));
      let dueIn = overdue ? "Maintenant" : diffH < 24 ? `Dans ${diffH}h` : `Dans ${Math.round(diffH / 24)}j`;
      return { id: r.id, question: r.question_text, correct_answer: r.correct_answer, dueIn, overdue };
    });

    // Progression par sujet (basé sur les quiz)
    const topics = [
      { name: "Casques", icon: "⛑️", category: "sécurité", keywords: ["casque"] },
      { name: "Sécurité piste", icon: "🛡️", category: "sécurité", keywords: ["sécurité", "briefing", "distance"] },
      { name: "Urgences", icon: "🚨", category: "sécurité", keywords: ["urgence", "accident", "911"] },
      { name: "Drapeaux", icon: "🏁", category: "sécurité", keywords: ["drapeau"] },
      { name: "Opérations", icon: "🔧", category: "opérations", keywords: ["ouverture", "fermeture", "kart"] },
      { name: "Caisse", icon: "💰", category: "opérations", keywords: ["caisse", "rapport", "argent"] },
      { name: "Service client", icon: "👥", category: "accueil", keywords: ["accueil", "client", "forfait"] },
    ];

    // Compter les bonnes/mauvaises réponses par sujet via quiz
    const { data: answers } = await supabaseAdmin
      .from("quiz_answers")
      .select("is_correct, quiz_questions(question_text)")
      .eq("quiz_attempts.employee_id", eid);

    // Aussi compter les réponses de conversation IA
    const { data: convMem } = await supabaseAdmin
      .from("ai_memory")
      .select("key, value")
      .eq("employee_id", eid)
      .in("key", ["last_session_score"]);

    const topicsWithProgress = topics.map((t) => {
      // Estimation basée sur le score global et la formation
      const formPct = gs?.formation_pct || 0;
      const quizAvg = (gs?.quiz_avg_score || 0) * 100;
      const basePercent = Math.round((formPct * 0.5 + quizAvg * 0.5));

      // Ajuster selon les faiblesses connues
      let percent = Math.min(100, Math.max(0, basePercent));
      const total = 10;
      const mastered = Math.round(total * percent / 100);

      return { name: t.name, icon: t.icon, mastered, total, percent };
    });

    // Stats
    const { data: activity } = await supabaseAdmin
      .from("employee_activity")
      .select("*")
      .eq("employee_id", eid)
      .single();

    const { count: totalConvQuestions } = await supabaseAdmin
      .from("conversation_messages")
      .select("*", { count: "exact", head: true })
      .eq("role", "user");

    const stats = {
      totalQuestions: (gs?.quizzes_passed || 0) * 10 + (totalConvQuestions || 0),
      correctRate: gs?.quiz_avg_score ? Math.round((gs.quiz_avg_score) * 100) : 0,
      streak: activity?.login_streak || 0,
      lastActive: timeAgo(activity?.updated_at || null),
    };

    // Sauvegarder le score dans l'historique (1 fois par jour max)
    try {
      const { data: lastRecord } = await supabaseAdmin
        .from("score_history")
        .select("recorded_at")
        .eq("employee_id", eid)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .single();

      const lastDate = lastRecord?.recorded_at ? new Date(lastRecord.recorded_at) : null;
      const today = new Date();
      const shouldRecord = !lastDate || (today.getTime() - lastDate.getTime() > 12 * 60 * 60 * 1000);

      if (shouldRecord) {
        await supabaseAdmin.from("score_history").insert({
          employee_id: eid,
          global_score: score,
          formation_pct: Math.round(gs?.formation_pct || 0),
          quiz_avg: Math.round((gs?.quiz_avg_score || 0) * 100),
          conversation_hours: gs?.conv_hours || 0,
          qa_questions: gs?.qa_questions_asked || 0,
        });
      }
    } catch {}

    // Mettre à jour l'activité
    try {
      await supabaseAdmin.from("employee_activity").upsert({
        employee_id: eid,
        last_training_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "employee_id" });
    } catch {}

    // Générer alertes si score bas
    if (score < 30) {
      try {
        const { count } = await supabaseAdmin
          .from("manager_alerts")
          .select("*", { count: "exact", head: true })
          .eq("employee_id", eid)
          .eq("alert_type", "low_score")
          .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        if (!count || count === 0) {
          const { data: emp } = await supabaseAdmin
            .from("employees").select("first_name").eq("id", eid).single();
          await supabaseAdmin.from("manager_alerts").insert({
            employee_id: eid,
            alert_type: "low_score",
            title: `${emp?.first_name || "Un employé"} a un score critique`,
            message: `Score actuel : ${score}/100. Niveau : ${level.name}. Attention requise.`,
          });
        }
      } catch {}
    }

    return NextResponse.json({ level, topics: topicsWithProgress, reviewCards, stats });
  } catch (err) {
    console.error("Progression error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { data: employee } = await supabase
      .from("employees").select("id").eq("auth_user_id", user.id).single();
    if (!employee) return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });

    const body = await req.json();

    // Soumettre un résultat de révision
    if (body.action === "review") {
      const { cardId, correct } = body;

      const { data: card } = await supabaseAdmin
        .from("spaced_review")
        .select("*")
        .eq("id", cardId)
        .eq("employee_id", employee.id)
        .single();

      if (!card) return NextResponse.json({ error: "Carte introuvable" }, { status: 404 });

      let newInterval: number;
      if (correct) {
        // Augmenter l'intervalle : 1 → 3 → 7 → 14 → 30
        const intervals = [1, 3, 7, 14, 30];
        const currentIdx = intervals.indexOf(card.interval_days);
        newInterval = intervals[Math.min(currentIdx + 1, intervals.length - 1)];
      } else {
        // Remettre à 1 jour
        newInterval = 1;
      }

      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + newInterval);

      await supabaseAdmin.from("spaced_review").update({
        interval_days: newInterval,
        next_review_at: nextReview.toISOString(),
        last_reviewed_at: new Date().toISOString(),
        times_correct: correct ? card.times_correct + 1 : card.times_correct,
        times_wrong: correct ? card.times_wrong : card.times_wrong + 1,
      }).eq("id", cardId);

      // Si maîtrisé (30 jours d'intervalle + 3 bonnes de suite), supprimer
      if (correct && newInterval >= 30 && card.times_correct >= 2) {
        await supabaseAdmin.from("spaced_review").delete().eq("id", cardId);
      }

      return NextResponse.json({ success: true, nextInterval: newInterval });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (err) {
    console.error("Progression POST error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
