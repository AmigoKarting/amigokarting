import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAuthEmployee } from "@/lib/supabase/middleware";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AnnouncementBanner } from "@/components/announcements/AnnouncementBanner";
import { AnnouncementPopup } from "@/components/announcements/AnnouncementPopup";
import { PushToggle } from "@/components/PushToggle";
import {
  Award, Flame, Target, ChevronRight, Rocket, Trophy, Mic, GraduationCap,
  HelpCircle, TrendingUp, Star, Clock, Lightbulb, type LucideIcon,
} from "lucide-react";
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

  let level = { name: "Bronze", color: "#B45309" };
  if (globalScore >= 85) level = { name: "Diamant", color: "#2563EB" };
  else if (globalScore >= 65) level = { name: "Or", color: "#CA8A04" };
  else if (globalScore >= 40) level = { name: "Argent", color: "#6B7280" };

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
  let next: { Icon: LucideIcon; title: string; desc: string; href: string; cta: string };
  if ((g.attempts || 0) === 0) {
    next = { Icon: Rocket, title: "Commence ta formation", desc: "Lis un module, puis relève ton premier quiz", href: "/training", cta: "C'est parti" };
  } else if (quizzesPassed < quizzesTotal) {
    const left = quizzesTotal - quizzesPassed;
    next = { Icon: Target, title: `Encore ${left} quiz à réussir`, desc: "Chaque quiz réussi compte des points et débloque des badges", href: "/training", cta: "Continuer" };
  } else {
    next = { Icon: Trophy, title: "Vise le 100 %", desc: "Refais tes quiz pour décrocher tous les badges « sans faute »", href: "/training", cta: "Rejouer" };
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bon matin" : hour < 17 ? "Bon après-midi" : "Bonne soirée";

  const shortcuts: { href: string; Icon: LucideIcon; label: string; desc: string }[] = [
    { href: "/conversations", Icon: Mic, label: "Conversation IA", desc: "Parle avec ton formateur" },
    { href: "/training", Icon: GraduationCap, label: "Formation", desc: `${quizzesPassed}/${quizzesTotal} quiz réussis` },
    { href: "/qa", Icon: HelpCircle, label: "Q&A Manuel", desc: "Cherche dans le manuel" },
    { href: "/progression", Icon: TrendingUp, label: "Progression", desc: `${badgesEarned} badge${badgesEarned > 1 ? "s" : ""} · #${rank || "—"}` },
    { href: "/score", Icon: Star, label: "Ma note", desc: `${globalScore}/100` },
    { href: "/historique", Icon: Clock, label: "Historique", desc: "Voir mon activité" },
  ];

  const chip = "inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-sm text-gray-700";

  return (
    <div className="mx-auto w-full max-w-lg space-y-5 lg:max-w-5xl">
      <AnnouncementPopup />

      {/* ─── En-tête ─── */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">{greeting}</p>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-gray-900">{emp.first_name}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className={chip}>
            <Award className="h-4 w-4" strokeWidth={2} style={{ color: level.color }} />
            <span className="font-medium">{level.name}</span>
          </span>
          <span className={chip}>
            <span className="font-semibold text-gray-900">{points}</span> pts
          </span>
          {streak > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1 text-sm font-medium text-brand-700">
              <Flame className="h-4 w-4" strokeWidth={2} /> {streak} j
            </span>
          )}
          {rank > 0 && (
            <span className={chip}>
              #{rank} <span className="text-gray-400">/ {totalPlayers}</span>
            </span>
          )}
        </div>
      </div>

      {/* ─── Sections (2 colonnes sur grand écran) ─── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
        <div className="space-y-5">

          {/* Série / défi du jour */}
          <Link
            href="/training"
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-brand-600">
              {streak > 0 ? <Flame className="h-5 w-5" strokeWidth={2} /> : <Target className="h-5 w-5" strokeWidth={2} />}
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {streak > 0 ? `${streak} jour${streak > 1 ? "s" : ""} d'affilée` : "Défi du jour"}
              </p>
              <p className="text-xs text-gray-500">
                {streak > 0 ? "Fais une activité aujourd'hui pour garder ta série" : "Fais un quiz aujourd'hui pour lancer ta série"}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" strokeWidth={2} />
          </Link>

          <AnnouncementBanner />

          <PushToggle />

          {/* Ta prochaine étape */}
          <Link
            href={next.href}
            className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300"
          >
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
                <next.Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <div className="flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">Ta prochaine étape</p>
                <p className="mt-0.5 text-base font-semibold text-gray-900">{next.title}</p>
                <p className="mt-0.5 text-xs text-gray-500">{next.desc}</p>
              </div>
              <span className="hidden shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white sm:inline-block">{next.cta}</span>
            </div>
          </Link>

        </div>

        <div className="space-y-5">

          {/* En tête du classement */}
          {leader && (
            <Link
              href="/progression"
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Trophy className="h-5 w-5" strokeWidth={2} />
              </span>
              <div className="flex-1">
                {leader.is_me ? (
                  <>
                    <p className="text-sm font-medium text-gray-900">Tu es en tête du classement</p>
                    <p className="text-xs text-gray-500">Continue comme ça pour garder ta place</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-900">En tête : {leader.name} · {leader.points} pts</p>
                    <p className="text-xs text-gray-500">Fais des quiz pour grimper au classement</p>
                  </>
                )}
              </div>
            </Link>
          )}

          {/* Accès rapide */}
          <div>
            <p className="mb-3 text-sm font-semibold text-gray-700">Accès rapide</p>
            <div className="grid grid-cols-2 gap-3">
              {shortcuts.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                    <s.Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                  </span>
                  <p className="mt-2.5 text-sm font-medium text-gray-900">{s.label}</p>
                  <p className="mt-0.5 text-[11px] text-gray-500">{s.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Conseil */}
          <div className="flex gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <Lightbulb className="h-5 w-5 shrink-0 text-brand-600" strokeWidth={2} />
            <div>
              <p className="text-xs font-medium text-gray-900">Conseil</p>
              <p className="mt-0.5 text-sm text-gray-600">
                {(g.attempts || 0) === 0
                  ? "Commence par lire une formation, puis fais le quiz : c'est rapide et ça rapporte des points."
                  : quizzesPassed < quizzesTotal
                    ? "Vise un nouveau quiz aujourd'hui — chaque réussite te rapproche d'un badge."
                    : perfect < quizzesTotal
                      ? "Tu as tout réussi. Refais tes quiz pour viser le 100 % et les badges « sans faute »."
                      : "Excellent travail. Garde ta série active et aide tes collègues à te rejoindre."}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
