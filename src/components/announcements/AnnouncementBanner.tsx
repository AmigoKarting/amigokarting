"use client";

import { useState, useEffect, useCallback } from "react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: "normal" | "important" | "urgent";
  isRead: boolean;
  authorName: string;
  authorRole: string;
  created_at: string;
}

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function loadAnnouncements() {
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list" }),
      });
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } catch {}
    setLoading(false);
  }

  const markRead = useCallback(async (id: string) => {
    try {
      await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markRead", announcementId: id }),
      });
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
      );
    } catch {}
  }, []);

  const toggle = useCallback((id: string) => {
    setExpandedId((prev) => {
      const newId = prev === id ? null : id;
      if (newId && !announcements.find((a) => a.id === id)?.isRead) {
        markRead(id);
      }
      return newId;
    });
  }, [announcements, markRead]);

  if (loading || announcements.length === 0) return null;

  const unreadCount = announcements.filter((a) => !a.isRead).length;

  function formatDate(d: string): string {
    const date = new Date(d);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diff < 1) return "À l'instant";
    if (diff < 24) return `Il y a ${diff}h`;
    const days = Math.floor(diff / 24);
    if (days === 1) return "Hier";
    if (days < 7) return `Il y a ${days} jours`;
    return date.toLocaleDateString("fr-CA");
  }

  function priorityStyle(p: string) {
    if (p === "urgent") return { bg: "bg-red-50", border: "border-red-300", dot: "bg-red-500", text: "text-red-800", label: "URGENT" };
    if (p === "important") return { bg: "bg-amber-50", border: "border-amber-300", dot: "bg-amber-500", text: "text-amber-800", label: "IMPORTANT" };
    return { bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500", text: "text-blue-800", label: "" };
  }

  return (
    <div className="space-y-3">
      {/* En-tête */}
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-gray-700">Annonces</h2>
        {unreadCount > 0 && (
          <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
            {unreadCount} nouvelle{unreadCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Liste */}
      {announcements.map((a) => {
        const style = priorityStyle(a.priority);
        const isExpanded = expandedId === a.id;

        return (
          <div
            key={a.id}
            className={`cursor-pointer overflow-hidden rounded-xl border transition-all ${style.border} ${style.bg} ${
              !a.isRead ? "ring-2 ring-orange-300" : ""
            }`}
            onClick={() => toggle(a.id)}
          >
            <div className="flex items-start gap-3 px-4 py-3">
              {/* Point non-lu */}
              {!a.isRead && (
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} />
              )}

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {style.label && (
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${style.text} ${style.bg}`}>
                      {style.label}
                    </span>
                  )}
                  <h3 className={`text-sm font-semibold ${style.text}`}>{a.title}</h3>
                </div>

                {!isExpanded && (
                  <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{a.content}</p>
                )}

                {isExpanded && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{a.content}</p>
                )}

                <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-400">
                  <span>{a.authorName}</span>
                  <span>·</span>
                  <span>{formatDate(a.created_at)}</span>
                </div>
              </div>

              {/* Flèche expand */}
              <svg
                className={`mt-1 h-4 w-4 shrink-0 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}
