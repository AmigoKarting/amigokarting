"use client";

import { useState, useEffect } from "react";

interface ProgressData {
  level: { name: string; icon: string; color: string; score: number; nextLevel: string; pointsNeeded: number };
  topics: { name: string; icon: string; mastered: number; total: number; percent: number }[];
  reviewCards: { id: string; question: string; dueIn: string; overdue: boolean }[];
  stats: { totalQuestions: number; correctRate: number; streak: number; lastActive: string };
}

interface GamStats {
  points: number;
  rank: number;
  total_players: number;
  quizzes_total: number;
  quizzes_passed: number;
  perfect_count: number;
  attempts: number;
  finals_passed: number;
  daily_streak: number;
  by_category: Record<string, { total: number; passed: number }>;
  leaderboard: { name: string; points: number; rank: number; is_me: boolean }[];
}

const LEVEL_LABELS = ["Recrue", "Apprenti", "Régulier", "Pro", "Vétéran", "Expert", "Maître", "Légende"];
const PTS_PER_LEVEL = 150;

function levelFromPoints(p: number) {
  const level = Math.floor(p / PTS_PER_LEVEL) + 1;
  return {
    level,
    label: LEVEL_LABELS[Math.min(level - 1, LEVEL_LABELS.length - 1)],
    pct: Math.round(((p % PTS_PER_LEVEL) / PTS_PER_LEVEL) * 100),
    toNext: PTS_PER_LEVEL - (p % PTS_PER_LEVEL),
  };
}

function medal(rank: number): string {
  return rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
}

function computeBadges(g: GamStats) {
  const cat = g.by_category || {};
  const catDone = (n: string) => !!cat[n] && cat[n].total > 0 && cat[n].passed >= cat[n].total;
  return [
    { icon: "🎬", label: "Premiers pas", desc: "1er quiz complété", earned: g.attempts >= 1 },
    { icon: "✋", label: "Sur la lancée", desc: "5 quiz réussis", earned: g.quizzes_passed >= 5 },
    { icon: "🎯", label: "Sans faute", desc: "1 quiz parfait", earned: g.perfect_count >= 1 },
    { icon: "🌟", label: "Perfectionniste", desc: "5 quiz parfaits", earned: g.perfect_count >= 5 },
    { icon: "💰", label: "Expert Caisse", desc: "Tous les quiz Caisse", earned: catDone("Caisse - Amigo Karting") },
    { icon: "🏁", label: "Expert Piste", desc: "Tous les quiz Piste", earned: catDone("Piste") },
    { icon: "🤝", label: "Expert Sup.", desc: "Tous les quiz Superviseur", earned: catDone("Superviseur du service à la clientèle") },
    { icon: "🎓", label: "Certifié", desc: "Un examen final réussi", earned: g.finals_passed >= 1 },
    { icon: "🔥", label: "Assidu", desc: "3 jours d'affilée", earned: g.daily_streak >= 3 },
    { icon: "⚡", label: "Inarrêtable", desc: "7 jours d'affilée", earned: g.daily_streak >= 7 },
    { icon: "🏆", label: "Tout réussi", desc: "Tous les quiz réussis", earned: g.quizzes_total > 0 && g.quizzes_passed >= g.quizzes_total },
    { icon: "🤖", label: "Machine", desc: "1000 points", earned: g.points >= 1000 },
  ];
}

