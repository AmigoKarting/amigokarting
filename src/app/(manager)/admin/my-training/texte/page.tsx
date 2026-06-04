import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BookOpen, ClipboardList, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function ManagerTrainingTextePage() {
  const supabase = createServerSupabaseClient();

  const { data: modules } = await supabase
    .from("training_modules")
    .select("*, training_chapters(*, training_videos(*))")
    .eq("is_active", true)
    .eq("content_type", "text")
    .order("sort_order");

  const textModules = modules || [];

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
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/my-training"
          className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <h1 className="text-2xl font-bold">Formation texte</h1>
      </div>

      {/* ─── Mes formations ─── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-gray-500" />
          <h2 className="font-medium text-gray-800">Mes formations</h2>
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
          <h2 className="font-medium text-gray-800">Quiz</h2>
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
    </div>
  );
}
