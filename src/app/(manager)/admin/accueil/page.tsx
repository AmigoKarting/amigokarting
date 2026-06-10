import { getAuthEmployee } from "@/lib/supabase/middleware";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AnnouncementPopup } from "@/components/announcements/AnnouncementPopup";
import { AnnouncementBanner } from "@/components/announcements/AnnouncementBanner";
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

  let level = { name: "Bronze", icon: "🥉", color: "#D97706" };
  if (points >= 1000) level = { name: "Diamant", icon: "💎", color: "#60A5FA" };
  else if (points >= 500) level = { name: "Or", icon: "🥇", color: "#F59E0B" };
  else if (points >= 200) level = { name: "Argent", icon: "🥈", color: "#9CA3AF" };

  // ─── Aperçu équipe ────────────────────────────────────
  let activeCount = 0;
  let pendingCount = 0;
  try {
    const [{ count: a }, { count: p }] = await Promise.all([
      supabaseAdmin.from("employees").select("*", { count: "exact", head: true }).eq("is_active", true).in("role", ["employee", "manager"]),
      supabaseAdmin.from("employees").select("*", { count: "exact", head: true }).eq("is_active", false),
    ]);
    activeCount = a || 0;
    pendingCount = p || 0;
  } catch {}

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bon matin" : hour < 17 ? "Bon après-midi" : "Bonne soirée";
  const roleLbl = me.role === "patron" ? "Patron" : me.role === "developpeur" ? "Dev" : "Gérant";

  const adminShortcuts = [
    { href: "/admin", icon: "📊", label: "Tableau de bord", desc: "Vue d'ensemble de l'équipe", color: "bg-gray-50 border-gray-200" },
    { href: "/admin/employees", icon: "👥", label: "Employés", desc: `${activeCount} actif${activeCount > 1 ? "s" : ""}`, color: "bg-blue-50 border-blue-200" },
    { href: "/admin/scores", icon: "📈", label: "Notes globales", desc: "Progrès de chacun", color: "bg-green-50 border-green-200" },
    { href: "/admin/announcements", icon: "📣", label: "Annonces", desc: "Informer l'équipe", color: "bg-orange-50 border-orange-200" },
  ];
  const personalShortcuts = [
    { href: "/admin/my-training", icon: "🎓", label: "Ma formation", desc: `${quizzesPassed}/${quizzesTotal} quiz réussis`, color: "bg-purple-50 border-purple-200" },
    { href: "/admin/my-score", icon: "⭐", label: "Ma note", desc: "Mon score perso", color: "bg-yellow-50 border-yellow-200" },
  ];

  return (
    <div className="mx-auto w-full max-w-lg space-y-5 lg:max-w-5xl">
      <AnnouncementPopup />

      {/* ─── Bienvenue + résumé perso ─── */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white">
        <p className="text-sm text-gray-400">{greeting} · {roleLbl}</p>
        <h1 className="mt-1 text-2xl font-bold">{me.first_name} ! 👋</h1>
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

      <AnnouncementBanner />

      {/* ─── 2 colonnes sur grand écran ─── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
        <div className="space-y-5">
          {/* Comptes en attente (patron/dev) */}
          {isPatron && pendingCount > 0 && (
            <Link
              href="/admin/approbations"
              className="flex items-center gap-3 rounded-2xl border-2 border-orange-300 bg-orange-50 px-5 py-4 transition active:scale-[0.99]"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                {pendingCount}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-orange-900">
                  {pendingCount} compte{pendingCount > 1 ? "s" : ""} en attente d'approbation
                </p>
                <p className="text-xs text-orange-600">Touche pour accepter ou refuser →</p>
              </div>
              <span className="shrink-0 text-orange-400">→</span>
            </Link>
          )}

          {/* Gestion de l'équipe */}
          <div>
            <p className="mb-3 text-sm font-semibold text-gray-700">Gestion de l'équipe</p>
            <div className="grid grid-cols-2 gap-3">
              {adminShortcuts.map((s) => (
                <Link key={s.href} href={s.href} className={`rounded-xl border-2 p-4 transition active:scale-[0.97] ${s.color}`}>
                  <span className="text-2xl">{s.icon}</span>
                  <p className="mt-2 text-sm font-semibold text-gray-900">{s.label}</p>
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
                <Link key={s.href} href={s.href} className={`rounded-xl border-2 p-4 transition active:scale-[0.97] ${s.color}`}>
                  <span className="text-2xl">{s.icon}</span>
                  <p className="mt-2 text-sm font-semibold text-gray-900">{s.label}</p>
                  <p className="mt-0.5 text-[11px] text-gray-500">{s.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Astuce du jour */}
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
            <p className="mb-1 text-xs font-semibold text-orange-700">💡 Astuce</p>
            <p className="text-sm text-orange-800">
              {isPatron && pendingCount > 0
                ? "Des employés attendent ton approbation — accepte-les pour qu'ils puissent commencer leur formation."
                : "Passe par le Tableau de bord pour repérer qui n'a pas été actif et l'encourager 💪"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