export default function ProgressionPage() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [gam, setGam] = useState<GamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewMode, setReviewMode] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewAnswer, setReviewAnswer] = useState("");

  useEffect(() => { loadProgress(); }, []);

  async function loadProgress() {
    try {
      const [res, resGam] = await Promise.all([
        fetch("/api/training/progression"),
        fetch("/api/training/stats"),
      ]);
      const d = await res.json();
      setData(d);
      try {
        const g = await resGam.json();
        if (g && typeof g.points === "number") setGam(g);
      } catch {}
    } catch {}
    setLoading(false);
  }

  async function submitReview(correct: boolean) {
    if (!data) return;
    const card = data.reviewCards[currentCard];
    try {
      await fetch("/api/training/progression", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "review", cardId: card.id, correct }),
      });
    } catch {}

    setShowAnswer(false);
    setReviewAnswer("");
    if (currentCard < data.reviewCards.length - 1) {
      setCurrentCard((prev) => prev + 1);
    } else {
      setReviewMode(false);
      loadProgress();
    }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
    </div>
  );

  if (!data) return <p className="text-center text-gray-500">Erreur de chargement</p>;

  const { level, topics, reviewCards, stats } = data;
  const dueCards = reviewCards.filter((c) => c.overdue);

  // ─── Mode révision ────────────────────────────────────
  if (reviewMode && reviewCards.length > 0) {
    const card = reviewCards[currentCard];
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setReviewMode(false)} className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Retour
          </button>
          <span className="text-xs text-gray-400">{currentCard + 1} / {reviewCards.length}</span>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-center text-xs font-semibold text-orange-600 mb-4">QUESTION À REVOIR</p>
          <p className="text-center text-base font-medium text-gray-900">{card.question}</p>

          {!showAnswer ? (
            <div className="mt-6 space-y-3">
              <textarea value={reviewAnswer} onChange={(e) => setReviewAnswer(e.target.value)}
                placeholder="Tape ta réponse..."
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100" rows={3} />
              <button onClick={() => setShowAnswer(true)}
                className="w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white active:scale-[0.98]">
                Voir la réponse
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl bg-green-50 p-4">
                <p className="text-xs font-semibold text-green-700 mb-1">Bonne réponse :</p>
                <p className="text-sm text-green-800">{(card as any).correct_answer || "Vérifie dans le manuel."}</p>
              </div>
              <p className="text-center text-sm text-gray-600">Tu avais la bonne réponse ?</p>
              <div className="flex gap-3">
                <button onClick={() => submitReview(false)}
                  className="flex-1 rounded-xl border-2 border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-700 active:scale-[0.98]">
                  Non, à revoir
                </button>
                <button onClick={() => submitReview(true)}
                  className="flex-1 rounded-xl bg-green-500 py-3 text-sm font-semibold text-white active:scale-[0.98]">
                  Oui, je savais !
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Barre de progression */}
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${((currentCard + 1) / reviewCards.length) * 100}%` }} />
        </div>
      </div>
    );
  }

  // ─── Page principale ──────────────────────────────────
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Ma progression</h1>

      {/* Niveau actuel */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="text-5xl">{level.icon}</div>
          <div>
            <p className="text-xs text-gray-400">Niveau actuel</p>
            <p className="text-2xl font-bold" style={{ color: level.color }}>{level.name}</p>
            <p className="mt-1 text-sm text-gray-300">Score : {level.score}/100</p>
          </div>
        </div>
        {level.pointsNeeded > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Prochain : {level.nextLevel}</span>
              <span>{level.pointsNeeded} points restants</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-700">
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (level.score / (level.score + level.pointsNeeded)) * 100)}%`, background: level.color }} />
            </div>
          </div>
        )}
      </div>

      {/* ─── Gamification : points, rang, niveau ─── */}
      {gam && (() => {
        const lvl = levelFromPoints(gam.points);
        return (
          <>
            <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-5 text-white shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-orange-100">Mes points</p>
                  <p className="text-3xl font-extrabold leading-tight">
                    {gam.points}<span className="ml-1 text-base font-semibold">pts</span>
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-orange-100">Niveau {lvl.level} · {lvl.label}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-orange-100">Classement</p>
                  <p className="text-2xl font-extrabold leading-tight">
                    #{gam.rank || "—"}<span className="text-sm font-medium">/{gam.total_players}</span>
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-[11px] text-orange-100">
                  <span>Niveau {lvl.level}</span>
                  <span>{lvl.toNext} pts → niveau {lvl.level + 1}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-orange-400/40">
                  <div className="h-full rounded-full bg-white transition-all" style={{ width: `${lvl.pct}%` }} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
              <span className="text-3xl">{gam.daily_streak > 0 ? "🔥" : "🎯"}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {gam.daily_streak > 0 ? `${gam.daily_streak} jour${gam.daily_streak > 1 ? "s" : ""} d'affilée !` : "Défi du jour"}
                </p>
                <p className="text-xs text-gray-500">
                  {gam.daily_streak > 0 ? "Reviens demain pour garder ta série 🔥" : "Fais un quiz aujourd'hui pour lancer ta série"}
                </p>
              </div>
              <a href="/training" className="shrink-0 rounded-full bg-orange-500 px-3.5 py-1.5 text-xs font-semibold text-white active:scale-95">
                Jouer
              </a>
            </div>
          </>
        );
      })()}

      {/* Cartes à revoir */}
      {dueCards.length > 0 && (
        <button onClick={() => { setReviewMode(true); setCurrentCard(0); setShowAnswer(false); }}
          className="w-full rounded-xl bg-orange-50 border-2 border-orange-200 p-4 text-left active:scale-[0.99]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔄</span>
              <div>
                <p className="text-sm font-semibold text-orange-900">{dueCards.length} question{dueCards.length > 1 ? "s" : ""} à revoir</p>
                <p className="text-xs text-orange-600">Révision espacée — ça prend 2 minutes</p>
              </div>
            </div>
            <svg className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </div>
        </button>
      )}

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-white p-3 text-center shadow-sm">
          <p className="text-xl font-bold text-green-600">{stats.correctRate}%</p>
          <p className="text-[10px] text-gray-400">Bonnes rép.</p>
        </div>
        <div className="rounded-xl bg-white p-3 text-center shadow-sm">
          <p className="text-xl font-bold text-orange-600">{stats.totalQuestions}</p>
          <p className="text-[10px] text-gray-400">Questions</p>
        </div>
        <div className="rounded-xl bg-white p-3 text-center shadow-sm">
          <p className="text-xl font-bold text-blue-600">{stats.streak}j</p>
          <p className="text-[10px] text-gray-400">Série active</p>
        </div>
      </div>

      {/* Progression par sujet */}
      <div>
        <p className="mb-3 text-sm font-semibold text-gray-700">Progression par sujet</p>
        <div className="space-y-2">
          {topics.map((topic) => (
            <div key={topic.name} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span>{topic.icon}</span>
                  <span className="text-sm font-medium text-gray-900">{topic.name}</span>
                </div>
                <span className={`text-xs font-semibold ${topic.percent >= 80 ? "text-green-600" : topic.percent >= 50 ? "text-orange-600" : "text-red-500"}`}>
                  {topic.percent}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full transition-all" style={{
                  width: `${topic.percent}%`,
                  background: topic.percent >= 80 ? "#22C55E" : topic.percent >= 50 ? "#F59E0B" : "#EF4444",
                }} />
              </div>
              <p className="mt-1 text-[10px] text-gray-400">{topic.mastered}/{topic.total} maîtrisé{topic.mastered > 1 ? "s" : ""}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Badges ─── */}
      {gam && (() => {
        const badges = computeBadges(gam);
        const earned = badges.filter((b) => b.earned).length;
        return (
          <div>
            <p className="mb-3 text-sm font-semibold text-gray-700">
              Badges <span className="font-normal text-gray-400">({earned}/{badges.length})</span>
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {badges.map((b) => (
                <div key={b.label} className={`rounded-xl p-3 text-center ${b.earned ? "bg-white shadow-sm" : "bg-gray-100"}`}>
                  <div className={`text-2xl ${b.earned ? "" : "opacity-40 grayscale"}`}>{b.earned ? b.icon : "🔒"}</div>
                  <p className={`mt-1 text-[11px] font-semibold leading-tight ${b.earned ? "text-gray-800" : "text-gray-400"}`}>{b.label}</p>
                  <p className="mt-0.5 text-[9px] leading-tight text-gray-400">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ─── Classement ─── */}
      {gam && gam.leaderboard && gam.leaderboard.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-semibold text-gray-700">Classement</p>
          <div className="divide-y divide-gray-50 overflow-hidden rounded-2xl bg-white shadow-sm">
            {gam.leaderboard.map((p, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 ${p.is_me ? "bg-orange-50" : ""}`}>
                <span className="w-7 text-center text-sm font-bold text-gray-500">{medal(p.rank)}</span>
                <span className="flex-1 text-sm font-medium text-gray-900">
                  {p.name}
                  {p.is_me && <span className="ml-1 text-xs font-semibold text-orange-600">(toi)</span>}
                </span>
                <span className="text-sm font-bold text-gray-700">{p.points} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dernière activité */}
      {stats.lastActive && (
        <p className="text-center text-xs text-gray-400">Dernière activité : {stats.lastActive}</p>
      )}
    </div>
  );
}
