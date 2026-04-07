"use client";

import { useState, useCallback, useMemo } from "react";

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

// ─── Composant principal ───────────────────────────────────────
export function QuizForm({
  quizId,
  quizTitle,
  passingScore = 0.7,
  questions,
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

  // ─── Démarrer le quiz ─────────────────────────────────────
  const startQuiz = useCallback(() => {
    setPhase("question");
    setCurrentIdx(0);
    setAnswers([]);
    setSelectedChoiceId(null);
    setResult(null);
    setError("");
  }, []);

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
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100">
            <svg className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">{quizTitle}</h2>
          <p className="mt-2 text-sm text-gray-500">
            {totalQuestions} question{totalQuestions > 1 ? "s" : ""} — Tu dois obtenir{" "}
            {Math.round(passingScore * 100)}% pour réussir.
          </p>
          <div className="mt-6 space-y-3 text-left">
            <InfoRow icon="check" text="Correction immédiate après chaque question" />
            <InfoRow icon="book" text="Explication fournie si la réponse est incorrecte" />
            <InfoRow icon="save" text="Résultats sauvegardés automatiquement" />
          </div>
          <button
            onClick={startQuiz}
            className="mt-8 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition-all hover:shadow-lg active:scale-[0.98]"
          >
            Commencer le quiz
          </button>
        </div>
      )}

      {/* ═══ QUESTION / CORRECTION ═══════════════════════════ */}
      {(phase === "question" || phase === "correction") && question && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {/* En-tête avec progression */}
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">
                Question {currentIdx + 1} sur {totalQuestions}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {correctSoFar}/{answers.length} correcte{correctSoFar > 1 ? "s" : ""}
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
                  containerStyle = "border-orange-400 bg-orange-50";
                  letterStyle = "bg-orange-500 text-white";
                } else {
                  containerStyle = "border-gray-200 hover:border-orange-200 hover:bg-orange-50/30";
                  letterStyle = "bg-gray-100 text-gray-600";
                }
              }

              return (
                <button
                  key={choice.id}
                  onClick={() => selectChoice(choice.id)}
                  disabled={inCorrection}
                  className={`flex w-full items-start gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition-all duration-200 ${containerStyle} disabled:cursor-default`}
                >
                  {/* Lettre (A, B, C, D) */}
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${letterStyle}`}
                  >
                    {inCorrection && isCorrectChoice ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : inCorrection && isSelected && !isCorrectChoice ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
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
                <div className="flex items-start gap-3 rounded-xl bg-green-50 p-4">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500">
                    <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-800">Bonne réponse !</p>
                    {question.explanation && (
                      <p className="mt-1 text-sm text-green-700">{question.explanation}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-400">
                    <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-800">
                      Mauvaise réponse — la bonne était{" "}
                      <span className="text-green-700">
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
                className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98] disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none"
              >
                Confirmer
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
              >
                {isLastQuestion ? "Voir mes résultats" : "Question suivante"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ═══ SUBMITTING ══════════════════════════════════════ */}
      {phase === "submitting" && (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-orange-500" />
          <p className="mt-4 text-sm text-gray-500">Sauvegarde des résultats...</p>
        </div>
      )}

      {/* ═══ RÉSULTATS ═══════════════════════════════════════ */}
      {phase === "results" && result && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {/* Score principal */}
          <div className={`px-8 py-10 text-center ${result.passed ? "bg-green-50" : "bg-red-50"}`}>
            <div
              className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
                result.passed ? "bg-green-500" : "bg-red-400"
              }`}
            >
              {result.passed ? (
                <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-2xl font-bold text-white">{result.score}%</span>
              )}
            </div>
            <h2 className={`mt-4 text-xl font-bold ${result.passed ? "text-green-800" : "text-red-800"}`}>
              {result.passed ? "Quiz réussi !" : "Quiz échoué"}
            </h2>
            <p className={`mt-1 text-sm ${result.passed ? "text-green-600" : "text-red-600"}`}>
              {result.correct} bonne{result.correct > 1 ? "s" : ""} réponse{result.correct > 1 ? "s" : ""} sur{" "}
              {result.total} — Score : {result.score}%
              {!result.passed && ` (minimum ${Math.round(passingScore * 100)}%)`}
            </p>
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
                    className={`flex items-start gap-3 rounded-xl border p-4 ${
                      wasCorrect
                        ? "border-green-200 bg-green-50/50"
                        : "border-red-200 bg-red-50/50"
                    }`}
                  >
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${
                        wasCorrect ? "bg-green-500" : "bg-red-400"
                      }`}
                    >
                      {wasCorrect ? (
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
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
            {!result.passed && (
              <button
                onClick={startQuiz}
                className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
              >
                Réessayer le quiz
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Petit composant info pour l'intro ─────────────────────────
function InfoRow({ icon, text }: { icon: "check" | "book" | "save"; text: string }) {
  const icons = {
    check: (
      <svg className="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    book: (
      <svg className="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    save: (
      <svg className="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
      </svg>
    ),
  };

  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-2.5">
      {icons[icon]}
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  );
}
