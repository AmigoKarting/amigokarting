import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function QuizDifficultiesPage() {
  const supabase = createServerSupabaseClient();

  const { data: difficulties } = await supabase
    .from("employee_difficulties")
    .select("*")
    .order("times_wrong", { ascending: false });

  const { data: questionStats } = await supabase
    .from("quiz_question_stats")
    .select("*")
    .order("success_rate", { ascending: true });

  const byEmployee = new Map<string, { name: string; difficulties: any[] }>();
  for (const d of difficulties || []) {
    const key = d.employee_id;
    if (!byEmployee.has(key)) {
      byEmployee.set(key, { name: `${d.first_name} ${d.last_name}`, difficulties: [] });
    }
    byEmployee.get(key)!.difficulties.push(d);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Difficultés aux quiz</h1>
        <p className="text-sm text-gray-500">Questions que chaque employé rate le plus souvent</p>
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Questions les plus ratées (tous employés)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-3">Question</th>
                <th className="px-4 py-3">Quiz</th>
                <th className="px-4 py-3">Réponses</th>
                <th className="px-4 py-3">Taux réussite</th>
              </tr>
            </thead>
            <tbody>
              {questionStats?.map((q: any) => (
                <tr key={q.question_id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 max-w-sm">
                    <p className="font-medium text-gray-900">{q.question_text}</p>
                    {q.explanation && <p className="mt-1 text-xs text-gray-400">{q.explanation}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{q.quiz_title}</td>
                  <td className="px-4 py-3">{q.total_answers}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-200">
                        <div className={`h-full rounded-full ${(q.success_rate||0)>=0.7?"bg-green-500":(q.success_rate||0)>=0.4?"bg-amber-500":"bg-red-500"}`} style={{width:`${(q.success_rate||0)*100}%`}} />
                      </div>
                      <span className={`text-xs font-medium ${(q.success_rate||0)>=0.7?"text-green-600":(q.success_rate||0)>=0.4?"text-amber-600":"text-red-600"}`}>{Math.round((q.success_rate||0)*100)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {(!questionStats||questionStats.length===0) && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Aucune donnée de quiz encore</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Par employé</h2>
        {byEmployee.size === 0 && <p className="rounded-xl bg-white p-8 text-center text-sm text-gray-400 shadow-sm">Aucun employé n'a encore raté de question</p>}
        <div className="space-y-4">
          {Array.from(byEmployee.entries()).map(([empId, data]) => (
            <div key={empId} className="rounded-xl bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{data.name}</h3>
                  <p className="text-xs text-gray-400">{data.difficulties.length} question{data.difficulties.length>1?"s":""} difficile{data.difficulties.length>1?"s":""}</p>
                </div>
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                  {data.difficulties.filter((d: any)=>!d.eventually_correct).length} non corrigée{data.difficulties.filter((d: any)=>!d.eventually_correct).length!==1?"s":""}
                </span>
              </div>
              <div className="px-6 py-3">
                {data.difficulties.map((d: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 border-b border-gray-50 py-3 last:border-0">
                    <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${d.eventually_correct?"bg-green-100 text-green-600":"bg-red-100 text-red-600"}`}>
                      {d.eventually_correct?"✓":d.times_wrong}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{d.question_text}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                        <span>{d.quiz_title}</span><span>·</span>
                        <span>Raté {d.times_wrong}x</span>
                        {d.eventually_correct && <><span>·</span><span className="text-green-600">Corrigée</span></>}
                      </div>
                      {d.explanation && !d.eventually_correct && (
                        <p className="mt-1 rounded bg-amber-50 px-2 py-1 text-xs text-amber-700">Réponse : {d.explanation}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
