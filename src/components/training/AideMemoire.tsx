"use client";

import { useMemo, useState } from "react";
import { Search, ChevronDown, BookOpen } from "lucide-react";

interface Doc {
  id: string;
  title: string;
  content: string;
  category: string;
}

interface AideMemoireProps {
  docs: Doc[];
  locked: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  caisse: "Caisse",
  piste: "Piste",
  superviseur: "Superviseur",
};

const CATEGORY_PILL: Record<string, string> = {
  caisse: "bg-blue-50 text-blue-600",
  piste: "bg-green-50 text-green-600",
  superviseur: "bg-amber-50 text-amber-600",
};

const FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Tout" },
  { value: "caisse", label: "Caisse" },
  { value: "piste", label: "Piste" },
  { value: "superviseur", label: "Superviseur" },
];

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function categoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat] || cat;
}

export function AideMemoire({ docs, locked }: AideMemoireProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});

  const q = normalize(query.trim());
  const searching = q.length > 0;

  const results = useMemo(() => {
    return docs.filter((d) => {
      if (!locked && filter !== "all" && d.category !== filter) return false;
      if (!q) return true;
      const haystack = normalize(`${d.title} ${d.content}`);
      return haystack.includes(q);
    });
  }, [docs, locked, filter, q]);

  const toggle = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const chipBase =
    "rounded-lg px-3 py-1.5 text-sm font-medium transition";

  return (
    <div className="space-y-5">
      {/* Recherche */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
          strokeWidth={2}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un prix, un code, une procédure…"
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
        />
      </div>

      {/* Filtres de catégorie */}
      {!locked && (
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={
                  chipBase +
                  " " +
                  (active
                    ? "bg-brand-600 text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300")
                }
              >
                {f.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Compteur */}
      <p className="text-sm text-gray-500">
        {results.length} fiche{results.length > 1 ? "s" : ""}
      </p>

      {/* Résultats */}
      {results.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
            <BookOpen className="h-5 w-5" strokeWidth={2} />
          </span>
          <p className="mt-3 text-sm font-medium text-gray-900">Aucune fiche trouvée</p>
          <p className="mt-1 text-sm text-gray-500">
            Essaie un autre mot-clé ou une autre catégorie.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((d) => {
            const expanded = searching || !!openIds[d.id];
            const preview = d.content.replace(/\s+/g, " ").trim();
            return (
              <div
                key={d.id}
                className="rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                <button
                  onClick={() => toggle(d.id)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-900">{d.title}</p>
                      <span
                        className={
                          "rounded-md px-2 py-0.5 text-[11px] font-medium " +
                          (CATEGORY_PILL[d.category] || "bg-gray-100 text-gray-600")
                        }
                      >
                        {categoryLabel(d.category)}
                      </span>
                    </div>
                    {!expanded && (
                      <p className="mt-0.5 truncate text-sm text-gray-500">{preview}</p>
                    )}
                  </div>
                  <ChevronDown
                    className={
                      "mt-0.5 h-5 w-5 shrink-0 text-gray-400 transition-transform " +
                      (expanded ? "rotate-180" : "")
                    }
                    strokeWidth={2}
                  />
                </button>
                {expanded && (
                  <div className="border-t border-gray-100 px-4 py-3">
                    <p className="whitespace-pre-line text-sm text-gray-600">{d.content}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
