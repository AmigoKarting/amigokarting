"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Crown, Code2 } from "lucide-react";
import type { Employee, EmployeeMissingInfo } from "@/types/employee";
import { roleBadgeClass } from "@/lib/roles";

interface Props {
  employees: Employee[];
  missingInfo: EmployeeMissingInfo[];
}

const ROLE_OPTIONS = [
  { value: "employee", label: "Employé" },
  { value: "caisse", label: "Caisse" },
  { value: "piste", label: "Piste" },
  { value: "manager", label: "Gérant" },
];

export function EmployeeTable({ employees, missingInfo }: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  function getMissing(id: string) {
    return missingInfo.find((m) => m.id === id);
  }

  async function changeRole(employeeId: string, newRole: string) {
    const confirmMsg = newRole === "manager"
      ? "Rendre cet employé gérant ? Il aura accès à l'espace de gestion."
      : `Changer le rôle vers « ${ROLE_OPTIONS.find((o) => o.value === newRole)?.label} » ?`;
    if (!confirm(confirmMsg)) return;

    setLoadingId(employeeId);
    try {
      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "changeRole", employeeId, newRole }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error || "Erreur lors du changement de rôle.");
      else router.refresh();
    } catch {
      alert("Erreur de connexion.");
    }
    setLoadingId(null);
  }

  async function deactivateEmployee(employeeId: string, name: string) {
    if (!confirm(`Désactiver le compte de ${name} ? Il ne pourra plus se connecter.`)) return;

    setLoadingId(employeeId);
    try {
      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deactivate", employeeId }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error || "Erreur.");
      else router.refresh();
    } catch {
      alert("Erreur de connexion.");
    }
    setLoadingId(null);
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
            <th className="px-4 py-3">Employé</th>
            <th className="px-4 py-3">Rôle</th>
            <th className="px-4 py-3">Téléphone</th>
            <th className="px-4 py-3">Adresse</th>
            <th className="px-4 py-3">Urgence</th>
            <th className="px-4 py-3">Uniforme</th>
            <th className="px-4 py-3">Fiche</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => {
            const missing = getMissing(emp.id);
            const isLoading = loadingId === emp.id;
            const isStaffLock = emp.role === "patron" || emp.role === "developpeur";
            return (
              <tr key={emp.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                {/* Nom */}
                <td className="px-4 py-3">
                  <Link href={`/admin/employees/${emp.id}`} className="font-medium text-brand-600 hover:underline">
                    {emp.first_name} {emp.last_name}
                  </Link>
                  <p className="text-xs text-gray-400">Code : {emp.role === "patron" ? "****" : emp.phone_last4}</p>
                </td>

                {/* Rôle : sélecteur (sauf patron/dev = verrouillé) */}
                <td className="px-4 py-3">
                  {isStaffLock ? (
                    <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium ${roleBadgeClass(emp.role)}`}>
                      {emp.role === "patron"
                        ? <><Crown className="h-3 w-3" strokeWidth={2} /> Patron</>
                        : <><Code2 className="h-3 w-3" strokeWidth={2} /> Dev</>}
                    </span>
                  ) : (
                    <select
                      value={emp.role}
                      disabled={isLoading}
                      onChange={(e) => changeRole(emp.id, e.target.value)}
                      className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 transition hover:border-gray-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-orange-100 disabled:opacity-50"
                    >
                      {ROLE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  )}
                </td>

                {/* Téléphone */}
                <td className={`px-4 py-3 ${missing?.missing_phone ? "font-medium text-red-500" : ""}`}>
                  {emp.phone || "Manquant"}
                </td>

                {/* Adresse */}
                <td className={`px-4 py-3 ${missing?.missing_address ? "font-medium text-red-500" : ""}`}>
                  {emp.address ? `${emp.city || ""}` : "Manquant"}
                </td>

                {/* Contact urgence */}
                <td className={`px-4 py-3 ${missing?.missing_emergency_contact ? "font-medium text-red-500" : ""}`}>
                  {emp.emergency_contact_name || "Manquant"}
                </td>

                {/* Uniforme */}
                <td className={`px-4 py-3 ${missing?.missing_uniform_shirt ? "font-medium text-red-500" : ""}`}>
                  {emp.uniform_size_shirt || "Manquant"}
                </td>

                {/* Statut fiche */}
                <td className="px-4 py-3">
                  {missing?.has_missing_info ? (
                    <span className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                      Incomplet
                    </span>
                  ) : (
                    <span className="rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">
                      Complet
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <button
                    onClick={() => deactivateEmployee(emp.id, `${emp.first_name} ${emp.last_name}`)}
                    disabled={isLoading}
                    className="text-xs text-gray-400 transition hover:text-red-600 disabled:opacity-50"
                  >
                    Désactiver
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {employees.length === 0 && (
        <p className="p-8 text-center text-sm text-gray-400">Aucun employé actif</p>
      )}
    </div>
  );
}
