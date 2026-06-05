import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BookOpen, ClipboardList, ArrowLeft, Folder } from "lucide-react";
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

  const categories: string[] = [];
  for (const m of textModules) {
    const c = m.category || "Autres";
    if (!categories.includes(c)) categories.push(c);
  }

  const chapterCat: Record<string, string> = {};
  for (const m of textModules) {
    for (const ch of m.training_chapters || []) {
      chapterCat[ch.id] = m.category || "Autres";
    }
  }

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
    <div className="space-y-10">
      <div>
        <Link
          href="/admin/my-training"
          className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <h1 className="text-2xl font-bold">Formation texte</h1>
      </div>

      {/* ─── Mes formations (groupées par catégorie) ─── */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-orange-500" />
          <h2 className="text-lg font-semibold text-gray-800">Mes formations</h2>
        </div>

        {textModules.length === 0 && (
          <p className="text-sm text-gray-400">
            Aucune formation écrite pour le moment.
          </p>
        )}

        {categories.map((cat) => {
          const mods = textModules.filter((m) => (m.category || "Autres") === cat);
          if (mods.length === 0) return null;
          return (
            <div key={`mod-${cat}`} className="space-y-3">
              <div className="flex items-center gap-2 text-gray-700">
                <Folder className="h-4 w-4 text-orange-400" />
                <h3 className="text-sm font-semibold uppercase tracking-wide">{cat}</h3>
                <span className="text-xs text-gray-400">({mods.length})</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {mods.map((mod) => {
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
            </div>
          );
        })}
      </div>

      {/* ─── Quiz (groupés par catégorie) ─── */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-orange-500" />
          <h2 className="text-lg font-semibold text-gray-800">Quiz</h2>
        </div>

        {textQuizzes.length === 0 && (
          <p className="text-sm text-gray-400">Aucun quiz pour le moment.</p>
        )}

        {categories.map((cat) => {
          const qs = textQuizzes.filter((q) => chapterCat[q.chapter_id] === cat);
          if (qs.length === 0) return null;
          return (
            <div key={`quiz-${cat}`} className="space-y-3">
              <div className="flex items-center gap-2 text-gray-700">
                <Folder className="h-4 w-4 text-orange-400" />
                <h3 className="text-sm font-semibold uppercase tracking-wide">{cat}</h3>
                <span className="text-xs text-gray-400">({qs.length})</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {qs.map((quiz) => (
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
