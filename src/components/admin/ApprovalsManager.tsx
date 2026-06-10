"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Check } from "lucide-react";

export function ApprovalsManager() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/employees?all=true");
      const data = await res.json();
      setPending((data.employees || []).filter((e: any) => !e.is_active));
    } catch {}
    setLoading(false);
  }

  async function act(id: string, action: "reactivate" | "deactivate", name: string) {
    if (action === "deactivate" && !confirm(`Refuser et supprimer l'accès de ${name} ?`)) return;
    setBusy(id);
    try {
      await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, employeeId: id }),
      });
      setPending((prev) => prev.filter((p) => p.id !== id));
    } catch {}
    setBusy(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-brand-600" />
      </div>
    );
  }

  if (pending.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" strokeWidth={2} />
        <p className="mt-3 text-sm font-semibold text-gray-900">Aucun compte en attente</p>
        <p className="mt-1 text-xs text-gray-500">
          Les nouveaux employés qui s'inscrivent apparaîtront ici, pour que tu les acceptes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pending.map((emp) => (
        <div
          key={emp.id}
          className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-semibold text-gray-900">{emp.first_name} {emp.last_name}</p>
            <p className="mt-0.5 text-xs text-gray-500">
              Tél : {emp.phone || "—"} · Code : {emp.phone_last4} · Inscrit le{" "}
              {new Date(emp.created_at).toLocaleDateString("fr-CA")}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              disabled={busy === emp.id}
              onClick={() => act(emp.id, "reactivate", `${emp.first_name} ${emp.last_name}`)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50 sm:flex-none"
            >
              <Check className="h-4 w-4" strokeWidth={2} /> Accepter
            </button>
            <button
              disabled={busy === emp.id}
              onClick={() => act(emp.id, "deactivate", `${emp.first_name} ${emp.last_name}`)}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 sm:flex-none"
            >
              Refuser
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
