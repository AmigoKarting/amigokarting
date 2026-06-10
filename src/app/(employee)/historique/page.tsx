"use client";

import { useState, useEffect } from "react";
import { Clock, Mic, FileText, PlayCircle, HelpCircle, Rocket, type LucideIcon } from "lucide-react";

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

  const filters: { id: string; label: string; Icon: LucideIcon }[] = [
    { id: "all", label: "Tout", Icon: Clock },
    { id: "conversation", label: "Conversations", Icon: Mic },
    { id: "quiz", label: "Quiz", Icon: FileText },
    { id: "video", label: "Vidéos", Icon: PlayCircle },
    { id: "qa", label: "Q&A", Icon: HelpCircle },
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
    if (score >= 50) return "text-brand-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-5 lg:max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Mon historique</h1>
        <p className="mt-1 text-sm text-gray-500">Tout ce que tu as fait dans l'app</p>
      </div>

      {/* Stats rapides */}
      {!loading && activities.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-xl border border-gray-200 bg-white p-3 text-center shadow-sm">
            <p className="text-lg font-semibold text-gray-900">{activities.filter((a) => a.type === "conversation").length}</p>
            <p className="text-[9px] text-gray-500">Conversations</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-3 text-center shadow-sm">
            <p className="text-lg font-semibold text-gray-900">{activities.filter((a) => a.type === "quiz").length}</p>
            <p className="text-[9px] text-gray-500">Quiz</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-3 text-center shadow-sm">
            <p className="text-lg font-semibold text-gray-900">{activities.filter((a) => a.type === "video").length}</p>
            <p className="text-[9px] text-gray-500">Vidéos</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-3 text-center shadow-sm">
            <p className="text-lg font-semibold text-gray-900">{activities.filter((a) => a.type === "qa").length}</p>
            <p className="text-[9px] text-gray-500">Q&A</p>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              filter === f.id ? "bg-brand-600 text-white" : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}>
            <f.Icon className="h-4 w-4" strokeWidth={2} /> {f.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-600" />
        </div>
      )}

      {/* Vide */}
      {!loading && filtered.length === 0 && (
        <div className="animate-pop-in rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <Rocket className="mx-auto h-10 w-10 text-gray-400" strokeWidth={2} />
          <p className="mt-3 text-sm font-medium text-gray-900">
            {filter === "all" ? "Ton aventure commence ici !" : `Rien en « ${filters.find((f) => f.id === filter)?.label} » pour l'instant`}
          </p>
          <p className="mt-1 text-xs text-gray-500">Lance-toi avec un quiz ou une conversation — ça apparaîtra ici</p>
        </div>
      )}

      {/* Timeline groupée */}
      {Object.entries(grouped).map(([label, items]) => (
        <div key={label}>
          <p className="mb-2 text-xs font-semibold text-gray-500">{label}</p>
          <div className="grid gap-2 lg:grid-cols-2">
            {items.map((item) => (
              <div key={item.id} className="animate-fade-in-up rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-lg">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                      <span className="shrink-0 text-[10px] text-gray-500">{formatTime(item.date)}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">{item.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      {item.score !== undefined && (
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${getScoreColor(item.score)}`}>
                          {item.score}%
                        </span>
                      )}
                      {item.duration && (
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
                          {item.duration}
                        </span>
                      )}
                      {item.link && (
                        <a href={item.link} className="rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-brand-700">
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
