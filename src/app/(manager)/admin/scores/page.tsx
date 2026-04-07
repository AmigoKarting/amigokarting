import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ScoresPage() {
  const supabase = createServerSupabaseClient();

  const { data: scores } = await supabase
    .from("employee_global_score")
    .select("*")
    .order("global_score", { ascending: false });

  function getScoreColor(score: number): string {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-orange-600";
    if (score >= 40) return "text-amber-600";
    return "text-red-600";
  }

  function getScoreBg(score: number): string {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-orange-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-red-500";
  }

  function getScoreLabel(score: number): string {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Bon";
    if (score >= 40) return "À améliorer";
    return "Critique";
  }

  function formatDate(d: string | null): string {
    if (!d) return "Jamais";
    const date = new Date(d);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return "Hier";
    if (diff < 7) return `Il y a ${diff} jours`;
    return date.toLocaleDateString("fr-CA");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notes globales</h1>
        <p className="text-sm text-gray-500">Performance de chaque employé — Formation 40% + Quiz 30% + Conversations 20% + Q&A 10%</p>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-3">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" /> 80-100 Excellent
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500" /> 60-79 Bon
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> 40-59 À améliorer
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> 0-39 Critique
        </span>
      </div>

      {/* Tableau des scores */}
      <div className="rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-3">Employé</th>
                <th className="px-4 py-3 text-center">Score global</th>
                <th className="px-4 py-3 text-center">Formation</th>
                <th className="px-4 py-3 text-center">Quiz</th>
                <th className="px-4 py-3 text-center">Conversations</th>
                <th className="px-4 py-3 text-center">Q&A</th>
                <th className="px-4 py-3">Dernière activité</th>
              </tr>
            </thead>
            <tbody>
              {scores?.map((s: any) => (
                <tr key={s.employee_id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <Link href={`/admin/employees/${s.employee_id}`} className="font-medium text-orange-600 hover:underline">
                      {s.first_name} {s.last_name}
                    </Link>
                    <p className="text-xs text-gray-400">
                      {s.role === "patron" ? "👑 Patron" : s.role === "manager" ? "Gérant" : "Employé"}
                    </p>
                  </td>

                  {/* Score global */}
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className={`text-2xl font-bold ${getScoreColor(s.global_score || 0)}`}>
                        {Math.round(s.global_score || 0)}
                      </span>
                      <div className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-gray-200">
                        <div className={`h-full rounded-full ${getScoreBg(s.global_score || 0)}`} style={{ width: `${s.global_score || 0}%` }} />
                      </div>
                      <span className={`mt-1 text-[10px] font-medium ${getScoreColor(s.global_score || 0)}`}>
                        {getScoreLabel(s.global_score || 0)}
                      </span>
                    </div>
                  </td>

                  {/* Formation */}
                  <td className="px-4 py-4 text-center">
                    <p className="font-medium">{s.formation_pct || 0}%</p>
                    <p className="text-xs text-gray-400">{s.completed_videos}/{s.total_videos} vidéos</p>
                  </td>

                  {/* Quiz */}
                  <td className="px-4 py-4 text-center">
                    <p className="font-medium">{Math.round((s.quiz_avg_score || 0) * 100)}%</p>
                    <p className="text-xs text-gray-400">
                      {s.quizzes_passed} réussi{s.quizzes_passed !== 1 ? "s" : ""} · {s.quiz_wrong_answers} erreur{s.quiz_wrong_answers !== 1 ? "s" : ""}
                    </p>
                  </td>

                  {/* Conversations */}
                  <td className="px-4 py-4 text-center">
                    <p className="font-medium">{s.conv_hours}h</p>
                    <p className="text-xs text-gray-400">
                      {s.conv_sessions} session{s.conv_sessions !== 1 ? "s" : ""}
                      {s.conv_avg_rating > 0 && ` · ${s.conv_avg_rating}/10`}
                    </p>
                  </td>

                  {/* Q&A */}
                  <td className="px-4 py-4 text-center">
                    <p className="font-medium">{s.qa_questions_asked}</p>
                    <p className="text-xs text-gray-400">questions posées</p>
                  </td>

                  {/* Dernière activité */}
                  <td className="px-4 py-4">
                    <span className={`text-xs ${s.last_activity_at ? "text-gray-500" : "text-red-500 font-medium"}`}>
                      {formatDate(s.last_activity_at)}
                    </span>
                  </td>
                </tr>
              ))}
              {(!scores || scores.length === 0) && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Aucune donnée encore</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
