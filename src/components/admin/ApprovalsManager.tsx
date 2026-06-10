"use client";

import { useEffect, useState } from "react";

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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
      </div>
    );
  }

  if (pending.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <p className="text-5xl">✅</p>
        <p className="mt-3 text-sm font-semibold text-gray-800">Aucun compte en attente</p>
        <p className="mt-1 text-xs text-gray-400">
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
          className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
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
              className="flex-1 rounded-xl bg-green-500 px-5 py-2.5 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-50 sm:flex-none"
            >
              ✓ Accepter
            </button>
            <button
              disabled={busy === emp.id}
              onClick={() => act(emp.id, "deactivate", `${emp.first_name} ${emp.last_name}`)}
              className="flex-1 rounded-xl bg-red-100 px-5 py-2.5 text-sm font-semibold text-red-700 transition active:scale-95 disabled:opacity-50 sm:flex-none"
            >
              Refuser
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
