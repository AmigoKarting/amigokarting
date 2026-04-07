import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAuthEmployee } from "@/lib/supabase/middleware";

export default async function MyScorePage() {
  const supabase = createServerSupabaseClient();
  const employee: any = await getAuthEmployee();
if (!employee) return null;

const { data: score }: any = await supabase
    .from("employee_global_score")
    .select("*")
    .eq("employee_id", employee.id)
    .single();

  function getScoreColor(s: number): string {
    if (s >= 80) return "text-green-600";
    if (s >= 60) return "text-orange-600";
    if (s >= 40) return "text-amber-600";
    return "text-red-600";
  }

  function getScoreLabel(s: number): string {
    if (s >= 80) return "Excellent ! Continue comme ça.";
    if (s >= 60) return "Bon travail, tu peux encore progresser.";
    if (s >= 40) return "Il reste du travail. Continue tes formations !";
    return "Tu commences ! Regarde les vidéos et fais les quiz.";
  }

  const globalScore = Math.round(score?.global_score || 0);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Ma note</h1>

      {/* Score principal */}
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gray-100">
          <span className={`text-4xl font-bold ${getScoreColor(globalScore)}`}>
            {globalScore}
          </span>
        </div>
        <p className="mt-3 text-sm text-gray-500">{getScoreLabel(globalScore)}</p>
        <div className="mx-auto mt-4 h-3 w-48 sm:w-64 overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full rounded-full transition-all ${
              globalScore >= 80 ? "bg-green-500" :
              globalScore >= 60 ? "bg-orange-500" :
              globalScore >= 40 ? "bg-amber-500" : "bg-red-500"
            }`}
            style={{ width: `${globalScore}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-400">Score sur 100</p>
      </div>

      {/* Détail par catégorie */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Formation (40%) */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase text-gray-400">Formation</p>
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700">40% du score</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{score?.formation_pct || 0}%</p>
          <p className="text-xs text-gray-400">{score?.completed_videos || 0}/{score?.total_videos || 0} vidéos complétées</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-orange-500" style={{ width: `${score?.formation_pct || 0}%` }} />
          </div>
        </div>

        {/* Quiz (30%) */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase text-gray-400">Quiz</p>
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700">30% du score</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{Math.round((score?.quiz_avg_score || 0) * 100)}%</p>
          <p className="text-xs text-gray-400">
            {score?.quizzes_passed || 0} quiz réussi{(score?.quizzes_passed || 0) !== 1 ? "s" : ""} · {score?.quiz_wrong_answers || 0} erreur{(score?.quiz_wrong_answers || 0) !== 1 ? "s" : ""}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-orange-500" style={{ width: `${(score?.quiz_avg_score || 0) * 100}%` }} />
          </div>
        </div>

        {/* Conversations (20%) */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase text-gray-400">Conversations IA</p>
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700">20% du score</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{score?.conv_hours || 0}h</p>
          <p className="text-xs text-gray-400">
            {score?.conv_sessions || 0} session{(score?.conv_sessions || 0) !== 1 ? "s" : ""}
            {(score?.conv_avg_rating || 0) > 0 && ` · Note ${score?.conv_avg_rating}/10`}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-orange-500" style={{ width: `${Math.min((score?.conv_hours || 0) / 5 * 100, 100)}%` }} />
          </div>
          <p className="mt-1 text-[10px] text-gray-300">Objectif : 5 heures</p>
        </div>

        {/* Q&A (10%) */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase text-gray-400">Q&A Manuel</p>
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700">10% du score</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{score?.qa_questions_asked || 0}</p>
          <p className="text-xs text-gray-400">questions posées sur le manuel</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-orange-500" style={{ width: `${Math.min((score?.qa_questions_asked || 0) / 20 * 100, 100)}%` }} />
          </div>
          <p className="mt-1 text-[10px] text-gray-300">Objectif : 20 questions</p>
        </div>
      </div>

      {/* Conseils */}
      <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
        <p className="text-sm font-semibold text-orange-800">Comment améliorer ta note ?</p>
        <ul className="mt-2 space-y-1.5 text-sm text-orange-700">
          {(score?.formation_pct || 0) < 100 && (
            <li>• Complète les vidéos de formation ({score?.total_videos - score?.completed_videos} restante{(score?.total_videos - score?.completed_videos) > 1 ? "s" : ""})</li>
          )}
          {(score?.quiz_avg_score || 0) < 0.7 && (
            <li>• Repasse les quiz pour monter ta moyenne au-dessus de 70%</li>
          )}
          {(score?.conv_hours || 0) < 5 && (
            <li>• Fais plus de sessions de conversation IA ({(5 - (score?.conv_hours || 0)).toFixed(1)}h restantes)</li>
          )}
          {(score?.qa_questions_asked || 0) < 20 && (
            <li>• Pose des questions dans le Q&A ({20 - (score?.qa_questions_asked || 0)} restantes)</li>
          )}
          {globalScore >= 80 && <li>• Tu es excellent ! Continue à utiliser l'app pour rester à jour.</li>}
        </ul>
      </div>
    </div>
  );
}
