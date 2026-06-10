"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, BarChart3, AlertTriangle, Moon, Megaphone, TrendingUp, TrendingDown, Award } from "lucide-react";

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
    if (score >= 85) return { name: "Diamant", color: "text-blue-500" };
    if (score >= 65) return { name: "Or", color: "text-yellow-500" };
    if (score >= 40) return { name: "Argent", color: "text-gray-400" };
    return { name: "Bronze", color: "text-amber-600" };
  }

  const unread = alerts.filter((a) => !a.is_read).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Suivi & Alertes</h1>
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
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-100 border-t-brand-600" />
        </div>
      )}

      {/* ─── ALERTES ─────────────────────────────────────── */}
      {!loading && tab === "alerts" && (
        <div className="space-y-3">
          {alerts.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <CheckCircle2 className="mx-auto h-8 w-8 text-green-600" strokeWidth={2} />
              <p className="mt-3 text-sm font-medium text-gray-700">Aucune alerte</p>
              <p className="text-xs text-gray-500">Tout va bien pour le moment</p>
            </div>
          )}

          {alerts.map((alert) => {
            const AlertIcon = alert.alert_type === "low_score" ? AlertTriangle : alert.alert_type === "inactive" ? Moon : Megaphone;
            return (
            <div key={alert.id} className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition ${!alert.is_read ? "border-l-4 border-l-red-500" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <AlertIcon className="h-5 w-5 text-gray-500" strokeWidth={2} />
                    <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
                  </div>
                  {alert.message && <p className="mt-1 text-xs text-gray-500">{alert.message}</p>}
                  <p className="mt-1 text-[10px] text-gray-400">{formatDate(alert.created_at)}</p>
                </div>
                {!alert.is_read && (
                  <button onClick={() => markRead(alert.id)} className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700 transition hover:bg-gray-50">
                    Lu
                  </button>
                )}
              </div>
            </div>
          );
          })}
        </div>
      )}

      {/* ─── ÉVOLUTION ───────────────────────────────────── */}
      {!loading && tab === "evolution" && (
        <div className="space-y-3">
          {evolutions.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <BarChart3 className="mx-auto h-8 w-8 text-gray-400" strokeWidth={2} />
              <p className="mt-3 text-sm font-medium text-gray-700">Pas encore de données</p>
              <p className="text-xs text-gray-500">L'évolution apparaîtra après quelques jours d'utilisation</p>
            </div>
          )}

          {evolutions.map((emp) => {
            const lvl = getLevelInfo(emp.current);
            const firstScore = emp.history.length > 0 ? emp.history[0].score : emp.current;
            const diff = emp.current - firstScore;

            return (
              <div key={emp.name} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-sm font-bold text-brand-600">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{emp.name}</p>
                      <p className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Award className={`h-3.5 w-3.5 ${lvl.color}`} strokeWidth={2} /> {lvl.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">{emp.current}</p>
                    <p className={`flex items-center justify-end gap-1 text-xs font-semibold ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-500" : "text-gray-400"}`}>
                      {diff > 0 ? <><TrendingUp className="h-3.5 w-3.5" strokeWidth={2} /> +{diff}</> : diff < 0 ? <><TrendingDown className="h-3.5 w-3.5" strokeWidth={2} /> {diff}</> : "stable"}
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
