"use client";
import type { EmployeeConversationReport } from "@/types/conversation";

function formatHours(seconds: number) {
  return `${(seconds / 3600).toFixed(1)}h`;
}

export function ConversationReport({ data }: { data: EmployeeConversationReport[] }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
            <th className="px-4 py-3">Employé</th>
            <th className="px-4 py-3">Sessions</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Cette semaine</th>
            <th className="px-4 py-3">Ce mois</th>
            <th className="px-4 py-3">Note moy.</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr key={r.employee_id} className="border-b last:border-0">
              <td className="px-4 py-3 font-medium">{r.first_name} {r.last_name}</td>
              <td className="px-4 py-3">{r.total_sessions}</td>
              <td className="px-4 py-3">{formatHours(r.total_seconds)}</td>
              <td className="px-4 py-3">{formatHours(r.seconds_this_week)}</td>
              <td className="px-4 py-3">{formatHours(r.seconds_this_month)}</td>
              <td className="px-4 py-3">
                {r.avg_rating ? (
                  <span className="font-medium text-brand-600">{r.avg_rating}/10</span>
                ) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <p className="p-6 text-center text-sm text-gray-400">Aucune conversation enregistrée</p>
      )}
    </div>
  );
}
