"use client";

import { useState, useEffect } from "react";

interface ActivityItem {
  id: string;
  type: "conversation" | "quiz" | "video" | "qa" | "login";
  title: string;
  description: string;
  date: string;
  icon: string;
  score?: number;
  duration?: string;
  link?: string;
}

export default function HistoriquePage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => { loadHistory(); }, []);

  async function loadHistory() {
    setLoading(true);
    try {
      const res = await fetch("/api/employee/history");
      const data = await res.json();
      setActivities(data.activities || []);
    } catch {}
    setLoading(false);
  }

  const filters = [
    { id: "all", label: "Tout", icon: "📋" },
    { id: "conversation", label: "Conversations", icon: "🎙️" },
    { id: "quiz", label: "Quiz", icon: "📝" },
    { id: "video", label: "Vidéos", icon: "🎬" },
    { id: "qa", label: "Q&A", icon: "❓" },
  ];

  const filtered = filter === "all" ? activities : activities.filter((a) => a.type === filter);

  // Grouper par date
  const grouped: Record<string, ActivityItem[]> = {};
  filtered.forEach((a) => {
    const d = new Date(a.date);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

    let label: string;
    if (d.toDateString() === today.toDateString()) label = "Aujourd'hui";
    else if (d.toDateString() === yesterday.toDateString()) label = "Hier";
    else if (today.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000) label = "Cette semaine";
    else if (today.getTime() - d.getTime() < 30 * 24 * 60 * 60 * 1000) label = "Ce mois";
    else label = d.toLocaleDateString("fr-CA", { month: "long", year: "numeric" });

    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(a);
  });

  function formatTime(date: string) {
    return new Date(date).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" });
  }

  function getScoreColor(score: number) {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 50) return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Mon historique</h1>
        <p className="mt-1 text-sm text-gray-500">Tout ce que tu as fait dans l'app</p>
      </div>

      {/* Stats rapides */}
      {!loading && activities.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-xl bg-white p-3 text-center shadow-sm">
            <p className="text-lg font-bold text-orange-600">{activities.filter((a) => a.type === "conversation").length}</p>
            <p className="text-[9px] text-gray-400">Conversations</p>
          </div>
          <div className="rounded-xl bg-white p-3 text-center shadow-sm">
            <p className="text-lg font-bold text-blue-600">{activities.filter((a) => a.type === "quiz").length}</p>
            <p className="text-[9px] text-gray-400">Quiz</p>
          </div>
          <div className="rounded-xl bg-white p-3 text-center shadow-sm">
            <p className="text-lg font-bold text-purple-600">{activities.filter((a) => a.type === "video").length}</p>
            <p className="text-[9px] text-gray-400">Vidéos</p>
          </div>
          <div className="rounded-xl bg-white p-3 text-center shadow-sm">
            <p className="text-lg font-bold text-green-600">{activities.filter((a) => a.type === "qa").length}</p>
            <p className="text-[9px] text-gray-400">Q&A</p>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition active:scale-95 ${
              filter === f.id ? "bg-orange-500 text-white" : "bg-white text-gray-600 shadow-sm"
            }`}>
            {f.icon} {f.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
        </div>
      )}

      {/* Vide */}
      {!loading && filtered.length === 0 && (
        <div className="rounded-xl bg-white p-10 text-center shadow-sm">
          <p className="text-4xl">📭</p>
          <p className="mt-3 text-sm font-medium text-gray-700">
            {filter === "all" ? "Aucune activité encore" : `Aucune activité de type ${filters.find((f) => f.id === filter)?.label}`}
          </p>
          <p className="mt-1 text-xs text-gray-400">Commence par une conversation ou un quiz</p>
        </div>
      )}

      {/* Timeline groupée */}
      {Object.entries(grouped).map(([label, items]) => (
        <div key={label}>
          <p className="mb-2 text-xs font-semibold text-gray-400">{label}</p>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-lg">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                      <span className="shrink-0 text-[10px] text-gray-400">{formatTime(item.date)}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">{item.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      {item.score !== undefined && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getScoreColor(item.score)}`}>
                          {item.score}%
                        </span>
                      )}
                      {item.duration && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
                          {item.duration}
                        </span>
                      )}
                      {item.link && (
                        <a href={item.link} className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-600">
                          Revoir →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
