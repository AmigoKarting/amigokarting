"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Layers, ChevronLeft, ChevronRight, Shuffle, RotateCcw, Lock,
} from "lucide-react";

interface Card {
  id: string;
  front: string;
  back: string;
  explanation: string;
  mod: string;
}

interface Subject {
  value: string;
  label: string;
}

interface FlashcardsData {
  category: string | null;
  locked: boolean;
  subjects: Subject[];
  cards: Card[];
}

const SUBJECT_OPTIONS = [
  { value: "", label: "Tout" },
  { value: "caisse", label: "Caisse" },
  { value: "piste", label: "Piste" },
  { value: "superviseur", label: "Superviseur" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function FichesPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [locked, setLocked] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (subj: string) => {
    setLoading(true);
    try {
      const url = subj
        ? `/api/training/flashcards?subject=${encodeURIComponent(subj)}`
        : "/api/training/flashcards";
      const res = await fetch(url);
      const data: FlashcardsData = await res.json();
      setCards(data.cards || []);
      setLocked(!!data.locked);
      setCategory(data.category ?? null);
    } catch {
      setCards([]);
    } finally {
      setIndex(0);
      setFlipped(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load("");
  }, [load]);

  const total = cards.length;
  const card = cards[index];

  const go = (delta: number) => {
    if (total === 0) return;
    setFlipped(false);
    setIndex((i) => (i + delta + total) % total);
  };

  const handleSubject = (value: string) => {
    setSubject(value);
    load(value);
  };

  const handleShuffle = () => {
    setCards((c) => shuffle(c));
    setIndex(0);
    setFlipped(false);
  };

  return (
    <div className="mx-auto w-full max-w-lg space-y-5 lg:max-w-2xl">
      {/* ─── En-tête ─── */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Fiches mémo</h1>
        <p className="mt-1 text-sm text-gray-500">
          Une carte, une notion. Touche pour voir la réponse.
        </p>
      </div>

      {/* ─── Sélecteur de sujet / libellé verrouillé ─── */}
      {locked ? (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-sm text-gray-700">
          <Lock className="h-4 w-4 text-gray-400" strokeWidth={2} />
          <span className="font-medium">{category}</span>
        </span>
      ) : (
        <div className="flex flex-wrap gap-2">
          {SUBJECT_OPTIONS.map((opt) => {
            const active = subject === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleSubject(opt.value)}
                className={
                  active
                    ? "rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-700"
                    : "rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition hover:border-gray-300"
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ─── Contenu ─── */}
      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500">Chargement…</p>
        </div>
      ) : total === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
            <Layers className="h-5 w-5" strokeWidth={2} />
          </span>
          <p className="text-sm text-gray-500">
            Aucune fiche pour ce sujet pour le moment.
          </p>
        </div>
      ) : (
        <>
          {/* La fiche */}
          <button
            onClick={() => setFlipped((f) => !f)}
            className="flex min-h-[14rem] w-full flex-col rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:border-gray-300"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              {card.mod}
            </p>
            <div className="flex flex-1 flex-col justify-center py-4">
              {!flipped ? (
                <p className="text-lg font-medium text-gray-900">{card.front}</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-lg font-bold text-gray-900">{card.back}</p>
                  {card.explanation && (
                    <p className="text-sm text-gray-500">{card.explanation}</p>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400">
              {flipped ? "Touche pour revenir à la question" : "Touche pour voir la réponse"}
            </p>
          </button>

          {/* Contrôles */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => go(-1)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} />
              Précédent
            </button>

            <span className="text-sm font-medium text-gray-500">
              {index + 1} / {total}
            </span>

            <button
              onClick={() => go(1)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300"
            >
              Suivant
              <ChevronRight className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleShuffle}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
            >
              <Shuffle className="h-5 w-5" strokeWidth={2} />
              Mélanger
            </button>
            <button
              onClick={() => setFlipped(false)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300"
            >
              <RotateCcw className="h-5 w-5" strokeWidth={2} />
              Question
            </button>
          </div>
        </>
      )}
    </div>
  );
}
