"use client";

import { useState, useEffect, useRef } from "react";
import { HelpCircle, Send, X, Inbox } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
  sources?: string[];
}

interface HistoryItem {
  id: string;
  query: string;
  response_preview: string;
  sources: string;
  created_at: string;
}

// Suggestions de départ — sobres, ancrées dans les manuels
const SUGGESTIONS: string[] = [
  "Combien dans le fonds de caisse ?",
  "Que veut dire le drapeau jaune ?",
  "Que faire en cas d'accident ?",
  "Comment accueillir un client ?",
  "Comment gérer un client mécontent ?",
  "Comment inspecter un kart ?",
];

export default function QAPage() {
  const [tab, setTab] = useState<"chat" | "history">("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { loadInitialSuggestions(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, loading]);
  useEffect(() => { if (tab === "history") loadHistory(); }, [tab]);

  async function loadInitialSuggestions() {
    try {
      const res = await fetch("/api/qa?action=suggestions");
      const data = await res.json();
      const weak = data.weaknessSuggestions || [];
      setSuggestions([...weak, ...SUGGESTIONS.filter((d) => !weak.includes(d))].slice(0, 6));
    } catch {
      setSuggestions(SUGGESTIONS.slice(0, 6));
    }
  }

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "myHistory" }),
      });
      const data = await res.json();
      setHistory(data.history || []);
    } catch {}
    setHistoryLoading(false);
  }

  async function deleteHistoryItem(id: string) {
    setHistory((prev) => prev.filter((h) => h.id !== id));
    try {
      await fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteHistory", historyId: id }),
      });
    } catch {}
  }

  async function sendMessage(text?: string) {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    setTab("chat");
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: msg, timestamp: new Date() }]);
    setLoading(true);

    try {
      const hist = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "chat", message: msg, history: hist }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, {
        id: `ai-${Date.now()}`, role: "ai",
        content: data.response || "Je n'ai pas trouvé de réponse.",
        timestamp: new Date(), sources: data.sources || [],
      }]);
      if (data.nextSuggestions?.length) setSuggestions(data.nextSuggestions);
    } catch {
      setMessages((prev) => [...prev, { id: `ai-${Date.now()}`, role: "ai", content: "Erreur. Réessaie.", timestamp: new Date() }]);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function formatDate(d: string) {
    const date = new Date(d);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diff < 1) return "À l'instant";
    if (diff < 60) return `Il y a ${diff} min`;
    if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`;
    return date.toLocaleDateString("fr-CA", { day: "numeric", month: "short" });
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-6rem)] max-w-lg flex-col overflow-hidden">
      {/* Header + onglets */}
      <div className="shrink-0 pb-3">
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">Q&A Manuel</h1>
        <div className="mt-2 flex gap-1 rounded-lg bg-gray-100 p-1">
          <button onClick={() => setTab("chat")} className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${tab === "chat" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
            Discussion
          </button>
          <button onClick={() => setTab("history")} className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${tab === "history" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
            Historique
          </button>
        </div>
      </div>

      {/* ─── TAB CHAT ──────────────────────────────────── */}
      {tab === "chat" && (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
            {messages.length === 0 && (
              <div className="flex min-h-full flex-col items-center justify-center px-2 py-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-50 text-brand-600">
                  <HelpCircle className="h-6 w-6" strokeWidth={2} />
                </div>
                <p className="mt-3 text-sm font-semibold text-gray-900">Pose ta question sur le manuel</p>
                <p className="mt-1 max-w-xs text-xs text-gray-500">
                  Réponses tirées des manuels caisse, piste et supervision.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      disabled={loading}
                      className="rounded-md border border-gray-200 bg-white px-3.5 py-1.5 text-[13px] text-gray-600 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === "user" ? "rounded-br-md bg-brand-600 text-white" : "rounded-bl-md border border-gray-200 bg-white text-gray-800 shadow-sm"}`}>
                    <p className="whitespace-pre-line">{msg.content}</p>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1 border-t border-gray-100 pt-2">
                        {msg.sources.map((s, i) => (
                          <span key={i} className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-xl rounded-bl-md border border-gray-200 bg-white px-4 py-3 shadow-sm">
                    <div className="flex gap-1"><span className="h-2 w-2 animate-bounce rounded-full bg-gray-300" /><span className="h-2 w-2 animate-bounce rounded-full bg-gray-300" style={{ animationDelay: "0.15s" }} /><span className="h-2 w-2 animate-bounce rounded-full bg-gray-300" style={{ animationDelay: "0.3s" }} /></div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Suggestions de suivi — pendant la conversation (retour à la ligne, sans défilement) */}
          {messages.length > 0 && suggestions.length > 0 && (
            <div className="shrink-0 py-2">
              <div className="flex flex-wrap gap-2">
                {suggestions.slice(0, 4).map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)} disabled={loading}
                    className="rounded-md border border-orange-200 bg-orange-50 px-3.5 py-2 text-[13px] font-medium text-brand-700 shadow-sm transition hover:bg-orange-100 disabled:opacity-50">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="shrink-0 pb-2">
            <div className="flex items-end gap-2">
              <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Pose ta question..." rows={1} disabled={loading}
                className="flex-1 resize-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-orange-100 disabled:opacity-60"
                style={{ minHeight: 44, maxHeight: 100 }} />
              <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition ${input.trim() ? "bg-brand-600 text-white hover:bg-brand-700" : "bg-gray-100 text-gray-300"}`}>
                <Send className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ─── TAB HISTORIQUE ────────────────────────────── */}
      {tab === "history" && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {historyLoading && (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-brand-600" />
            </div>
          )}

          {!historyLoading && history.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                <Inbox className="h-6 w-6" strokeWidth={2} />
              </div>
              <p className="mt-3 text-sm font-medium text-gray-700">Aucune recherche encore</p>
              <p className="mt-1 text-xs text-gray-400">Tes questions vont apparaître ici</p>
            </div>
          )}

          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <button onClick={() => sendMessage(h.query)} className="text-left">
                    <p className="text-sm font-medium text-gray-900">{h.query}</p>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">{h.response_preview}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">{formatDate(h.created_at)}</span>
                      {h.sources && <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] text-gray-400">{h.sources}</span>}
                    </div>
                  </button>
                  <button onClick={() => deleteHistoryItem(h.id)} className="shrink-0 rounded-lg p-1 text-gray-300 opacity-0 transition group-hover:opacity-100 active:text-red-500">
                    <X className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
