import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAuthEmployee } from "@/lib/supabase/middleware";
import { EmployeeTable } from "@/components/admin/EmployeeTable";

export default async function EmployeesPage() {
  const supabase = createServerSupabaseClient();
  const currentUser: any = await getAuthEmployee();

  const { data: allEmployees } = await supabase
    .from("employees")
    .select("*")
    .eq("is_active", true)
    .order("last_name");

  const { data: missingInfo } = await supabase
    .from("employee_missing_info")
    .select("*");

  // Cacher les développeurs sauf pour patron et dev
  const canSeeDev = currentUser?.role === "patron" || currentUser?.role === "developpeur";
  const employees = canSeeDev ? allEmployees : allEmployees?.filter((e: any) => e.role !== "developpeur");

  // Stats globales
  const totalEmployees = employees?.length || 0;
  const managers = employees?.filter((e: any) => e.role === "manager").length || 0;
  const incomplete = missingInfo?.filter((m: any) => m.has_missing_info).length || 0;
  const complete = totalEmployees - incomplete;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Employés</h1>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Total actifs</p>
          <p className="text-2xl font-bold">{totalEmployees}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Gérants</p>
          <p className="text-2xl font-bold text-purple-600">{managers}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Fiches complètes</p>
          <p className="text-2xl font-bold text-green-600">{complete}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Infos manquantes</p>
          <p className="text-2xl font-bold text-red-600">{incomplete}</p>
        </div>
      </div>

      <EmployeeTable employees={employees || []} missingInfo={missingInfo || []} />

      {/* Tableau complet des données (toutes les colonnes) */}
      <div className="rounded-xl bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Toutes les données employés</h2>
          <p className="text-xs text-gray-400">Vue complète de la base de données</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-gray-50 text-left font-medium uppercase text-gray-500">
                <th className="whitespace-nowrap px-3 py-2">Prénom</th>
                <th className="whitespace-nowrap px-3 py-2">Nom</th>
                <th className="whitespace-nowrap px-3 py-2">Rôle</th>
                <th className="whitespace-nowrap px-3 py-2">Code</th>
                <th className="whitespace-nowrap px-3 py-2">Téléphone</th>
                <th className="whitespace-nowrap px-3 py-2">Email</th>
                <th className="whitespace-nowrap px-3 py-2">Adresse</th>
                <th className="whitespace-nowrap px-3 py-2">Ville</th>
                <th className="whitespace-nowrap px-3 py-2">Code postal</th>
                <th className="whitespace-nowrap px-3 py-2">Province</th>
                <th className="whitespace-nowrap px-3 py-2">Contact urgence</th>
                <th className="whitespace-nowrap px-3 py-2">Tél. urgence</th>
                <th className="whitespace-nowrap px-3 py-2">Chandail</th>
                <th className="whitespace-nowrap px-3 py-2">Créé le</th>
                <th className="whitespace-nowrap px-3 py-2">Modifié le</th>
              </tr>
            </thead>
            <tbody>
              {employees?.map((emp: any) => (
                <tr key={emp.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="whitespace-nowrap px-3 py-2 font-medium">{emp.first_name}</td>
                  <td className="whitespace-nowrap px-3 py-2">{emp.last_name}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      emp.role === "patron" ? "bg-yellow-100 text-yellow-700"
                        : emp.role === "developpeur" ? "bg-cyan-100 text-cyan-700"
                        : emp.role === "manager" ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {emp.role === "patron" ? "👑 Patron" : emp.role === "developpeur" ? "💻 Dev" : emp.role === "manager" ? "Gérant" : "Employé"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono">{emp.role === "patron" ? "****" : emp.phone_last4}</td>
                  <td className={`whitespace-nowrap px-3 py-2 ${!emp.phone ? "text-red-500" : ""}`}>
                    {emp.phone || "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-400">{emp.email || "—"}</td>
                  <td className={`whitespace-nowrap px-3 py-2 ${!emp.address ? "text-red-500" : ""}`}>
                    {emp.address || "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">{emp.city || "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2">{emp.postal_code || "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2">{emp.province || "—"}</td>
                  <td className={`whitespace-nowrap px-3 py-2 ${!emp.emergency_contact_name ? "text-red-500" : ""}`}>
                    {emp.emergency_contact_name || "—"}
                  </td>
                  <td className={`whitespace-nowrap px-3 py-2 ${!emp.emergency_contact_phone ? "text-red-500" : ""}`}>
                    {emp.emergency_contact_phone || "—"}
                  </td>
                  <td className={`whitespace-nowrap px-3 py-2 ${!emp.uniform_size_shirt ? "text-red-500" : ""}`}>
                    {emp.uniform_size_shirt || "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-400">
                    {new Date(emp.created_at).toLocaleDateString("fr-CA")}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-400">
                    {new Date(emp.updated_at).toLocaleDateString("fr-CA")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}