"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  CheckCircle2, Check, X, Flame, Timer, BookOpen, Save, Trophy,
  Star, ThumbsUp, RotateCcw, type LucideIcon,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────
interface QuizChoice {
  id: string;
  choice_text: string;
  is_correct: boolean;
  sort_order: number;
}

interface QuizQuestion {
  id: string;
  question_text: string;
  explanation: string | null;
  sort_order: number;
  choices: QuizChoice[];
}

interface QuizFormProps {
  quizId: string;
  quizTitle: string;
  passingScore?: number;         // 0.0 à 1.0, défaut 0.7
  questions: QuizQuestion[];
  employeeId?: string;           // Pour sauvegarder la progression par employé
  onComplete?: (result: QuizResult) => void;
}

interface AnswerRecord {
  questionId: string;
  choiceId: string;
  isCorrect: boolean;
}

interface QuizResult {
  score: number;                 // Pourcentage (0-100)
  passed: boolean;
  total: number;
  correct: number;
  answers: AnswerRecord[];
}

type QuizPhase = "intro" | "question" | "correction" | "submitting" | "results";

const CHOICE_LETTERS = ["A", "B", "C", "D", "E", "F"] as const;

// Messages d'encouragement (sobres)
const PRAISE = ["Exactement.", "Bien vu.", "C'est ça.", "Parfait.", "En plein dans le mille.", "Nickel.", "Tu gères."];
const WRONG_MSG = ["Pas grave, tu vas l'avoir.", "Presque ! Continue.", "C'est en se trompant qu'on apprend.", "Pas cette fois, mais lâche pas."];
const pickMsg = (arr: string[], i: number) => arr[i % arr.length];
const fmtTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

