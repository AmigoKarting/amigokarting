import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAuthEmployee } from "@/lib/supabase/middleware";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AnnouncementBanner } from "@/components/announcements/AnnouncementBanner";
import { AnnouncementPopup } from "@/components/announcements/AnnouncementPopup";
import Link from "next/link";

export default async function DashboardPage() {
  const emp: any = await getAuthEmployee();
  if (!emp) return null;

  // ─── Données ──────────────────────────────────────────
  const supabase = createServerSupabaseClient();

  const { data: progress } = await supabase
    .from("video_watch_log")
    .select("completed")
    .eq("employee_id", emp.id);

  const totalWatched = progress?.filter((p: any) => p.completed).length || 0;
  const totalVideos = progress?.length || 0;
  const formPct = totalVideos > 0 ? Math.round((totalWatched / totalVideos) * 100) : 0;

  let globalScore = 0;
  try {
    const { data: gs } = await supabaseAdmin
      .from("employee_global_score")
      .select("global_score")
      .eq("employee_id", emp.id)
      .single();
    globalScore = Math.round(gs?.global_score || 0);
  } catch {}

  let convCount = 0;
  try {
    const { count } = await supabaseAdmin
      .from("conversation_sessions")
      .select("*", { count: "exact", head: true })
      .eq("employee_id", emp.id);
    convCount = count || 0;
  } catch {}

  let qaCount = 0;
  try {
    const { count } = await supabaseAdmin
      .from("qa_history")
      .select("*", { count: "exact", head: true })
      .eq("employee_id", emp.id);
    qaCount = count || 0;
  } catch {}

  // Niveau
  let level = { name: "Bronze", icon: "🥉", color: "#D97706" };
  if (globalScore >= 85) level = { name: "Diamant", icon: "💎", color: "#60A5FA" };
  else if (globalScore >= 65) level = { name: "Or", icon: "🥇", color: "#F59E0B" };
  else if (globalScore >= 40) level = { name: "Argent", icon: "🥈", color: "#9CA3AF" };

  // Message selon l'heure
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bon matin" : hour < 17 ? "Bon après-midi" : "Bonne soirée";

  // Raccourcis
  const shortcuts = [
    { href: "/conversations", icon: "🎙️", label: "Conversation IA", desc: "Parle avec ton chef formateur", color: "bg-orange-50 border-orange-200" },
    { href: "/training", icon: "🎬", label: "Formation", desc: `${formPct}% complétée`, color: "bg-blue-50 border-blue-200" },
    { href: "/qa", icon: "❓", label: "Q&A Manuel", desc: "Cherche dans le manuel", color: "bg-green-50 border-green-200" },
    { href: "/progression", icon: "📊", label: "Ma progression", desc: `${level.icon} ${level.name}`, color: "bg-purple-50 border-purple-200" },
    { href: "/score", icon: "⭐", label: "Ma note", desc: `${globalScore}/100`, color: "bg-yellow-50 border-yellow-200" },
    { href: "/historique", icon: "📋", label: "Historique", desc: "Voir mon activité", color: "bg-gray-50 border-gray-200" },
  ];

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <AnnouncementPopup />

      {/* Bienvenue */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white">
        <p className="text-sm text-gray-400">{greeting}</p>
        <h1 className="mt-1 text-2xl font-bold">{emp.first_name} !</h1>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
            <span className="text-lg">{level.icon}</span>
            <span className="text-sm font-medium" style={{ color: level.color }}>{level.name}</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
            <span className="text-sm font-bold">{globalScore}</span>
            <span className="text-xs text-gray-400">/100</span>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full transition-all" style={{ width: `${globalScore}%`, background: level.color }} />
        </div>
      </div>

      {/* Annonces */}
      <AnnouncementBanner />

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-orange-600">{formPct}%</p>
          <p className="text-[10px] text-gray-400">Formation</p>
        </div>
        <div className="rounded-xl bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-blue-600">{convCount}</p>
          <p className="text-[10px] text-gray-400">Conversations</p>
        </div>
        <div className="rounded-xl bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-green-600">{qaCount}</p>
          <p className="text-[10px] text-gray-400">Questions Q&A</p>
        </div>
      </div>

      {/* Raccourcis */}
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

      {/* Conseil du jour */}
      <div className="rounded-xl bg-orange-50 border border-orange-200 p-4">
        <p className="text-xs font-semibold text-orange-700 mb-1">Conseil du jour</p>
        <p className="text-sm text-orange-800">
          {globalScore < 40
            ? "Commence par les vidéos de formation. Chaque vidéo complétée augmente ton score."
            : globalScore < 65
              ? "Continue tes conversations IA. Le chef formateur s'adapte à tes faiblesses."
              : globalScore < 85
                ? "T'es presque Or ! Révise tes questions ratées dans la section Progression."
                : "T'es au top ! Continue à t'entraîner pour garder ton niveau Diamant."
          }
        </p>
      </div>
    </div>
  );
}
