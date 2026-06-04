import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, X } from "lucide-react";

export default async function QuizResultPage({
  params,
  searchParams,
}: {
  params: { attemptId: string };
  searchParams: { from?: string };
}) {
  const supabase = createServerSupabaseClient();

  // Lien de retour (par défaut l'historique ; un gérant revient à la fiche employé)
  const from = searchParams?.from;
  const backHref =
    from && from.startsWith("/") && !from.startsWith("//") ? from : "/historique";

  // Tentative (RLS : l'employé ne voit que les siennes, le gérant voit tout)
  const { data: attempt } = await supabase
    .from("quiz_attempts")
    .select(
      "id, score, passed, created_at, quiz_id, quizzes(title, passing_score), employees(first_name, last_name)"
    )
    .eq("id", params.attemptId)
    .single();

  if (!attempt) notFound();

  // Questions du quiz avec leurs choix
  const { data: questions } = await supabase
    .from("quiz_questions")
    .select(
      "id, question_text, explanation, sort_order, quiz_choices(id, choice_text, is_correct, sort_order)"
    )
    .eq("quiz_id", (attempt as any).quiz_id)
    .order("sort_order");

  // Réponses données par l'employé pour cette tentative
  const { data: answers } = await supabase
    .from("quiz_answers")
    .select("question_id, choice_id, is_correct")
    .eq("attempt_id", params.attemptId);

  const answerByQ = new Map(
    (answers || []).map((a: any) => [a.question_id, a])
  );

  const sorted = [...(questions || [])].sort(
    (a: any, b: any) => a.sort_order - b.sort_order
  );

  const quizTitle = (attempt as any).quizzes?.title || "Quiz";
  const scorePct = Math.round(((attempt as any).score || 0) * 100);
  const passed = (attempt as any).passed;
  const correctCount = sorted.filter(
    (q: any) => answerByQ.get(q.id)?.is_correct
  ).length;
  const dateStr = new Date((attempt as any).created_at).toLocaleDateString(
    "fr-CA",
    { day: "numeric", month: "long", year: "numeric" }
  );
  const emp = (attempt as any).employees;
  const empName = emp ? `${emp.first_name} ${emp.last_name}` : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={backHref}
          className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <h1 className="text-2xl font-bold">{quizTitle}</h1>
        <p className="text-sm text-gray-500">
          {empName ? `${empName} · ` : ""}
          {dateStr}
        </p>
      </div>

      {/* Résumé du score */}
      <div
        className={`rounded-2xl p-6 text-center ${
          passed ? "bg-green-50" : "bg-red-50"
        }`}
      >
        <p
          className={`text-3xl font-bold ${
            passed ? "text-green-700" : "text-red-700"
          }`}
        >
          {scorePct}%
        </p>
        <p
          className={`mt-1 text-sm font-medium ${
            passed ? "text-green-600" : "text-red-600"
          }`}
        >
          {passed ? "Réussi" : "Échoué"} — {correctCount} bonne
          {correctCount > 1 ? "s" : ""} réponse{correctCount > 1 ? "s" : ""} sur{" "}
          {sorted.length}
        </p>
      </div>

      {/* Détail par question */}
      <div className="space-y-4">
        {sorted.map((q: any, i: number) => {
          const ans = answerByQ.get(q.id);
          const wasCorrect = ans?.is_correct === true;
          const choices = [...(q.quiz_choices || [])].sort(
            (a: any, b: any) => a.sort_order - b.sort_order
          );

          return (
            <div
              key={q.id}
              className="overflow-hidden rounded-2xl bg-white shadow-sm"
            >
              <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-4">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${
                    wasCorrect ? "bg-green-500" : "bg-red-400"
                  }`}
                >
                  {wasCorrect ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </span>
                <h3 className="pt-0.5 text-sm font-semibold text-gray-900">
                  <span className="text-gray-400">Q{i + 1}.</span>{" "}
                  {q.question_text}
                </h3>
              </div>

              <div className="space-y-2 px-5 py-4">
                {choices.map((ch: any) => {
                  const selected = ans?.choice_id === ch.id;
                  const correct = ch.is_correct;

                  let cls = "border-gray-100 bg-gray-50/50 text-gray-600";
                  if (correct) cls = "border-green-300 bg-green-50 text-green-800";
                  else if (selected && !correct)
                    cls = "border-red-300 bg-red-50 text-red-800";

                  return (
                    <div
                      key={ch.id}
                      className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${cls}`}
                    >
                      <span>{ch.choice_text}</span>
                      {correct && (
                        <span className="shrink-0 text-[10px] font-semibold uppercase text-green-600">
                          Bonne réponse
                        </span>
                      )}
                      {selected && !correct && (
                        <span className="shrink-0 text-[10px] font-semibold uppercase text-red-600">
                          Ta réponse
                        </span>
                      )}
                      {selected && correct && (
                        <span className="shrink-0 text-[10px] font-semibold uppercase text-green-600">
                          ✓ Ta réponse
                        </span>
                      )}
                    </div>
                  );
                })}

                {!ans && (
                  <p className="text-xs text-gray-400">Non répondue</p>
                )}

                {!wasCorrect && q.explanation && (
                  <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                      Explication
                    </p>
                    <p className="text-sm text-amber-800">{q.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
