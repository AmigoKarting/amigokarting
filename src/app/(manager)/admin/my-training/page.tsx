import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAuthEmployee } from "@/lib/supabase/middleware";
import Link from "next/link";

export default async function ManagerTrainingPage() {
  const supabase = createServerSupabaseClient();
  const employee = await getAuthEmployee();

  const { data: modules } = await supabase
    .from("training_modules")
    .select("*, training_chapters(*, training_videos(*))")
    .eq("is_active", true)
    .order("sort_order");

  // Progression du gérant
  const { data: watchLogs } = await supabase
    .from("video_watch_log")
    .select("video_id, completed, watched_sec")
    .eq("employee_id", employee?.id);

  const completedIds = new Set(
    watchLogs?.filter((w) => w.completed).map((w) => w.video_id) || []
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ma formation</h1>
        <p className="text-sm text-gray-500">Parcours les modules et regarde les vidéos.</p>
      </div>

      <div className="space-y-4">
        {modules?.map((mod) => {
          const allVideos = mod.training_chapters?.flatMap(
            (ch: any) => ch.training_videos || []
          ) || [];
          const completedCount = allVideos.filter((v: any) => completedIds.has(v.id)).length;
          const totalVideos = allVideos.length;
          const pct = totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0;

          return (
            <div key={mod.id} className="rounded-xl bg-white shadow-sm">
              {/* En-tête du module */}
              <div className="border-b border-gray-100 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900">{mod.title}</h2>
                    {mod.description && (
                      <p className="mt-0.5 text-sm text-gray-500">{mod.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-orange-600">{pct}%</span>
                    <p className="text-xs text-gray-400">{completedCount}/{totalVideos} vidéos</p>
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-orange-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Chapitres et vidéos */}
              <div className="px-6 py-4">
                {mod.training_chapters
                  ?.sort((a: any, b: any) => a.sort_order - b.sort_order)
                  .map((ch: any) => (
                    <div key={ch.id} className="mb-4 last:mb-0">
                      <h3 className="mb-2 text-sm font-medium text-gray-700">{ch.title}</h3>
                      <div className="space-y-1.5">
                        {ch.training_videos
                          ?.sort((a: any, b: any) => a.sort_order - b.sort_order)
                          .map((vid: any) => {
                            const done = completedIds.has(vid.id);
                            const watchLog = watchLogs?.find((w) => w.video_id === vid.id);
                            return (
                              <div
                                key={vid.id}
                                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-50"
                              >
                                {done ? (
                                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                                    <svg className="h-3.5 w-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  </span>
                                ) : watchLog ? (
                                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100">
                                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                                  </span>
                                ) : (
                                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100">
                                    <span className="h-2 w-2 rounded-full bg-gray-300" />
                                  </span>
                                )}
                                <span className={`flex-1 text-sm ${done ? "text-gray-400 line-through" : "text-gray-800"}`}>
                                  {vid.title}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {Math.floor(vid.duration_sec / 60)}:{String(vid.duration_sec % 60).padStart(2, "0")}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
