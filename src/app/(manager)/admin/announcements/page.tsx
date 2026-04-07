"use client";

import { useState, useEffect, useCallback } from "react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  isRead: boolean;
  authorName: string;
  created_at: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("normal");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => { loadAnnouncements(); }, []);

  async function loadAnnouncements() {
    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "list" }),
    });
    const data = await res.json();
    setAnnouncements(data.announcements || []);
  }

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || !content.trim()) return;
    setSending(true);
    setSuccess(false);

    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", title: title.trim(), content: content.trim(), priority }),
    });

    if (res.ok) {
      setTitle("");
      setContent("");
      setPriority("normal");
      setSuccess(true);
      loadAnnouncements();
      setTimeout(() => setSuccess(false), 3000);
    }
    setSending(false);
  }, [title, content, priority]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Supprimer cette annonce ?")) return;
    await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", announcementId: id }),
    });
    loadAnnouncements();
  }, []);

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Annonces</h1>
        <p className="text-sm text-gray-500">Publie un message que tous les employés verront en se connectant</p>
      </div>

      {/* Formulaire de création */}
      <div className="rounded-xl bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Nouvelle annonce</h2>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Titre</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Réunion vendredi 9h"
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm transition focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Message</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Détails de l'annonce..."
              rows={4}
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm transition focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Priorité</label>
            <div className="flex gap-2">
              {[
                { value: "normal", label: "Normal", color: "border-blue-300 bg-blue-50 text-blue-700" },
                { value: "important", label: "Important", color: "border-amber-300 bg-amber-50 text-amber-700" },
                { value: "urgent", label: "Urgent", color: "border-red-300 bg-red-50 text-red-700" },
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition ${
                    priority === p.value ? p.color : "border-gray-200 bg-white text-gray-500"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={sending || !title.trim() || !content.trim()}
              className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-md active:scale-[0.98] disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none"
            >
              {sending ? "Publication..." : "Publier l'annonce"}
            </button>
            {success && (
              <span className="flex items-center gap-1.5 text-sm text-green-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Publié !
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Liste des annonces existantes */}
      <div className="rounded-xl bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Annonces actives ({announcements.length})</h2>
        </div>
        {announcements.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-400">Aucune annonce active</p>
        ) : (
          <div className="divide-y">
            {announcements.map((a) => (
              <div key={a.id} className="flex items-start gap-4 px-6 py-4">
                <div className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
                  a.priority === "urgent" ? "bg-red-500" :
                  a.priority === "important" ? "bg-amber-500" : "bg-blue-500"
                }`} />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900">{a.title}</h3>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm text-gray-600">{a.content}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Par {a.authorName} · {formatDate(a.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="shrink-0 text-xs text-red-400 transition hover:text-red-600"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
