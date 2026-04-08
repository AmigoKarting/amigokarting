"use client";

import { useState, useEffect } from "react";

export function PendingAccounts() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPending(); }, []);

  async function loadPending() {
    try {
      const res = await fetch("/api/admin/employees");
      const data = await res.json();
      const inactive = (data.employees || []).filter((e: any) => !e.is_active);
      setPending(inactive);
    } catch {}
    setLoading(false);
  }

  async function handleApprove(id: string) {
    await fetch("/api/admin/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reactivate", employeeId: id }),
    });
    setPending((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleReject(id: string, name: string) {
    if (!confirm(`Refuser le compte de ${name} ?`)) return;
    await fetch("/api/admin/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deactivate", employeeId: id }),
    });
    setPending((prev) => prev.filter((p) => p.id !== id));
  }

  if (loading || pending.length === 0) return null;

  return (
    <div className="rounded-xl border-2 border-orange-300 bg-orange-50 shadow-sm">
      <div className="border-b border-orange-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
            {pending.length}
          </span>
          <h2 className="font-semibold text-orange-900">Comptes en attente d'approbation</h2>
        </div>
      </div>
      <div className="divide-y divide-orange-200">
        {pending.map((emp: any) => (
          <div key={emp.id} className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="font-medium text-gray-900">{emp.first_name} {emp.last_name}</p>
              <p className="text-xs text-gray-500">
                Tél: {emp.phone || "—"} · Code: {emp.phone_last4} · Inscrit le {new Date(emp.created_at).toLocaleDateString("fr-CA")}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(emp.id)}
                className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-600"
              >
                Approuver
              </button>
              <button
                onClick={() => handleReject(emp.id, `${emp.first_name} ${emp.last_name}`)}
                className="rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-200"
              >
                Refuser
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}