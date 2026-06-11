"use client";

import { useState } from "react";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";

interface Mistake {
  question_id: string;
  question: string;
  correct: string;
  explanation: string;
  category: string;
  module_title: string;
}

export function MistakesReview({ items }: { items: Mistake[] }) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
            <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <p className="text-base font-semibold text-gray-900">Aucune erreur à revoir</p>
            <p className="mt-0.5 text-sm text-gray-500">
              Continue comme ça — tu maîtrises tes quiz.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const allRevealed = revealed.size === items.length;

  function toggle(i: number) {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function toggleAll() {
    if (allRevealed) setRevealed(new Set());
    else setRevealed(new Set(items.map((_, i) => i)));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">
          {items.length} question{items.length > 1 ? "s" : ""} à revoir
        </p>
        <button
          onClick={toggleAll}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:border-gray-300"
        >
          {allRevealed ? (
            <EyeOff className="h-4 w-4" strokeWidth={2} />
          ) : (
            <Eye className="h-4 w-4" strokeWidth={2} />
          )}
          {allRevealed ? "Tout cacher" : "Tout révéler"}
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item, i) => {
          const isOpen = revealed.has(i);
          return (
            <div
              key={`${item.question_id}-${i}`}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <p className="font-medium text-gray-900">{item.question}</p>
              <p className="mt-1 text-xs text-gray-500">{item.module_title}</p>

              {isOpen ? (
                <div className="mt-4 space-y-3">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-green-700">
                      Bonne réponse :
                    </p>
                    <p className="mt-1 text-sm font-medium text-green-900">{item.correct}</p>
                  </div>
                  {item.explanation && (
                    <p className="text-sm text-gray-600">{item.explanation}</p>
                  )}
                  <button
                    onClick={() => toggle(i)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-900"
                  >
                    <EyeOff className="h-4 w-4" strokeWidth={2} />
                    Cacher
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => toggle(i)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:border-gray-300"
                >
                  <Eye className="h-4 w-4" strokeWidth={2} />
                  Voir la réponse
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
