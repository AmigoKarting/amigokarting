"use client";

import { useState, useEffect } from "react";

interface LogEntry {
  id: string;
  first_name: string;
  success: boolean;
  ip_address: string;
  created_at: string;
}

export default function LoginLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadLogs(); }, []);

  async function loadLogs() {
    try {
      const res = await fetch("/api/admin/login-logs");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch {}
    setLoading(false);
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("fr-CA", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });
  }

  const failed = logs.filter((l) => !l.success);
  const today = logs.filter((l) => new Date(l.created_at).toDateString() === new Date().toDateString());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Logs de connexion</h1>
        <p className="mt-1 text-sm text-gray-500">Qui s'est connecté et quand</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-green-600">{today.filter((l) => l.success).length}</p>
          <p className="text-xs text-gray-500">Connexions aujourd'hui</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-red-500">{failed.length}</p>
          <p className="text-xs text-gray-500">Tentatives échouées</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-orange-600">{logs.length}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
        </div>
      )}

      {/* Logs */}
      {!loading && (
        <div className="rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3">Employé</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">IP</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{log.first_name || "Inconnu"}</td>
                    <td className="px-4 py-3">
                      {log.success ? (
                        <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">Réussi</span>
                      ) : (
                        <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">Échoué</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{log.ip_address}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(log.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
