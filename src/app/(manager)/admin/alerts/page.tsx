"use client";

import { useState, useEffect } from "react";

interface Alert {
  id: string;
  alert_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  employees?: { first_name: string; last_name: string };
}

interface ScorePoint {
  date: string;
  score: number;
}

interface EmployeeEvolution {
  name: string;
  current: number;
  level: string;
  history: ScorePoint[];
  trend: "up" | "down" | "stable";
}

export default function AlertsAdminPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [evolutions, setEvolutions] = useState<EmployeeEvolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"alerts" | "evolution">("alerts");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/alerts");
      const data = await res.json();
      setAlerts(data.alerts || []);
      setEvolutions(data.evolutions || []);
    } catch {}
    setLoading(false);
  }

  async function markRead(id: string) {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, is_read: true } : a));
    try {
      await fetch("/api/admin/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markRead", alertId: id }),
      });
    } catch {}
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("fr-CA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  function getLevelInfo(score: number) {
    if (score >= 85) return { name: "Diamant", icon: "💎", color: "text-blue-500" };
    if (score >= 65) return { name: "Or", icon: "🥇", color: "text-yellow-500" };
    if (score >= 40) return { name: "Argent", icon: "🥈", color: "text-gray-400" };
    return { name: "Bronze", icon: "🥉", color: "text-amber-600" };
  }

  const unread = alerts.filter((a) => !a.is_read).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Suivi & Alertes</h1>
        <p className="mt-1 text-sm text-gray-500">Alertes automatiques et évolution des employés</p>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        <button onClick={() => setTab("alerts")} className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${tab === "alerts" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
          Alertes {unread > 0 && <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">{unread}</span>}
        </button>
        <button onClick={() => setTab("evolution")} className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${tab === "evolution" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
          Évolution
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
        </div>
      )}

      {/* ─── ALERTES ─────────────────────────────────────── */}
      {!loading && tab === "alerts" && (
        <div className="space-y-3">
          {alerts.length === 0 && (
            <div className="rounded-xl bg-white p-8 text-center shadow-sm">
              <p className="text-4xl">✅</p>
              <p className="mt-3 text-sm font-medium text-gray-700">Aucune alerte</p>
              <p className="text-xs text-gray-400">Tout va bien pour le moment</p>
            </div>
          )}

          {alerts.map((alert) => (
            <div key={alert.id} className={`rounded-xl bg-white p-4 shadow-sm transition ${!alert.is_read ? "border-l-4 border-red-500" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{alert.alert_type === "low_score" ? "⚠️" : alert.alert_type === "inactive" ? "😴" : "📢"}</span>
                    <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
                  </div>
                  {alert.message && <p className="mt-1 text-xs text-gray-500">{alert.message}</p>}
                  <p className="mt-1 text-[10px] text-gray-400">{formatDate(alert.created_at)}</p>
                </div>
                {!alert.is_read && (
                  <button onClick={() => markRead(alert.id)} className="shrink-0 rounded-lg bg-gray-100 px-3 py-1 text-xs text-gray-600 active:bg-gray-200">
                    Lu
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── ÉVOLUTION ───────────────────────────────────── */}
      {!loading && tab === "evolution" && (
        <div className="space-y-3">
          {evolutions.length === 0 && (
            <div className="rounded-xl bg-white p-8 text-center shadow-sm">
              <p className="text-4xl">📊</p>
              <p className="mt-3 text-sm font-medium text-gray-700">Pas encore de données</p>
              <p className="text-xs text-gray-400">L'évolution apparaîtra après quelques jours d'utilisation</p>
            </div>
          )}

          {evolutions.map((emp) => {
            const lvl = getLevelInfo(emp.current);
            const firstScore = emp.history.length > 0 ? emp.history[0].score : emp.current;
            const diff = emp.current - firstScore;

            return (
              <div key={emp.name} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{emp.name}</p>
                      <p className="text-xs text-gray-400">{lvl.icon} {lvl.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">{emp.current}</p>
                    <p className={`text-xs font-semibold ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-500" : "text-gray-400"}`}>
                      {diff > 0 ? `↑ +${diff}` : diff < 0 ? `↓ ${diff}` : "= stable"}
                    </p>
                  </div>
                </div>

                {/* Mini graphique simple */}
                {emp.history.length > 1 && (
                  <div className="flex items-end gap-1 h-12">
                    {emp.history.slice(-14).map((point, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end">
                        <div className="w-full rounded-t" style={{
                          height: `${Math.max(4, (point.score / 100) * 48)}px`,
                          background: point.score >= 65 ? "#22C55E" : point.score >= 40 ? "#F59E0B" : "#EF4444",
                          opacity: 0.3 + (i / emp.history.length) * 0.7,
                        }} />
                      </div>
                    ))}
                  </div>
                )}
                {emp.history.length > 1 && (
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-gray-300">{new Date(emp.history[Math.max(0, emp.history.length - 14)].date).toLocaleDateString("fr-CA", { day: "numeric", month: "short" })}</span>
                    <span className="text-[9px] text-gray-300">Aujourd'hui</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