// ─── Composant principal ───────────────────────────────────────
export function QuizForm({
  quizId,
  quizTitle,
  passingScore = 0.7,
  questions,
  employeeId,
  onComplete,
}: QuizFormProps) {
  const sortedQuestions = useMemo(
    () => [...questions].sort((a, b) => a.sort_order - b.sort_order),
    [questions]
  );

  const [phase, setPhase] = useState<QuizPhase>("intro");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState("");
  const [savedAnswers, setSavedAnswers] = useState<AnswerRecord[] | null>(null);

  // Mode chrono (optionnel)
  const [chrono, setChrono] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startMsRef = useRef<number | null>(null);

  // Clé de sauvegarde de la progression (par employé + quiz)
  const storageKey = `quiz-progress:${employeeId || "anon"}:${quizId}`;
  const bestTimeKey = `quiz-best-time:${employeeId || "anon"}:${quizId}`;

  const question = sortedQuestions[currentIdx];
  const totalQuestions = sortedQuestions.length;
  const isLastQuestion = currentIdx === totalQuestions - 1;

  // Mélanger les choix une fois par question (pour éviter le pattern A=bonne réponse)
  const shuffledChoices = useMemo(() => {
    if (!question) return [];
    return [...question.choices].sort((a, b) => a.sort_order - b.sort_order);
  }, [question]);

  // Résultat de la correction de la question courante
  const selectedChoice = shuffledChoices.find((c) => c.id === selectedChoiceId);
  const correctChoice = shuffledChoices.find((c) => c.is_correct);
  const isCorrectAnswer = selectedChoice?.is_correct === true;

  // Score courant (pendant le quiz)
  const correctSoFar = answers.filter((a) => a.isCorrect).length;

  // ─── Gamification : série, meilleure série, points ─────────
  const currentStreak = useMemo(() => {
    let n = 0;
    for (let i = answers.length - 1; i >= 0; i--) {
      if (answers[i].isCorrect) n++;
      else break;
    }
    return n;
  }, [answers]);
  const bestStreak = useMemo(() => {
    let best = 0, run = 0;
    for (const a of answers) {
      run = a.isCorrect ? run + 1 : 0;
      best = Math.max(best, run);
    }
    return best;
  }, [answers]);
  const points = correctSoFar * 10;

  // Palier de résultat (message + célébration selon le score)
  const tier = useMemo<{ Icon: LucideIcon; title: string; sub: string; celebrate: boolean } | null>(() => {
    if (!result) return null;
    if (result.correct === result.total)
      return { Icon: Trophy, title: "Parfait, sans faute !", sub: "Tu maîtrises parfaitement le sujet", celebrate: true };
    if (result.score >= 90)
      return { Icon: Star, title: "Excellent !", sub: "Presque parfait, bravo", celebrate: true };
    if (result.passed)
      return { Icon: ThumbsUp, title: "Réussi, bravo !", sub: "Tu maîtrises le sujet", celebrate: true };
    return { Icon: RotateCcw, title: "Pas loin !", sub: "Réessaie, tu vas l'avoir", celebrate: false };
  }, [result]);

  // ─── Charger la progression sauvegardée (au montage) ──────
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const data = JSON.parse(raw);
        if (
          Array.isArray(data?.answers) &&
          data.answers.length > 0 &&
          data.total === totalQuestions
        ) {
          setSavedAnswers(data.answers as AnswerRecord[]);
        }
      }
    } catch {
      /* ignore */
    }
  }, [storageKey, totalQuestions]);

  // ─── Sauvegarder la progression à chaque réponse ──────────
  useEffect(() => {
    if (phase === "question" || phase === "correction") {
      try {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({ answers, total: totalQuestions })
        );
      } catch {
        /* ignore */
      }
    }
  }, [answers, phase, storageKey, totalQuestions]);

  // ─── Effacer la progression une fois le quiz terminé ──────
  useEffect(() => {
    if (phase === "results") {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        /* ignore */
      }
    }
  }, [phase, storageKey]);

  // ─── Chrono : tick chaque seconde ─────────────────────────
  const [bestTime, setBestTime] = useState<number | null>(null);
  useEffect(() => {
    if (!chrono || (phase !== "question" && phase !== "correction")) return;
    const t = setInterval(() => {
      if (startMsRef.current) setElapsed(Math.floor((Date.now() - startMsRef.current) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [chrono, phase]);

  // ─── Chrono : meilleur temps personnel à la fin ───────────
  useEffect(() => {
    if (phase === "results" && chrono) {
      try {
        const prev = parseInt(window.localStorage.getItem(bestTimeKey) || "0", 10);
        setBestTime(prev > 0 ? prev : null);
        if (!prev || elapsed < prev) window.localStorage.setItem(bestTimeKey, String(elapsed));
      } catch {
        /* ignore */
      }
    }
  }, [phase, chrono, bestTimeKey]);

  // ─── Démarrer le quiz (à zéro) ────────────────────────────
  const startQuiz = useCallback(() => {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    setSavedAnswers(null);
    startMsRef.current = Date.now();
    setElapsed(0);
    setPhase("question");
    setCurrentIdx(0);
    setAnswers([]);
    setSelectedChoiceId(null);
    setResult(null);
    setError("");
  }, [storageKey]);

  // ─── Reprendre où on s'était arrêté ───────────────────────
  const resumeQuiz = useCallback(() => {
    if (!savedAnswers) return;
    startMsRef.current = Date.now();
    setElapsed(0);
    const resumeIdx = Math.min(savedAnswers.length, totalQuestions - 1);
    setAnswers(savedAnswers.slice(0, resumeIdx));
    setCurrentIdx(resumeIdx);
    setSelectedChoiceId(null);
    setResult(null);
    setError("");
    setPhase("question");
  }, [savedAnswers, totalQuestions]);

  // ─── Sélectionner un choix ────────────────────────────────
  const selectChoice = useCallback(
    (choiceId: string) => {
      if (phase !== "question") return;
      setSelectedChoiceId(choiceId);
    },
    [phase]
  );

  // ─── Confirmer la réponse → afficher correction ───────────
  const confirmAnswer = useCallback(() => {
    if (!selectedChoiceId || !question) return;

    const choice = shuffledChoices.find((c) => c.id === selectedChoiceId);
    const record: AnswerRecord = {
      questionId: question.id,
      choiceId: selectedChoiceId,
      isCorrect: choice?.is_correct === true,
    };

    setAnswers((prev) => [...prev, record]);
    setPhase("correction");
  }, [selectedChoiceId, question, shuffledChoices]);

  // ─── Passer à la question suivante ou soumettre ───────────
  const nextStep = useCallback(async () => {
    if (isLastQuestion) {
      // Soumettre le quiz
      setPhase("submitting");
      setError("");

      try {
        const allAnswers = answers;
        // La dernière réponse est déjà dans answers (ajoutée dans confirmAnswer)

        const res = await fetch("/api/training/quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quizId,
            answers: allAnswers.map((a) => ({
              questionId: a.questionId,
              choiceId: a.choiceId,
            })),
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Erreur serveur");
        }

        const data = await res.json();
        const quizResult: QuizResult = {
          score: data.score,
          passed: data.passed,
          total: data.total,
          correct: data.correct,
          answers: allAnswers,
        };

        setResult(quizResult);
        setPhase("results");
        onComplete?.(quizResult);
      } catch (err: any) {
        console.error("Erreur soumission quiz:", err);
        setError(err.message || "Impossible de sauvegarder les résultats.");
        setPhase("correction"); // Permettre de réessayer
      }
    } else {
      // Question suivante
      setCurrentIdx((i) => i + 1);
      setSelectedChoiceId(null);
      setPhase("question");
    }
  }, [isLastQuestion, answers, quizId, onComplete]);

  // ─── Rendu ────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl">
      {/* ═══ INTRO ═══════════════════════════════════════════ */}
      {phase === "intro" && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-orange-50 text-brand-600">
            <CheckCircle2 className="h-7 w-7" strokeWidth={2} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">{quizTitle}</h2>
          <p className="mt-2 text-sm text-gray-500">
            {totalQuestions} question{totalQuestions > 1 ? "s" : ""} — Tu dois obtenir{" "}
            {Math.round(passingScore * 100)}% pour réussir.
          </p>
          <div className="mt-6 space-y-3 text-left">
            <InfoRow icon="check" text="Correction immédiate après chaque question" />
            <InfoRow icon="book" text="Explication fournie si la réponse est incorrecte" />
            <InfoRow icon="save" text="Ta progression est gardée — tu peux arrêter et revenir plus tard" />
          </div>

          <button
            onClick={() => setChrono((c) => !c)}
            className={`mt-4 flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium transition ${chrono ? "border-brand-400 bg-orange-50 text-brand-700" : "border-gray-200 text-gray-500"}`}
          >
            <span className="flex items-center gap-2">
              <Timer className="h-4 w-4" strokeWidth={2} />
              Mode chrono {chrono ? "(activé)" : "— bats ton record"}
            </span>
            <span className={`flex h-5 w-9 items-center rounded-full p-0.5 transition ${chrono ? "bg-brand-600" : "bg-gray-300"}`}>
              <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${chrono ? "translate-x-4" : ""}`} />
            </span>
          </button>

          {savedAnswers ? (
            <div className="mt-8 space-y-3">
              <button
                onClick={resumeQuiz}
                className="w-full rounded-lg bg-brand-600 px-6 py-3.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700"
              >
                Reprendre où tu étais ({Math.min(savedAnswers.length, totalQuestions) + 1}/{totalQuestions})
              </button>
              <button
                onClick={startQuiz}
                className="w-full rounded-lg border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Recommencer à zéro
              </button>
            </div>
          ) : (
            <button
              onClick={startQuiz}
              className="mt-8 w-full rounded-lg bg-brand-600 px-6 py-3.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700"
            >
              Commencer le quiz
            </button>
          )}
        </div>
      )}

      {/* ═══ QUESTION / CORRECTION ═══════════════════════════ */}
      {(phase === "question" || phase === "correction") && question && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* En-tête avec progression */}
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">
                Question {currentIdx + 1} sur {totalQuestions}
              </span>
              <div className="flex items-center gap-2">
                {chrono && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    <Timer className="h-3.5 w-3.5" strokeWidth={2} /> {fmtTime(elapsed)}
                  </span>
                )}
                {currentStreak >= 2 && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                    <Flame className="h-3.5 w-3.5" strokeWidth={2} /> {currentStreak} de suite
                  </span>
                )}
                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {points} pts
                </span>
              </div>
            </div>
            {/* Barre de progression avec pastilles */}
            <div className="flex gap-1.5">
              {sortedQuestions.map((_, i) => {
                let color = "bg-gray-200"; // pas encore répondu
                if (i < answers.length) {
                  color = answers[i].isCorrect
                    ? "bg-green-400"        // correct
                    : "bg-red-400";         // incorrect
                } else if (i === currentIdx) {
                  color = "bg-orange-400";  // question courante
                }
                return (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded-full transition-colors duration-300 ${color}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Question */}
          <div className="px-6 pt-6 pb-2">
            <h3 className="text-lg font-semibold leading-snug text-gray-900">
              {question.question_text}
            </h3>
          </div>

          {/* Choix de réponse */}
          <div className="space-y-3 px-6 py-4">
            {shuffledChoices.map((choice, i) => {
              const letter = CHOICE_LETTERS[i] || String(i + 1);
              const isSelected = selectedChoiceId === choice.id;
              const isCorrectChoice = choice.is_correct;
              const inCorrection = phase === "correction";

              // Déterminer le style du choix
              let containerStyle = "";
              let letterStyle = "";

              if (inCorrection) {
                if (isCorrectChoice) {
                  // Toujours montrer la bonne réponse en vert
                  containerStyle = "border-green-400 bg-green-50";
                  letterStyle = "bg-green-500 text-white";
                } else if (isSelected && !isCorrectChoice) {
                  // Mauvais choix sélectionné en rouge
                  containerStyle = "border-red-300 bg-red-50";
                  letterStyle = "bg-red-400 text-white";
                } else {
                  // Choix non sélectionné et incorrect — grisé
                  containerStyle = "border-gray-100 bg-gray-50/50 opacity-50";
                  letterStyle = "bg-gray-200 text-gray-400";
                }
              } else {
                if (isSelected) {
                  containerStyle = "border-brand-400 bg-orange-50";
                  letterStyle = "bg-brand-600 text-white";
                } else {
                  containerStyle = "border-gray-200 hover:border-gray-300 hover:bg-gray-50";
                  letterStyle = "bg-gray-100 text-gray-600";
                }
              }

              return (
                <button
                  key={choice.id}
                  onClick={() => selectChoice(choice.id)}
                  disabled={inCorrection}
                  className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3.5 text-left transition ${containerStyle} disabled:cursor-default`}
                >
                  {/* Lettre (A, B, C, D) */}
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${letterStyle}`}
                  >
                    {inCorrection && isCorrectChoice ? (
                      <Check className="h-4 w-4" strokeWidth={3} />
                    ) : inCorrection && isSelected && !isCorrectChoice ? (
                      <X className="h-4 w-4" strokeWidth={3} />
                    ) : (
                      letter
                    )}
                  </span>
                  {/* Texte du choix */}
                  <span className="pt-0.5 text-sm text-gray-800">{choice.choice_text}</span>
                </button>
              );
            })}
          </div>

          {/* Feedback après correction */}
          {phase === "correction" && (
            <div className="px-6 pb-2">
              {isCorrectAnswer ? (
                <div className="flex items-start gap-3 rounded-lg bg-green-50 p-4">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-600">
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-800">
                      {pickMsg(PRAISE, currentIdx)}
                      {currentStreak >= 3 && (
                        <span className="ml-1 inline-flex items-center gap-1 align-middle text-brand-600">
                          <Flame className="h-3.5 w-3.5" strokeWidth={2} /> {currentStreak} de suite
                        </span>
                      )}
                    </p>
                    {question.explanation && (
                      <p className="mt-1 text-sm text-green-700">{question.explanation}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500">
                    <X className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-800">
                      {pickMsg(WRONG_MSG, currentIdx)}
                    </p>
                    <p className="mt-0.5 text-sm text-red-700">
                      La bonne réponse :{" "}
                      <span className="font-medium text-green-700">
                        « {correctChoice?.choice_text} »
                      </span>
                    </p>
                    {question.explanation && (
                      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                          Explication
                        </p>
                        <p className="text-sm text-amber-800">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Erreur de soumission */}
          {error && (
            <div className="mx-6 mb-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Bouton d'action */}
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
            <span className="text-xs text-gray-400">
              {phase === "correction"
                ? isCorrectAnswer
                  ? "Bien joué !"
                  : "Cette question te sera reposée plus tard."
                : "Sélectionne ta réponse"}
            </span>
            {phase === "question" ? (
              <button
                onClick={confirmAnswer}
                disabled={!selectedChoiceId}
                className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:bg-gray-300"
              >
                Confirmer
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700"
              >
                {isLastQuestion ? "Voir mes résultats" : "Question suivante"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ═══ SUBMITTING ══════════════════════════════════════ */}
      {phase === "submitting" && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-brand-600" />
          <p className="mt-4 text-sm text-gray-500">Sauvegarde des résultats...</p>
        </div>
      )}

      {/* ═══ RÉSULTATS ═══════════════════════════════════════ */}
      {phase === "results" && result && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* Score principal */}
          <div className="relative overflow-hidden border-b border-gray-100 px-8 py-10 text-center">
            {tier?.celebrate && <Confetti />}
            <div className={`relative mx-auto flex h-16 w-16 items-center justify-center rounded-lg ${result.passed ? "bg-green-50 text-green-600" : "bg-orange-50 text-brand-600"}`}>
              {tier && <tier.Icon className="h-8 w-8" strokeWidth={2} />}
            </div>
            <h2 className="relative mt-4 text-2xl font-semibold tracking-tight text-gray-900">
              {tier?.title}
            </h2>
            <p className="relative mt-1 text-sm text-gray-500">
              {tier?.sub}
            </p>
            <div className="relative mt-4 inline-flex items-center gap-3 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700">
              <span>{result.score}%</span>
              <span className="text-gray-300">·</span>
              <span>{result.correct}/{result.total} bonnes</span>
              {bestStreak >= 3 && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="inline-flex items-center gap-1 text-brand-600">
                    <Flame className="h-3.5 w-3.5" strokeWidth={2} /> {bestStreak} de suite
                  </span>
                </>
              )}
            </div>
            {chrono && (
              <p className="relative mt-2 inline-flex items-center justify-center gap-1 text-xs font-medium text-gray-500">
                <Timer className="h-3.5 w-3.5" strokeWidth={2} /> {fmtTime(elapsed)}
                {bestTime == null ? "" : elapsed < bestTime ? " · Nouveau record !" : ` · ton record : ${fmtTime(bestTime)}`}
              </p>
            )}
            {!result.passed && (
              <p className="relative mt-2 text-xs text-gray-500">Minimum {Math.round(passingScore * 100)}% pour réussir</p>
            )}
          </div>

          {/* Résumé par question */}
          <div className="px-6 py-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-700">Résumé par question</h3>
            <div className="space-y-3">
              {sortedQuestions.map((q, i) => {
                const answer = result.answers.find((a) => a.questionId === q.id);
                const wasCorrect = answer?.isCorrect ?? false;
                return (
                  <div
                    key={q.id}
                    className={`flex items-start gap-3 rounded-lg border p-4 ${
                      wasCorrect
                        ? "border-green-200 bg-green-50/50"
                        : "border-red-200 bg-red-50/50"
                    }`}
                  >
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${
                        wasCorrect ? "bg-green-600" : "bg-red-500"
                      }`}
                    >
                      {wasCorrect ? (
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      ) : (
                        <X className="h-3.5 w-3.5" strokeWidth={3} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        <span className="text-gray-400">Q{i + 1}.</span>{" "}
                        {q.question_text}
                      </p>
                      {!wasCorrect && q.explanation && (
                        <p className="mt-1.5 text-xs text-amber-700">
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
            <p className="text-xs text-gray-400">
              Résultats sauvegardés dans ton dossier
            </p>
            <button
              onClick={startQuiz}
              className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700"
            >
              {result.passed ? "Refaire pour battre ton score" : "Réessayer le quiz"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Effet festif (burst d'emojis) ─────────────────────────────
function Confetti() {
  const items = ["🎉", "🎊", "⭐", "🔥", "🏆", "✨", "🎉", "⭐", "💥"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {items.map((e, i) => (
        <span
          key={i}
          className="absolute animate-bounce text-xl"
          style={{
            left: `${(i * 11 + 5) % 96}%`,
            top: `${(i % 3) * 22 + 2}%`,
            animationDelay: `${(i % 4) * 0.15}s`,
            animationDuration: `${1 + (i % 3) * 0.3}s`,
          }}
        >
          {e}
        </span>
      ))}
    </div>
  );
}

// ─── Petit composant info pour l'intro ─────────────────────────
function InfoRow({ icon, text }: { icon: "check" | "book" | "save"; text: string }) {
  const icons = {
    check: <CheckCircle2 className="h-4 w-4 text-brand-600" strokeWidth={2} />,
    book: <BookOpen className="h-4 w-4 text-brand-600" strokeWidth={2} />,
    save: <Save className="h-4 w-4 text-brand-600" strokeWidth={2} />,
  };

  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-2.5">
      {icons[icon]}
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  );
}
