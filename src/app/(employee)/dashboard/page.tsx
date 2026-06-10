import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAuthEmployee } from "@/lib/supabase/middleware";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AnnouncementBanner } from "@/components/announcements/AnnouncementBanner";
import { AnnouncementPopup } from "@/components/announcements/AnnouncementPopup";
import { PushToggle } from "@/components/PushToggle";
import Link from "next/link";

export default async function DashboardPage() {
  const emp: any = await getAuthEmployee();
  if (!emp) return null;

  const supabase = createServerSupabaseClient();

  // ─── Formation (vidéos) ───────────────────────────────
  const { data: progress } = await supabase
    .from("video_watch_log")
    .select("completed")
    .eq("employee_id", emp.id);
  const totalWatched = progress?.filter((p: any) => p.completed).length || 0;
  const totalVideos = progress?.length || 0;
  const formPct = totalVideos > 0 ? Math.round((totalWatched / totalVideos) * 100) : 0;

  // ─── Score global + niveau ────────────────────────────
  let globalScore = 0;
  try {
    const { data: gs } = await supabaseAdmin
      .from("employee_global_score")
      .select("global_score")
      .eq("employee_id", emp.id)
      .single();
    globalScore = Math.round(gs?.global_score || 0);
  } catch {}

  let level = { name: "Bronze", icon: "🥉", color: "#D97706" };
  if (globalScore >= 85) level = { name: "Diamant", icon: "💎", color: "#60A5FA" };
  else if (globalScore >= 65) level = { name: "Or", icon: "🥇", color: "#F59E0B" };
  else if (globalScore >= 40) level = { name: "Argent", icon: "🥈", color: "#9CA3AF" };

  // ─── Stats de jeu (points, rang, série, badges, classement) ──
  let g: any = {};
  try {
    const { data } = await supabaseAdmin.rpc("training_stats", { p_emp: emp.id });
    g = data || {};
  } catch {}
  const points = g.points || 0;
  const rank = g.rank || 0;
  const totalPlayers = g.total_players || 0;
  const streak = g.daily_streak || 0;
  const quizzesPassed = g.quizzes_passed || 0;
  const quizzesTotal = g.quizzes_total || 0;
  const perfect = g.perfect_count || 0;
  const finals = g.finals_passed || 0;
  const cat = g.by_category || {};
  const leader = (g.leaderboard || [])[0] || null;
  const catDone = (n: string) => !!cat[n] && cat[n].total > 0 && cat[n].passed >= cat[n].total;
  const badgesEarned = [
    (g.attempts || 0) >= 1, quizzesPassed >= 5, perfect >= 1, perfect >= 5,
    catDone("Caisse - Amigo Karting"), catDone("Piste"), catDone("Superviseur du service à la clientèle"),
    finals >= 1, streak >= 3, streak >= 7, quizzesTotal > 0 && quizzesPassed >= quizzesTotal, points >= 1000,
  ].filter(Boolean).length;

  // ─── Prochaine étape recommandée ──────────────────────
  let next: { emoji: string; title: string; desc: string; href: string; cta: string };
  if ((g.attempts || 0) === 0) {
    next = { emoji: "🚀", title: "Commence ta formation", desc: "Lis un module, puis relève ton premier quiz", href: "/training", cta: "C'est parti" };
  } else if (quizzesPassed < quizzesTotal) {
    const left = quizzesTotal - quizzesPassed;
    next = { emoji: "🎯", title: `Encore ${left} quiz à réussir`, desc: "Chaque quiz réussi = des points et de nouveaux badges", href: "/training", cta: "Continuer" };
  } else {
    next = { emoji: "🏆", title: "Vise le 100 %", desc: "Refais tes quiz pour décrocher tous les badges « sans faute »", href: "/training", cta: "Rejouer" };
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bon matin" : hour < 17 ? "Bon après-midi" : "Bonne soirée";

  const shortcuts = [
    { href: "/conversations", icon: "🎙️", label: "Conversation IA", desc: "Parle avec ton chef formateur", color: "bg-orange-50 border-orange-200" },
    { href: "/training", icon: "🎬", label: "Formation", desc: `${quizzesPassed}/${quizzesTotal} quiz réussis`, color: "bg-blue-50 border-blue-200" },
    { href: "/qa", icon: "❓", label: "Q&A Manuel", desc: "Cherche dans le manuel", color: "bg-green-50 border-green-200" },
    { href: "/progression", icon: "🏆", label: "Progression", desc: `${badgesEarned} badge${badgesEarned > 1 ? "s" : ""} · #${rank || "—"}`, color: "bg-purple-50 border-purple-200" },
    { href: "/score", icon: "⭐", label: "Ma note", desc: `${globalScore}/100`, color: "bg-yellow-50 border-yellow-200" },
    { href: "/historique", icon: "📋", label: "Historique", desc: "Voir mon activité", color: "bg-gray-50 border-gray-200" },
  ];

  return (
    <div className="mx-auto w-full max-w-lg space-y-5 lg:max-w-5xl">
      <AnnouncementPopup />

      {/* ─── Bienvenue + résumé de jeu ─── */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white">
        <p className="text-sm text-gray-400">{greeting}</p>
        <h1 className="mt-1 text-2xl font-bold">{emp.first_name} ! 👋</h1>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium" style={{ color: level.color }}>
            {level.icon} {level.name}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold">
            🏅 {points} <span className="text-xs font-normal text-gray-400">pts</span>
          </span>
          {streak > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-orange-500/20 px-3 py-1.5 text-sm font-bold text-orange-300">
              🔥 {streak}j
            </span>
          )}
          {rank > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold">
              #{rank}<span className="text-xs font-normal text-gray-400">/{totalPlayers}</span>
            </span>
          )}
        </div>
      </div>

      {/* ─── Sections (2 colonnes sur grand écran pour remplir l'espace) ─── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
        <div className="space-y-5">

      {/* ─── Rappel : série / défi du jour ─── */}
      <Link
        href="/training"
        className="flex items-center gap-4 rounded-2xl border-2 border-orange-200 bg-orange-50 p-4 active:scale-[0.99]"
      >
        <span className="text-3xl">{streak > 0 ? "🔥" : "🎯"}</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-orange-900">
            {streak > 0 ? `${streak} jour${streak > 1 ? "s" : ""} d'affilée !` : "Défi du jour"}
          </p>
          <p className="text-xs text-orange-600">
            {streak > 0 ? "Fais une activité aujourd'hui pour garder ta série" : "Fais un quiz aujourd'hui pour lancer ta série 🔥"}
          </p>
        </div>
        <svg className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
      </Link>

      <AnnouncementBanner />

      {/* ─── Activer les rappels push ─── */}
      <PushToggle />

      {/* ─── Ta prochaine étape ─── */}
      <Link href={next.href} className="block overflow-hidden rounded-2xl bg-white shadow-sm active:scale-[0.99]">
        <div className="flex items-center gap-4 p-5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-3xl">{next.emoji}</span>
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-500">Ta prochaine étape</p>
            <p className="mt-0.5 text-base font-bold text-gray-900">{next.title}</p>
            <p className="mt-0.5 text-xs text-gray-500">{next.desc}</p>
          </div>
          <span className="shrink-0 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white">{next.cta}</span>
        </div>
      </Link>

        </div>

        <div className="space-y-5">

      {/* ─── Reconnaissance : en tête du classement ─── */}
      {leader && (
        <Link href="/progression" className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 p-4 active:scale-[0.99]">
          <span className="text-2xl">👑</span>
          <div className="flex-1">
            {leader.is_me ? (
              <>
                <p className="text-sm font-bold text-amber-900">Tu es en tête du classement !</p>
                <p className="text-xs text-amber-600">Continue comme ça pour garder ta place 🏆</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-amber-900">En tête : {leader.name} · {leader.points} pts</p>
                <p className="text-xs text-amber-600">Fais des quiz pour grimper au classement 💪</p>
              </>
            )}
          </div>
        </Link>
      )}

      {/* ─── Raccourcis ─── */}
      <div>
        <p className="mb-3 text-sm font-semibold text-gray-700">Accès rapide</p>
        <div className="grid grid-cols-2 gap-3">
          {shortcuts.map((s) => (
            <Link key={s.href} href={s.href} className={`rounded-xl border-2 p-4 transition active:scale-[0.97] ${s.color}`}>
              <span className="text-2xl">{s.icon}</span>
              <p className="mt-2 text-sm font-semibold text-gray-900">{s.label}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">{s.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* ─── Conseil du jour ─── */}
      <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
        <p className="mb-1 text-xs font-semibold text-orange-700">💡 Conseil du jour</p>
        <p className="text-sm text-orange-800">
          {(g.attempts || 0) === 0
            ? "Commence par lire une formation, puis fais le quiz : c'est rapide et ça rapporte des points."
            : quizzesPassed < quizzesTotal
              ? "Vise un nouveau quiz aujourd'hui — chaque réussite te rapproche d'un badge."
              : perfect < quizzesTotal
                ? "Tu as tout réussi ! Refais tes quiz pour viser le 100 % et les badges « sans faute »."
                : "Tu es une machine ! Garde ta série et aide tes collègues à te rattraper 😏"}
        </p>
      </div>

        </div>
      </div>
    </div>
  );
}
