import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ModuleCard } from "@/components/training/ModuleCard";
import { FileText, Video, BookOpen, ClipboardList } from "lucide-react";
import Link from "next/link";

export default async function TrainingPage() {
  const supabase = createServerSupabaseClient();

  const { data: modules } = await supabase
    .from("training_modules")
    .select("*, training_chapters(*, training_videos(*))")
    .eq("is_active", true)
    .order("sort_order");

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
      <h1 className="text-2xl font-bold">Formation</h1>

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
              {textModules.map((module) => (
                <ModuleCard key={module.id} module={module} />
              ))}
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
                      <p className="mt-1 text-sm text-gray-500">
                        {quiz.description}
                      </p>
                    )}
                    <div className="mt-4 text-xs text-gray-400">
                      Quiz · {Math.round((quiz.passing_score || 0) * 100)}% pour
                      réussir
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              Aucun quiz pour le moment.
            </p>
          )}
        </div>
      </section>

      {/* ═══ Formation vidéo ═══ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-2">
          <Video className="h-5 w-5 text-orange-500" />
          <h2 className="text-lg font-semibold">Formation vidéo</h2>
        </div>
        {videoModules.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {videoModules.map((module) => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            Aucune formation vidéo pour le moment.
          </p>
        )}
      </section>
    </div>
  );
}
