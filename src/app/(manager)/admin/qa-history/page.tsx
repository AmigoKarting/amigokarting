"use client";

import { useState, useEffect } from "react";

interface HistoryItem {
  id: string;
  query: string;
  response_preview: string;
  sources: string;
  created_at: string;
  employees: { first_name: string; last_name: string };
}

export default function QAAdminPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => { loadHistory(); }, []);

  async function loadHistory() {
    setLoading(true);
    try {
      const res = await fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "allHistory" }),
      });
      const data = await res.json();
      setHistory(data.history || []);
    } catch {}
    setLoading(false);
  }

  function formatDate(d: string) {
    const date = new Date(d);
    return date.toLocaleDateString("fr-CA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  const filtered = filter
    ? history.filter((h) =>
        h.employees?.first_name?.toLowerCase().includes(filter.toLowerCase()) ||
        h.employees?.last_name?.toLowerCase().includes(filter.toLowerCase()) ||
        h.query.toLowerCase().includes(filter.toLowerCase())
      )
    : history;

  // Grouper par employé
  const byEmployee: Record<string, HistoryItem[]> = {};
  filtered.forEach((h) => {
    const name = `${h.employees?.first_name || "?"} ${h.employees?.last_name || ""}`.trim();
    if (!byEmployee[name]) byEmployee[name] = [];
    byEmployee[name].push(h);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Historique Q&A</h1>
        <p className="mt-1 text-sm text-gray-500">Toutes les questions posées par les employés</p>
      </div>

      {/* Filtre */}
      <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Chercher par nom ou question..."
          className="flex-1 bg-transparent text-sm outline-none"
        />
        {filter && (
          <button onClick={() => setFilter("")} className="text-gray-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-orange-600">{history.length}</p>
          <p className="text-xs text-gray-500">Questions totales</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-orange-600">{Object.keys(byEmployee).length}</p>
          <p className="text-xs text-gray-500">Employés actifs</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-orange-600">
            {history.length > 0 ? Math.round(history.length / Math.max(Object.keys(byEmployee).length, 1)) : 0}
          </p>
          <p className="text-xs text-gray-500">Moy. par employé</p>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
        </div>
      )}

      {!loading && Object.keys(byEmployee).length === 0 && (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="text-4xl">📭</p>
          <p className="mt-3 text-sm font-medium text-gray-700">Aucune question posée</p>
        </div>
      )}

      {/* Par employé */}
      {Object.entries(byEmployee).map(([name, items]) => (
        <div key={name} className="rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
                {name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-gray-900">{name}</span>
            </div>
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">{items.length} question{items.length > 1 ? "s" : ""}</span>
          </div>

          <div className="divide-y divide-gray-50">
            {items.slice(0, 10).map((h) => (
              <div key={h.id} className="px-4 py-3">
                <p className="text-sm font-medium text-gray-900">{h.query}</p>
                <p className="mt-1 text-xs text-gray-500 line-clamp-2">{h.response_preview}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[10px] text-gray-400">{formatDate(h.created_at)}</span>
                  {h.sources && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-400">{h.sources}</span>}
                </div>
              </div>
            ))}
            {items.length > 10 && (
              <div className="px-4 py-2 text-center text-xs text-gray-400">
                + {items.length - 10} autres questions
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
