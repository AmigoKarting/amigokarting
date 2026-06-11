"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, Check, X } from "lucide-react";

interface Daily {
  date: string;
  id: string;
  q: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

export function DailyQuestion() {
  const [data, setData] = useState<Daily | null>(null);
  const [loading, setLoading] = useState(true);
  const [chosen, setChosen] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/training/daily")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Daily | null) => {
        if (!active) return;
        if (d && Array.isArray(d.choices)) {
          setData(d);
          // Restaurer l'état répondu pour la date du jour.
          try {
            const raw = localStorage.getItem(`daily-answer-${d.date}`);
            if (raw !== null) {
              const idx = parseInt(raw, 10);
              if (!Number.isNaN(idx)) setChosen(idx);
            }
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function answer(idx: number) {
    if (chosen !== null || !data) return;
    setChosen(idx);
    try {
      localStorage.setItem(`daily-answer-${data.date}`, String(idx));
    } catch {}
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
          <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />
          <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const answered = chosen !== null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-brand-600">
          <CalendarCheck className="h-5 w-5" strokeWidth={2} />
        </span>
        <h2 className="font-semibold text-gray-900">Question du jour</h2>
      </div>

      {/* Question */}
      <p className="mt-4 text-sm font-medium text-gray-900">{data.q}</p>

      {/* Choix */}
      <div className="mt-3 space-y-2">
        {data.choices.map((choice, idx) => {
          const isCorrect = idx === data.correctIndex;
          const isChosen = idx === chosen;

          let cls =
            "flex w-full items-center justify-between gap-2 rounded-lg border px-4 py-2.5 text-left text-sm transition";
          if (!answered) {
            cls +=
              " border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50";
          } else if (isCorrect) {
            cls += " border-green-200 bg-green-50 text-green-700";
          } else if (isChosen) {
            cls += " border-red-200 bg-red-50 text-red-700";
          } else {
            cls += " border-gray-200 bg-white text-gray-400";
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => answer(idx)}
              disabled={answered}
              className={cls}
            >
              <span>{choice}</span>
              {answered && isCorrect && (
                <Check className="h-4 w-4 shrink-0" strokeWidth={2} />
              )}
              {answered && isChosen && !isCorrect && (
                <X className="h-4 w-4 shrink-0" strokeWidth={2} />
              )}
            </button>
          );
        })}
      </div>

      {/* Explication + rappel */}
      {answered && (
        <>
          {data.explanation && (
            <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              {data.explanation}
            </div>
          )}
          <p className="mt-3 text-xs text-gray-500">
            Reviens demain pour une nouvelle question.
          </p>
        </>
      )}
    </div>
  );
}
