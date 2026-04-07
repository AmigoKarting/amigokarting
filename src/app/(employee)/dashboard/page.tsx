import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAuthEmployee } from "@/lib/supabase/middleware";
import { AnnouncementBanner } from "@/components/announcements/AnnouncementBanner";
import { AnnouncementPopup } from "@/components/announcements/AnnouncementPopup";

export default async function DashboardPage() {
  const employee = await getAuthEmployee();
  const supabase = createServerSupabaseClient();

  // Progression de formation
  const { data: progress } = await supabase
    .from("video_watch_log")
    .select("completed")
    .eq("employee_id", employee?.id);

  const totalWatched = progress?.filter((p) => p.completed).length || 0;
  const totalVideos = progress?.length || 0;

  return (
    <div className="space-y-6">
      {/* Popup annonces non-lues */}
      <AnnouncementPopup />

      <h1 className="text-2xl font-bold">
        Bonjour {employee?.first_name} !
      </h1>

      {/* Annonces */}
      <AnnouncementBanner />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Formation</p>
          <p className="mt-1 text-3xl font-bold text-orange-600">
            {totalVideos > 0 ? Math.round((totalWatched / totalVideos) * 100) : 0}%
          </p>
          <p className="text-sm text-gray-400">{totalWatched}/{totalVideos} vidéos complétées</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Conversations IA</p>
          <p className="mt-1 text-3xl font-bold text-orange-600">—</p>
          <p className="text-sm text-gray-400">Heures cette semaine</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Ma fiche</p>
          <p className="mt-1 text-3xl font-bold text-green-600">✓</p>
          <p className="text-sm text-gray-400">Informations complètes</p>
        </div>
      </div>
    </div>
  );
}
