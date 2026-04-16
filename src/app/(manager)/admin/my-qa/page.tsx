"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface SearchResult {
  id: string;
  title: string;
  content: string;
  category: string;
  relevance: number;
  highlight: string;
}

interface HistoryItem {
  query: string;
  timestamp: Date;
}

interface RelatedQuestion {
  text: string;
  category: string;
}

export default function QAPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [relatedQuestions, setRelatedQuestions] = useState<RelatedQuestion[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [weaknessSuggestions, setWeaknessSuggestions] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Charger les suggestions et l'historique au démarrage
  useEffect(() => {
    loadSuggestions();
    loadHistory();
  }, []);

  async function loadSuggestions() {
    try {
      const res = await fetch("/api/qa?action=suggestions");
      const data = await res.json();
      if (data.weaknessSuggestions) setWeaknessSuggestions(data.weaknessSuggestions);
    } catch {}
  }

  async function loadHistory() {
    try {
      const res = await fetch("/api/qa?action=history");
      const data = await res.json();
      if (data.history) setHistory(data.history.map((h: any) => ({ ...h, timestamp: new Date(h.timestamp) })));
    } catch {}
  }

  const search = useCallback(async (q?: string) => {
    const searchQuery = q || query;
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "search", query: searchQuery }),
      });
      const data = await res.json();

      setResults(data.results || []);
      setRelatedQuestions(data.relatedQuestions || []);
      setSuggestions(data.autocomplete || []);

      // Ajouter à l'historique local
      setHistory((prev) => {
        const newItem = { query: searchQuery, timestamp: new Date() };
        const filtered = prev.filter((h) => h.query !== searchQuery);
        return [newItem, ...filtered].slice(0, 20);
      });
    } catch {
      setResults([]);
    }

    setLoading(false);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); search(); }
  };

  const quickSearch = (text: string) => {
    setQuery(text);
    search(text);
  };

  // Autocomplete en temps réel
  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/qa?action=autocomplete&q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.suggestions) setSuggestions(data.suggestions);
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const categories = [
    { id: "accueil", label: "Accueil clients", icon: "👋" },
    { id: "casque", label: "Casques", icon: "⛑️" },
    { id: "sécurité", label: "Sécurité", icon: "🛡️" },
    { id: "urgence", label: "Urgences", icon: "🚨" },
    { id: "opérations", label: "Opérations", icon: "🔧" },
    { id: "caisse", label: "Caisse", icon: "💰" },
    { id: "drapeau", label: "Drapeaux", icon: "🏁" },
    { id: "fermeture", label: "Fermeture", icon: "🔒" },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Q&A Manuel</h1>
        <p className="mt-1 text-sm text-gray-500">Cherche n'importe quoi dans le manuel d'Amigo Karting</p>
      </div>

      {/* Barre de recherche style Google */}
      <div className="relative">
        <div className="flex items-center rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-orange-400 focus-within:shadow-md">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Comment on fait pour... ?"
            className="ml-3 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
            autoFocus
          />
          {query && (
            <button onClick={() => { setQuery(""); setSearched(false); setResults([]); inputRef.current?.focus(); }} className="ml-2 text-gray-400 active:text-gray-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
          <button onClick={() => search()} disabled={!query.trim() || loading} className="ml-2 rounded-xl bg-orange-500 px-4 py-2 text-xs font-semibold text-white active:scale-95 disabled:opacity-50">
            Chercher
          </button>
        </div>

        {/* Autocomplete dropdown */}
        {suggestions.length > 0 && !searched && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-xl border border-gray-200 bg-white shadow-lg">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => quickSearch(s)} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 transition first:rounded-t-xl last:rounded-b-xl hover:bg-gray-50 active:bg-gray-100">
                <svg className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Suggestions selon les faiblesses */}
      {!searched && weaknessSuggestions.length > 0 && (
        <div className="rounded-xl bg-orange-50 p-4">
          <p className="mb-2 text-xs font-semibold text-orange-700">Recommandé pour toi :</p>
          <div className="flex flex-wrap gap-2">
            {weaknessSuggestions.map((s, i) => (
              <button key={i} onClick={() => quickSearch(s)} className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-orange-700 shadow-sm active:scale-95">{s}</button>
            ))}
          </div>
        </div>
      )}

      {/* Catégories - page d'accueil */}
      {!searched && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => quickSearch(cat.label)} className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 shadow-sm transition active:scale-[0.97]">
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-xs font-medium text-gray-600">{cat.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Historique */}
      {!searched && history.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold text-gray-400">Recherches récentes</p>
          <div className="flex flex-wrap gap-2">
            {history.slice(0, 8).map((h, i) => (
              <button key={i} onClick={() => quickSearch(h.query)} className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-600 active:bg-gray-200">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {h.query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
        </div>
      )}

      {/* Résultats */}
      {searched && !loading && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">{results.length} résultat{results.length !== 1 ? "s" : ""} pour "{query}"</p>

          {results.length === 0 && (
            <div className="rounded-xl bg-white p-8 text-center shadow-sm">
              <p className="text-4xl">🤷</p>
              <p className="mt-3 text-sm font-medium text-gray-700">Aucun résultat trouvé</p>
              <p className="mt-1 text-xs text-gray-400">Essaie avec d'autres mots ou choisis une catégorie</p>
            </div>
          )}

          {results.map((result) => (
            <div key={result.id} className="rounded-xl bg-white shadow-sm overflow-hidden">
              <button onClick={() => setExpandedId(expandedId === result.id ? null : result.id)} className="w-full p-4 text-left">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 mb-1">{result.category}</span>
                    <h3 className="text-sm font-semibold text-gray-900">{result.title}</h3>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">{result.highlight}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="h-2 w-12 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-orange-400" style={{ width: `${Math.min(100, result.relevance)}%` }} />
                    </div>
                    <svg className={`h-4 w-4 text-gray-400 transition ${expandedId === result.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </button>

              {expandedId === result.id && (
                <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
                  <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">{result.content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Questions reliées */}
      {searched && !loading && relatedQuestions.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold text-gray-400">Questions reliées</p>
          <div className="space-y-2">
            {relatedQuestions.map((rq, i) => (
              <button key={i} onClick={() => quickSearch(rq.text)} className="flex w-full items-center gap-3 rounded-xl bg-white px-4 py-3 text-left shadow-sm transition active:scale-[0.99]">
                <svg className="h-4 w-4 shrink-0 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                <span className="text-sm text-gray-700">{rq.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
