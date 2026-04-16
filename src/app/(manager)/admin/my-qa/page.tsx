"use client";

import { useState, useEffect, useRef } from "react";

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
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { if (tab === "history") loadHistory(); }, [tab]);

  async function loadInitialSuggestions() {
    try {
      const res = await fetch("/api/qa?action=suggestions");
      const data = await res.json();
      const weak = data.weaknessSuggestions || [];
      const defaults = ["C'est quoi les forfaits ?", "Comment ouvrir le centre ?", "Procédure casque fissuré", "Numéros d'urgence", "Drapeaux de course", "Fermeture de caisse"];
      setSuggestions([...weak, ...defaults.filter((d) => !weak.includes(d))].slice(0, 6));
    } catch {
      setSuggestions(["Casques", "Sécurité piste", "Urgences", "Forfaits", "Ouverture centre", "Fermeture caisse"]);
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
    <div className="mx-auto flex h-[calc(100vh-6rem)] max-w-lg flex-col">
      {/* Header + onglets */}
      <div className="shrink-0 pb-3">
        <h1 className="text-xl font-bold text-gray-900">Q&A Manuel</h1>
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
          <div className="flex-1 overflow-y-auto rounded-2xl bg-gray-50 px-4 py-4">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100">
                  <svg className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>
                </div>
                <p className="mt-4 text-sm font-medium text-gray-700">Demande-moi n'importe quoi</p>
                <p className="mt-1 text-xs text-gray-400">Je cherche dans le manuel et je t'explique</p>
              </div>
            )}
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === "user" ? "rounded-br-md bg-orange-500 text-white" : "rounded-bl-md bg-white text-gray-800 shadow-sm"}`}>
                    <p className="whitespace-pre-line">{msg.content}</p>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1 border-t border-gray-100 pt-2">
                        {msg.sources.map((s, i) => (
                          <span key={i} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm">
                    <div className="flex gap-1"><span className="h-2 w-2 animate-bounce rounded-full bg-gray-300" /><span className="h-2 w-2 animate-bounce rounded-full bg-gray-300" style={{ animationDelay: "0.15s" }} /><span className="h-2 w-2 animate-bounce rounded-full bg-gray-300" style={{ animationDelay: "0.3s" }} /></div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Suggestions */}
          <div className="shrink-0 overflow-x-auto py-2">
            <div className="flex gap-2">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s)} disabled={loading}
                  className="shrink-0 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 active:scale-95 disabled:opacity-50">
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="shrink-0 pb-2">
            <div className="flex items-end gap-2">
              <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Pose ta question..." rows={1} disabled={loading}
                className="flex-1 resize-none rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm transition focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 disabled:opacity-60"
                style={{ minHeight: 44, maxHeight: 100 }} />
              <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition ${input.trim() ? "bg-orange-500 text-white active:scale-95" : "bg-gray-100 text-gray-300"}`}>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ─── TAB HISTORIQUE ────────────────────────────── */}
      {tab === "history" && (
        <div className="flex-1 overflow-y-auto">
          {historyLoading && (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
            </div>
          )}

          {!historyLoading && history.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-4xl">📭</p>
              <p className="mt-3 text-sm font-medium text-gray-700">Aucune recherche encore</p>
              <p className="mt-1 text-xs text-gray-400">Tes questions vont apparaître ici</p>
            </div>
          )}

          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="group rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <button onClick={() => sendMessage(h.query)} className="text-left">
                    <p className="text-sm font-medium text-gray-900">{h.query}</p>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">{h.response_preview}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">{formatDate(h.created_at)}</span>
                      {h.sources && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-400">{h.sources}</span>}
                    </div>
                  </button>
                  <button onClick={() => deleteHistoryItem(h.id)} className="shrink-0 rounded-lg p-1 text-gray-300 opacity-0 transition group-hover:opacity-100 active:text-red-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
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
