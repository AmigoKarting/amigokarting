"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Employee, EmployeeMissingInfo } from "@/types/employee";

interface Props {
  employees: Employee[];
  missingInfo: EmployeeMissingInfo[];
}

export function EmployeeTable({ employees, missingInfo }: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  function getMissing(id: string) {
    return missingInfo.find((m) => m.id === id);
  }

  async function toggleRole(employeeId: string, currentRole: string) {
    const newRole = currentRole === "manager" ? "employee" : "manager";
    const confirmMsg = newRole === "manager"
      ? "Rendre cet employé gestionnaire ? Il aura accès à toutes les données."
      : "Retirer les droits de gestionnaire à cet employé ?";

    if (!confirm(confirmMsg)) return;

    setLoadingId(employeeId);
    try {
      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "changeRole", employeeId, newRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erreur lors du changement de rôle.");
      } else {
        router.refresh();
      }
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
      if (!res.ok) {
        alert(data.error || "Erreur.");
      } else {
        router.refresh();
      }
    } catch {
      alert("Erreur de connexion.");
    }
    setLoadingId(null);
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
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
            return (
              <tr key={emp.id} className="border-b last:border-0 hover:bg-gray-50">
                {/* Nom */}
                <td className="px-4 py-3">
                  <Link href={`/admin/employees/${emp.id}`} className="font-medium text-orange-600 hover:underline">
                    {emp.first_name} {emp.last_name}
                  </Link>
                  <p className="text-xs text-gray-400">Code : {emp.role === "patron" ? "****" : emp.phone_last4}</p>
                </td>

                {/* Rôle avec bouton toggle */}
                <td className="px-4 py-3">
                {emp.role === "patron" ? (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${emp.role === "patron" ? "bg-yellow-100 text-yellow-700" : "bg-cyan-100 text-cyan-700"}`}>
                      {emp.role === "patron" ? "👑 Patron" : "💻 Dev"}
                    </span>
                  ) : (
                    <button
                      onClick={() => toggleRole(emp.id, emp.role)}
                      disabled={isLoading}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium transition hover:opacity-80 disabled:opacity-50 ${
                        emp.role === "manager"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                      title={emp.role === "manager" ? "Cliquer pour retirer les droits gérant" : "Cliquer pour rendre gérant"}
                    >
                      {emp.role === "manager" ? "Gérant" : "Employé"}
                    </button>
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
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      Incomplet
                    </span>
                  ) : (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Complet
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <button
                    onClick={() => deactivateEmployee(emp.id, `${emp.first_name} ${emp.last_name}`)}
                    disabled={isLoading}
                    className="text-xs text-red-400 transition hover:text-red-600 disabled:opacity-50"
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
