"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, AlertCircle, Megaphone, type LucideIcon } from "lucide-react";

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

export function AnnouncementPopup() {
  const [unread, setUnread] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    loadUnread();
  }, []);

  async function loadUnread() {
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list" }),
      });
      const data = await res.json();
      const unreadOnes = (data.announcements || []).filter((a: Announcement) => !a.isRead);
      if (unreadOnes.length > 0) {
        setUnread(unreadOnes);
        setCurrentIndex(0);
        setShow(true);
      }
    } catch {}
  }

  const markReadAndNext = useCallback(async () => {
    const current = unread[currentIndex];
    if (!current) return;

    // Marquer comme lu
    try {
      await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markRead", announcementId: current.id }),
      });
    } catch {}

    // Passer à la suivante ou fermer
    if (currentIndex < unread.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setShow(false);
    }
  }, [unread, currentIndex]);

  if (!show || unread.length === 0) return null;

  const current = unread[currentIndex];

  function priorityConfig(p: string): { Icon: LucideIcon; label: string; iconBg: string; iconColor: string } {
    if (p === "urgent") return { Icon: AlertCircle, label: "URGENT", iconBg: "bg-red-50", iconColor: "text-red-600" };
    if (p === "important") return { Icon: AlertTriangle, label: "IMPORTANT", iconBg: "bg-amber-50", iconColor: "text-amber-600" };
    return { Icon: Megaphone, label: "ANNONCE", iconBg: "bg-orange-50", iconColor: "text-brand-600" };
  }

  const config = priorityConfig(current.priority);

  function formatDate(d: string): string {
    const date = new Date(d);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diff < 1) return "À l'instant";
    if (diff < 24) return `Il y a ${diff}h`;
    const days = Math.floor(diff / 24);
    if (days === 1) return "Hier";
    return date.toLocaleDateString("fr-CA");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
        {/* En-tête */}
        <div className="border-b border-gray-100 px-6 py-5 text-center">
          <span className={`mx-auto flex h-12 w-12 items-center justify-center rounded-lg ${config.iconBg} ${config.iconColor}`}>
            <config.Icon className="h-6 w-6" strokeWidth={2} />
          </span>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-gray-500">{config.label}</p>
          {unread.length > 1 && (
            <p className="mt-1 text-xs text-gray-400">{currentIndex + 1} / {unread.length}</p>
          )}
        </div>

        {/* Contenu */}
        <div className="px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900">{current.title}</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{current.content}</p>
          <p className="mt-4 text-xs text-gray-400">
            Par {current.authorName} · {formatDate(current.created_at)}
          </p>
        </div>

        {/* Bouton */}
        <div className="border-t border-gray-100 px-6 py-4">
          <button
            onClick={markReadAndNext}
            className="w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            {currentIndex < unread.length - 1 ? "Lu — Suivante" : "Lu — Fermer"}
          </button>
        </div>
      </div>
    </div>
  );
}
