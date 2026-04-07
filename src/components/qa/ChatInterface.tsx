"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Source {
  id: string;
  title: string;
  category: string | null;
  similarity: number;
}

interface SearchResult {
  id: string;
  title: string;
  category: string;
  preview: string;
}

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  sources?: Source[];
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  "Casques",
  "Accident",
  "Briefing sécurité",
  "Forfaits",
  "Ouverture",
  "Fermeture",
  "Caisse",
  "Drapeaux",
  "Urgence",
];

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ─── Recherche autocomplete pendant la frappe ─────────────
  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    setError("");

    // Debounce la recherche
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (value.trim().length >= 2) {
      searchTimeout.current = setTimeout(async () => {
        try {
          const res = await fetch("/api/qa", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "search", query: value.trim() }),
          });
          const data = await res.json();
          setSearchResults(data.results || []);
          setShowResults(data.results?.length > 0);
        } catch {
          setSearchResults([]);
          setShowResults(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, []);

  // ─── Envoyer une question ─────────────────────────────────
  const askQuestion = useCallback(async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setError("");
    setInput("");
    setSearchResults([]);
    setShowResults(false);

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ask", question: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erreur serveur");

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: "ai",
        content: data.answer,
        sources: data.sources,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setError(err.message || "Impossible de répondre. Réessaie.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [loading]);

  // ─── Cliquer sur un résultat autocomplete ─────────────────
  const selectResult = useCallback(async (result: SearchResult) => {
    setInput("");
    setSearchResults([]);
    setShowResults(false);

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: result.title,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getDocument", documentId: result.id }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: "ai",
        content: data.answer,
        sources: data.sources,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setError(err.message || "Erreur.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, []);

  return (
    <div className="flex h-[calc(100vh-180px)] min-h-[350px] sm:min-h-[500px] flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      {/* ─── Zone de messages ───────────────────────────── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5">
        {messages.length === 0 && !loading && (
          <div className="flex h-full flex-col items-center justify-center px-4">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100">
              <svg className="h-7 w-7 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900">Questions sur le manuel ?</h3>
            <p className="mt-1 text-center text-sm text-gray-500">
              Tape un mot-clé ou clique sur un sujet ci-dessous.
            </p>
          </div>
        )}

        {messages.length > 0 && (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-md bg-orange-500 px-4 py-3 text-sm text-white">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100">
                      <svg className="h-4 w-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                    </div>
                    <div className="max-w-[85%]">
                      <div className="rounded-2xl rounded-tl-md bg-gray-100 px-4 py-3 text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
                        {msg.content}
                      </div>
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                          </svg>
                          {msg.sources.map((src) => (
                            <span key={src.id} className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">
                              {src.title}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100">
                  <svg className="h-4 w-4 animate-spin text-orange-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                <div className="rounded-2xl rounded-tl-md bg-gray-100 px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-300" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-300" style={{ animationDelay: "0.15s" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-300" style={{ animationDelay: "0.3s" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Suggestions (toujours visibles) ───────────── */}
      <div className="border-t border-gray-100 px-4 py-2">
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => askQuestion(q)}
              disabled={loading}
              className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-600 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Erreur ────────────────────────────────────── */}
      {error && (
        <div className="mx-4 mb-2 rounded-lg bg-red-50 px-4 py-2 text-center text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ─── Barre de saisie + autocomplete ────────────── */}
      <div className="relative border-t border-gray-100 px-4 py-3">
        {/* Résultats autocomplete */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute bottom-full left-4 right-4 mb-1 max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
            <p className="border-b border-gray-100 px-4 py-2 text-xs font-medium text-gray-400">
              Résultats du manuel
            </p>
            {searchResults.map((result) => (
              <button
                key={result.id}
                onClick={() => selectResult(result)}
                className="flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3 text-left transition last:border-0 hover:bg-orange-50"
              >
                <span className="mt-0.5 rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700">
                  {result.category}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{result.title}</p>
                  <p className="mt-0.5 text-xs text-gray-400 line-clamp-2">{result.preview}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (showResults && searchResults.length > 0) {
                  selectResult(searchResults[0]);
                } else {
                  askQuestion(input);
                }
              }
              if (e.key === "Escape") {
                setShowResults(false);
              }
            }}
            onFocus={() => {
              if (searchResults.length > 0) setShowResults(true);
            }}
            placeholder="Tape un mot-clé... (ex: casque, accident, caisse)"
            disabled={loading}
            className="flex-1 rounded-xl border-2 border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 transition
                       placeholder:text-gray-400
                       focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100
                       disabled:opacity-60"
          />
          <button
            onClick={() => {
              if (showResults && searchResults.length > 0) {
                selectResult(searchResults[0]);
              } else {
                askQuestion(input);
              }
            }}
            disabled={loading || !input.trim()}
            className="flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-orange-500 text-white
                       transition hover:bg-orange-600 active:scale-95
                       disabled:bg-gray-300"
            aria-label="Envoyer"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-gray-400">
          Recherche dans le manuel d'Amigo Karting
        </p>
      </div>
    </div>
  );
}
