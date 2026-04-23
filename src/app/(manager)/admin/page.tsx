import { createServerSupabaseClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AnnouncementPopup } from "@/components/announcements/AnnouncementPopup";
import { PendingAccounts } from "@/components/admin/PendingAccounts";

export default async function AdminDashboard() {
  const supabase = createServerSupabaseClient();

  // ─── Toutes les requêtes en parallèle ─────────────────
  const [
    { count: employeeCount },
    { data: missingInfo },
    { count: pendingCount },
    scoresResult,
    ratingsResult,
    employeesResult,
    activitiesResult,
    conversationsResult,
    quizResult,
    alertsResult,
    recentActivityResult,
    recentConvResult,
    oldScoresResult,
  ] = await Promise.all([
    supabase.from("employees").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("employee_missing_info").select("*").eq("has_missing_info", true),
    supabase.from("employees").select("*", { count: "exact", head: true }).eq("is_active", false),
    supabaseAdmin.from("employee_global_score").select("global_score").then(r => r).catch(() => ({ data: null })),
    supabaseAdmin.from("conversation_sessions").select("rating").not("rating", "is", null).then(r => r).catch(() => ({ data: null })),
    supabaseAdmin.from("employees").select("id, first_name, last_name, created_at").eq("is_active", true).in("role", ["employee", "manager"]).then(r => r).catch(() => ({ data: null })),
    supabaseAdmin.from("employee_activity").select("employee_id, updated_at").then(r => r).catch(() => ({ data: null })),
    supabaseAdmin.from("conversation_sessions").select("employee_id, created_at").order("created_at", { ascending: false }).then(r => r).catch(() => ({ data: null })),
    supabaseAdmin.from("quiz_answers").select("is_correct, question_id, quiz_questions(question_text)").then(r => r).catch(() => ({ data: null })),
    supabaseAdmin.from("manager_alerts").select("title, alert_type, created_at").eq("is_read", false).order("created_at", { ascending: false }).limit(5).then(r => r).catch(() => ({ data: null })),
    supabaseAdmin.from("employee_activity").select("employee_id, updated_at, employees(first_name)").gte("updated_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()).then(r => r).catch(() => ({ data: null })),
    supabaseAdmin.from("conversation_sessions").select("employee_id, created_at, employees(first_name)").gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()).then(r => r).catch(() => ({ data: null })),
    supabaseAdmin.from("score_history").select("global_score").lte("recorded_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()).then(r => r).catch(() => ({ data: null })),
  ]);

  // ─── Score moyen ──────────────────────────────────────
  const scores = scoresResult?.data || [];
  const teamAvg = scores.length > 0 ? Math.round(scores.reduce((sum: number, s: any) => sum + (s.global_score || 0), 0) / scores.length) : 0;

  const oldScores = oldScoresResult?.data || [];
  const oldAvg = oldScores.length > 0 ? Math.round(oldScores.reduce((sum: number, s: any) => sum + (s.global_score || 0), 0) / oldScores.length) : teamAvg;
  const teamTrend = teamAvg - oldAvg;

  // ─── Note conversations ───────────────────────────────
  const ratings = ratingsResult?.data || [];
  const avgRating = ratings.length > 0 ? (ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length).toFixed(1) : "—";

  // ─── Inactifs — calculé sans boucle de requêtes ───────
  const employees = employeesResult?.data || [];
  const activities = activitiesResult?.data || [];
  const conversations = conversationsResult?.data || [];

  const activityMap: Record<string, string> = {};
  activities.forEach((a: any) => { activityMap[a.employee_id] = a.updated_at; });

  const lastConvMap: Record<string, string> = {};
  conversations.forEach((c: any) => {
    if (!lastConvMap[c.employee_id] || c.created_at > lastConvMap[c.employee_id]) {
      lastConvMap[c.employee_id] = c.created_at;
    }
  });

  const inactiveEmployees: { name: string; days: number }[] = [];
  for (const emp of employees) {
    let days = 0;
    if (activityMap[emp.id]) {
      days = Math.floor((Date.now() - new Date(activityMap[emp.id]).getTime()) / (1000 * 60 * 60 * 24));
    } else {
      days = Math.floor((Date.now() - new Date(emp.created_at).getTime()) / (1000 * 60 * 60 * 24));
    }
    if (lastConvMap[emp.id]) {
      const convDays = Math.floor((Date.now() - new Date(lastConvMap[emp.id]).getTime()) / (1000 * 60 * 60 * 24));
      days = Math.min(days, convDays);
    }
    if (days >= 7) {
      inactiveEmployees.push({ name: `${emp.first_name} ${emp.last_name || ""}`.trim(), days });
    }
  }
  inactiveEmployees.sort((a, b) => b.days - a.days);

  // ─── Questions ratées ─────────────────────────────────
  const qa = quizResult?.data || [];
  const byQuestion: Record<string, { text: string; total: number; wrong: number }> = {};
  for (const a of qa) {
    const qText = (a as any).quiz_questions?.question_text || "?";
    const qId = a.question_id;
    if (!byQuestion[qId]) byQuestion[qId] = { text: qText, total: 0, wrong: 0 };
    byQuestion[qId].total++;
    if (!a.is_correct) byQuestion[qId].wrong++;
  }
  const worstQuestions = Object.values(byQuestion)
    .map((q) => ({ text: q.text, failRate: Math.round((q.wrong / q.total) * 100) }))
    .filter((q) => q.failRate > 30)
    .sort((a, b) => b.failRate - a.failRate)
    .slice(0, 5);

  // ─── Alertes ──────────────────────────────────────────
  const alerts = (alertsResult?.data || []).map((a: any) => ({
    title: a.title,
    type: a.alert_type,
    date: new Date(a.created_at).toLocaleDateString("fr-CA", { day: "numeric", month: "short" }),
  }));

  // ─── Actifs récents ───────────────────────────────────
  const activeNames = new Set<string>();
  (recentActivityResult?.data || []).forEach((r: any) => { if (r.employees?.first_name) activeNames.add(r.employees.first_name); });
  (recentConvResult?.data || []).forEach((r: any) => { if (r.employees?.first_name) activeNames.add(r.employees.first_name); });
  const recentActive = [...activeNames];

  return (
    <div className="space-y-6">
      <AnnouncementPopup />
      <h1 className="text-2xl font-bold">Tableau de bord</h1>
      <PendingAccounts />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-500">Employés actifs</p>
          <p className="mt-1 text-3xl font-bold">{employeeCount || 0}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-500">Score moyen</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold">{teamAvg}</span>
            <span className="text-lg text-gray-400">/100</span>
            {teamTrend !== 0 && (
              <span className={`text-sm font-semibold ${teamTrend > 0 ? "text-green-600" : "text-red-500"}`}>
                {teamTrend > 0 ? `↑${teamTrend}` : `↓${Math.abs(teamTrend)}`}
              </span>
            )}
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-500">Infos manquantes</p>
          <p className={`mt-1 text-3xl font-bold ${(missingInfo?.length || 0) > 0 ? "text-red-600" : "text-green-600"}`}>{missingInfo?.length || 0}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-500">Note conversations</p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-green-600">{avgRating}</span>
            <span className="text-lg text-gray-400">/10</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-900">Actifs aujourd'hui</p>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <span className="text-xs text-green-600">{recentActive.length} en ligne</span>
            </span>
          </div>
          {recentActive.length === 0 ? (
            <p className="text-xs text-gray-400">Aucune activité dans les dernières 24h</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {recentActive.map((name) => (
                <div key={name} className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-200 text-[10px] font-bold text-green-800">{name.charAt(0)}</span>
                  <span className="text-xs font-medium text-green-800">{name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-900">Inactifs 7+ jours</p>
            {inactiveEmployees.length > 0 && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">{inactiveEmployees.length}</span>
            )}
          </div>
          {inactiveEmployees.length === 0 ? (
            <p className="text-xs text-gray-400">Tout le monde est actif</p>
          ) : (
            <div className="space-y-2">
              {inactiveEmployees.slice(0, 5).map((emp) => (
                <div key={emp.name} className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-200 text-[10px] font-bold text-red-800">{emp.name.charAt(0)}</span>
                    <span className="text-xs font-medium text-red-800">{emp.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-red-600">{emp.days}j</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-gray-900">Questions les plus ratées</p>
          {worstQuestions.length === 0 ? (
            <p className="text-xs text-gray-400">Pas encore de données de quiz</p>
          ) : (
            <div className="space-y-3">
              {worstQuestions.map((q, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-700 line-clamp-1 flex-1 pr-2">{q.text}</p>
                    <span className={`shrink-0 text-xs font-semibold ${q.failRate >= 70 ? "text-red-600" : q.failRate >= 50 ? "text-orange-500" : "text-yellow-600"}`}>{q.failRate}% échec</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full" style={{
                      width: `${q.failRate}%`,
                      background: q.failRate >= 70 ? "#EF4444" : q.failRate >= 50 ? "#F97316" : "#EAB308",
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-900">Alertes récentes</p>
            {alerts.length > 0 && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">{alerts.length}</span>
            )}
          </div>
          {alerts.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-3">
              <span className="text-lg">✅</span>
              <span className="text-xs text-green-700">Aucune alerte — tout va bien</span>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((a, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
                  <span className="text-base shrink-0">{a.type === "low_score" ? "⚠️" : a.type === "inactive" ? "😴" : "📢"}</span>
                  <div>
                    <p className="text-xs font-medium text-gray-900">{a.title}</p>
                    <p className="text-[10px] text-gray-400">{a.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}