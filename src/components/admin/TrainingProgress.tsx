"use client";

interface Props {
  employees: { id: string; first_name: string; last_name: string }[];
  modules: any[];
  watchLogs: { employee_id: string; video_id: string; completed: boolean }[];
}

export function TrainingProgress({ employees, modules, watchLogs }: Props) {
  // Compter le total de vidéos
  const allVideoIds = modules.flatMap((m) =>
    m.training_chapters?.flatMap((ch: any) =>
      ch.training_videos?.map((v: any) => v.id) || []
    ) || []
  );
  const totalVideos = allVideoIds.length;

  function getEmployeeProgress(employeeId: string) {
    const completed = watchLogs.filter(
      (w) => w.employee_id === employeeId && w.completed
    ).length;
    return totalVideos > 0 ? Math.round((completed / totalVideos) * 100) : 0;
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
            <th className="px-4 py-3">Employé</th>
            <th className="px-4 py-3">Progression</th>
            <th className="px-4 py-3">Vidéos</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => {
            const pct = getEmployeeProgress(emp.id);
            const completed = watchLogs.filter(
              (w) => w.employee_id === emp.id && w.completed
            ).length;
            return (
              <tr key={emp.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{emp.first_name} {emp.last_name}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-brand-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{pct}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{completed}/{totalVideos}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
