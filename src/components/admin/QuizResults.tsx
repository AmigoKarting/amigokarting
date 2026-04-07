"use client";
import type { QuizQuestionStats } from "@/types/quiz";

export function QuizResults({ stats }: { stats: QuizQuestionStats[] }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
            <th className="px-4 py-3">Question</th>
            <th className="px-4 py-3">Quiz</th>
            <th className="px-4 py-3">Réponses</th>
            <th className="px-4 py-3">Taux de réussite</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => (
            <tr key={s.question_id} className="border-b last:border-0">
              <td className="max-w-xs truncate px-4 py-3">{s.question_text}</td>
              <td className="px-4 py-3 text-gray-500">{s.quiz_title}</td>
              <td className="px-4 py-3">{s.correct_answers}/{s.total_answers}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  s.success_rate >= 0.7
                    ? "bg-green-100 text-green-700"
                    : s.success_rate >= 0.4
                    ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700"
                }`}>
                  {Math.round(s.success_rate * 100)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {stats.length === 0 && (
        <p className="p-6 text-center text-sm text-gray-400">Aucune donnée de quiz disponible</p>
      )}
    </div>
  );
}
