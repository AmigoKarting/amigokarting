import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAuthEmployee } from "@/lib/supabase/middleware";

export default async function ManagerMyScorePage() {
  const supabase = createServerSupabaseClient();
  const employee = await getAuthEmployee();
  if (!employee) return null;

  const { data: score } = await supabase
    .from("employee_global_score")
    .select("*")
    .eq("employee_id", employee.id)
    .single();

  const globalScore = Math.round(score?.global_score || 0);

  function getScoreColor(s: number): string {
    if (s >= 80) return "text-green-600";
    if (s >= 60) return "text-orange-600";
    if (s >= 40) return "text-amber-600";
    return "text-red-600";
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Ma note</h1>

      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gray-100">
          <span className={`text-4xl font-bold ${getScoreColor(globalScore)}`}>{globalScore}</span>
        </div>
        <div className="mx-auto mt-4 h-3 w-48 sm:w-64 overflow-hidden rounded-full bg-gray-200">
          <div className={`h-full rounded-full ${globalScore>=80?"bg-green-500":globalScore>=60?"bg-orange-500":globalScore>=40?"bg-amber-500":"bg-red-500"}`} style={{width:`${globalScore}%`}} />
        </div>
        <p className="mt-2 text-xs text-gray-400">Score sur 100</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase text-gray-400">Formation (40%)</p>
          <p className="mt-2 text-2xl font-bold">{score?.formation_pct || 0}%</p>
          <p className="text-xs text-gray-400">{score?.completed_videos || 0}/{score?.total_videos || 0} vidéos</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase text-gray-400">Quiz (30%)</p>
          <p className="mt-2 text-2xl font-bold">{Math.round((score?.quiz_avg_score || 0) * 100)}%</p>
          <p className="text-xs text-gray-400">{score?.quizzes_passed || 0} réussis · {score?.quiz_wrong_answers || 0} erreurs</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase text-gray-400">Conversations IA (20%)</p>
          <p className="mt-2 text-2xl font-bold">{score?.conv_hours || 0}h</p>
          <p className="text-xs text-gray-400">{score?.conv_sessions || 0} sessions</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase text-gray-400">Q&A (10%)</p>
          <p className="mt-2 text-2xl font-bold">{score?.qa_questions_asked || 0}</p>
          <p className="text-xs text-gray-400">questions posées</p>
        </div>
      </div>
    </div>
  );
}
