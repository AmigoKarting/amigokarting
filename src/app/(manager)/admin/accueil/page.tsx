import { getAuthEmployee } from "@/lib/supabase/middleware";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AnnouncementPopup } from "@/components/announcements/AnnouncementPopup";
import { AnnouncementBanner } from "@/components/announcements/AnnouncementBanner";
import { DailyQuestion } from "@/components/training/DailyQuestion";
import {
  Award, Flame, BarChart3, Users, TrendingUp, Megaphone, GraduationCap, Star,
  Lightbulb, ChevronRight, type LucideIcon,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ManagerHome() {
  const me: any = await getAuthEmployee();
  if (!me) return null;

  const isPatron = me.role === "patron" || me.role === "developpeur";

  // ─── Stats perso de jeu (le gérant suit aussi des formations) ──
  let g: any = {};
  try {
    const { data } = await supabaseAdmin.rpc("training_stats", { p_emp: me.id });
    g = data || {};
  } catch {}
  const points = g.points || 0;
  const rank = g.rank || 0;
  const totalPlayers = g.total_players || 0;
  const streak = g.daily_streak || 0;
  const quizzesPassed = g.quizzes_passed || 0;
  const quizzesTotal = g.quizzes_total || 0;

  let level = { name: "Bronze", color: "#B45309" };
  if (points >= 1000) level = { name: "Diamant", color: "#2563EB" };
  else if (points >= 500) level = { name: "Or", color: "#CA8A04" };
  else if (points >= 200) level = { name: "Argent", color: "#6B7280" };

  // ─── Aperçu équipe ────────────────────────────────────
  let activeCount = 0;
  let pendingCount = 0;
  try {
    const [{ count: a }, { count: p }] = await Promise.all([
      supabaseAdmin.from("employees").select("*", { count: "exact", head: true }).eq("is_active", true).in("role", ["employee", "manager", "caisse", "piste"]),
      supabaseAdmin.from("employees").select("*", { count: "exact", head: true }).eq("is_active", false),
    ]);
    activeCount = a || 0;
    pendingCount = p || 0;
  } catch {}

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bon matin" : hour < 17 ? "Bon après-midi" : "Bonne soirée";
  const roleLbl = me.role === "patron" ? "Patron" : me.role === "developpeur" ? "Dev" : "Gérant";

  const adminShortcuts: { href: string; Icon: LucideIcon; label: string; desc: string }[] = [
    { href: "/admin", Icon: BarChart3, label: "Tableau de bord", desc: "Vue d'ensemble de l'équipe" },
    { href: "/admin/employees", Icon: Users, label: "Employés", desc: `${activeCount} actif${activeCount > 1 ? "s" : ""}` },
    { href: "/admin/scores", Icon: TrendingUp, label: "Notes globales", desc: "Progrès de chacun" },
    { href: "/admin/announcements", Icon: Megaphone, label: "Annonces", desc: "Informer l'équipe" },
  ];
  const personalShortcuts: { href: string; Icon: LucideIcon; label: string; desc: string }[] = [
    { href: "/admin/my-training", Icon: GraduationCap, label: "Ma formation", desc: `${quizzesPassed}/${quizzesTotal} quiz réussis` },
    { href: "/admin/my-score", Icon: Star, label: "Ma note", desc: "Mon score perso" },
  ];

  return (
    <div className="mx-auto w-full max-w-lg space-y-5 lg:max-w-5xl">
      <AnnouncementPopup />

      {/* ─── Bienvenue + résumé perso ─── */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">{greeting} · {roleLbl}</p>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-gray-900">{me.first_name}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-sm text-gray-700">
            <Award className="h-4 w-4" strokeWidth={2} style={{ color: level.color }} />
            <span className="font-medium">{level.name}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-sm text-gray-700">
            <span className="font-semibold text-gray-900">{points}</span> pts
          </span>
          {streak > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1 text-sm font-medium text-brand-700">
              <Flame className="h-4 w-4" strokeWidth={2} /> {streak} j
            </span>
          )}
          {rank > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-sm text-gray-700">
              #{rank} <span className="text-gray-400">/ {totalPlayers}</span>
            </span>
          )}
        </div>
      </div>

      <AnnouncementBanner />

      {/* ─── 2 colonnes sur grand écran ─── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
        <div className="space-y-5">
          <DailyQuestion />

          {/* Comptes en attente (patron/dev) */}
          {isPatron && pendingCount > 0 && (
            <Link
              href="/admin/approbations"
              className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-5 py-4 transition hover:border-orange-300"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                {pendingCount}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-brand-700">
                  {pendingCount} compte{pendingCount > 1 ? "s" : ""} en attente d'approbation
                </p>
                <p className="text-xs text-brand-600">Touche pour accepter ou refuser</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-brand-600" strokeWidth={2} />
            </Link>
          )}

          {/* Gestion de l'équipe */}
          <div>
            <p className="mb-3 text-sm font-semibold text-gray-700">Gestion de l'équipe</p>
            <div className="grid grid-cols-2 gap-3">
              {adminShortcuts.map((s) => (
                <Link key={s.href} href={s.href} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                    <s.Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                  </span>
                  <p className="mt-2.5 text-sm font-medium text-gray-900">{s.label}</p>
                  <p className="mt-0.5 text-[11px] text-gray-500">{s.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {/* Mon espace personnel */}
          <div>
            <p className="mb-3 text-sm font-semibold text-gray-700">Mon espace personnel</p>
            <div className="grid grid-cols-2 gap-3">
              {personalShortcuts.map((s) => (
                <Link key={s.href} href={s.href} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                    <s.Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                  </span>
                  <p className="mt-2.5 text-sm font-medium text-gray-900">{s.label}</p>
                  <p className="mt-0.5 text-[11px] text-gray-500">{s.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Astuce du jour */}
          <div className="flex gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <Lightbulb className="h-5 w-5 shrink-0 text-brand-600" strokeWidth={2} />
            <div>
              <p className="text-xs font-medium text-gray-900">Astuce</p>
              <p className="mt-0.5 text-sm text-gray-600">
                {isPatron && pendingCount > 0
                  ? "Des employés attendent ton approbation — accepte-les pour qu'ils puissent commencer leur formation."
                  : "Passe par le Tableau de bord pour repérer qui n'a pas été actif et l'encourager."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
