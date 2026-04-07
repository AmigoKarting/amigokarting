import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AnnouncementPopup } from "@/components/announcements/AnnouncementPopup";

export default async function AdminDashboard() {
  const supabase = createServerSupabaseClient();

  const { count: employeeCount } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  const { data: missingInfo } = await supabase
    .from("employee_missing_info")
    .select("*")
    .eq("has_missing_info", true);

  return (
    <div className="space-y-6">
      <AnnouncementPopup />

      <h1 className="text-2xl font-bold">Tableau de bord</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Employés actifs</p>
          <p className="mt-1 text-3xl font-bold">{employeeCount || 0}</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Infos manquantes</p>
          <p className="mt-1 text-3xl font-bold text-red-600">{missingInfo?.length || 0}</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">En formation</p>
          <p className="mt-1 text-3xl font-bold text-brand-600">—</p>
          <p className="text-xs text-gray-400">Temps réel via Supabase Realtime</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Note moyenne conversations</p>
          <p className="mt-1 text-3xl font-bold text-green-600">—/10</p>
        </div>
      </div>
    </div>
  );
}
