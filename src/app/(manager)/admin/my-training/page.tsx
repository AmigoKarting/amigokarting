import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAuthEmployee } from "@/lib/supabase/middleware";
import { FileText, Video, BookOpen, ClipboardList } from "lucide-react";
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

  const textModules = modules?.filter((m) => m.content_type === "text") || [];
  const videoModules = modules?.filter((m) => m.content_type !== "text") || [];

  // Quiz rattachés aux chapitres des formations écrites
  const textChapterIds = textModules.flatMap(
    (m) => m.training_chapters?.map((c: any) => c.id) || []
  );

  let textQuizzes: any[] = [];
  if (textChapterIds.length > 0) {
    const { data: quizzes } = await supabase
      .from("quizzes")
      .select("*, training_chapters(id, module_id)")
      .in("chapter_id", textChapterIds)
      .eq("is_active", true);
    textQuizzes = quizzes || [];
  }

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-2xl font-bold">Ma formation</h1>
        <p className="text-sm text-gray-500">Parcours les modules de formation.</p>
      </div>

      {/* ═══ Formation écrite ═══ */}
      <section className="space-y-8">
        <div className="flex items-center gap-2 border-b pb-2">
          <FileText className="h-5 w-5 text-orange-500" />
          <h2 className="text-lg font-semibold">Formation écrite</h2>
        </div>

        {/* ─── Mes formations ─── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-gray-500" />
            <h3 className="font-medium text-gray-800">Mes formations</h3>
          </div>
          {textModules.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {textModules.map((mod) => {
                const chapterCount = mod.training_chapters?.length || 0;
                return (
                  <Link key={mod.id} href={`/training/${mod.id}`}>
                    <div className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md">
                      <h3 className="font-semibold text-gray-900">{mod.title}</h3>
                      {mod.description && (
                        <p className="mt-1 text-sm text-gray-500">{mod.description}</p>
                      )}
                      <div className="mt-4 flex gap-4 text-xs text-gray-400">
                        <span>
                          {chapterCount} chapitre{chapterCount > 1 ? "s" : ""}
                        </span>
                        <span>Lecture</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              Aucune formation écrite pour le moment.
            </p>
          )}
        </div>

        {/* ─── Quiz ─── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-gray-500" />
            <h3 className="font-medium text-gray-800">Quiz</h3>
          </div>
          {textQuizzes.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {textQuizzes.map((quiz) => (
                <Link
                  key={quiz.id}
                  href={`/training/${quiz.training_chapters?.module_id}/${quiz.chapter_id}`}
                >
                  <div className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md">
                    <h3 className="font-semibold text-gray-900">{quiz.title}</h3>
                    {quiz.description && (
                      <p className="mt-1 text-sm text-gray-500">{quiz.description}</p>
                    )}
                    <div className="mt-4 text-xs text-gray-400">
                      Quiz · {Math.round((quiz.passing_score || 0) * 100)}% pour réussir
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Aucun quiz pour le moment.</p>
          )}
        </div>
      </section>

      {/* ═══ Formation vidéo ═══ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-2">
          <Video className="h-5 w-5 text-orange-500" />
          <h2 className="text-lg font-semibold">Formation vidéo</h2>
        </div>

        {videoModules.length === 0 && (
          <p className="text-sm text-gray-400">
            Aucune formation vidéo pour le moment.
          </p>
        )}

        <div className="space-y-4">
          {videoModules.map((mod) => {
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
      </section>
    </div>
  );
}
