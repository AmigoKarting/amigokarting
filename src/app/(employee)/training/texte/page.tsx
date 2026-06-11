import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAuthEmployee } from "@/lib/supabase/middleware";
import { roleCategory } from "@/lib/roles";
import { ModuleCard } from "@/components/training/ModuleCard";
import { CollapsibleCategory } from "@/components/training/CollapsibleCategory";
import { TRAINING_CATEGORIES } from "@/lib/training";
import { BookOpen, ClipboardList, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function TrainingTextePage() {
  const supabase = createServerSupabaseClient();
  const me: any = await getAuthEmployee();
  // Formation ciblée : un rôle « caisse »/« piste » ne voit que sa catégorie.
  const onlyCategory = roleCategory(me?.role);

  const { data: modules } = await supabase
    .from("training_modules")
    .select("*, training_chapters(*, training_videos(*))")
    .eq("is_active", true)
    .eq("content_type", "text")
    .order("sort_order");

  const textModules = modules || [];

  // Liste des catégories : les catégories prédéfinies + toute autre trouvée
  const found = new Set(textModules.map((m) => m.category || "Autres"));
  const allCategories = [
    ...TRAINING_CATEGORIES,
    ...[...found].filter((c) => !TRAINING_CATEGORIES.includes(c)),
  ];
  // Si le rôle est rattaché à une catégorie précise, on n'affiche que celle-là.
  const categories = onlyCategory
    ? allCategories.filter((c) => c === onlyCategory)
    : allCategories;

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
          href="/training"
          className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} /> Retour
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Formation texte</h1>
        <p className="mt-1 text-sm text-gray-500">
          Touche une catégorie pour l'ouvrir.
        </p>
      </div>

      {/* ─── Mes formations ─── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-brand-600" strokeWidth={2} />
          <h2 className="text-lg font-semibold text-gray-900">Mes formations</h2>
        </div>

        {categories.map((cat) => {
          const mods = textModules.filter((m) => (m.category || "Autres") === cat);
          return (
            <CollapsibleCategory key={`mod-${cat}`} title={cat} count={mods.length}>
              {mods.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {mods.map((module) => (
                    <ModuleCard key={module.id} module={module} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Aucune formation pour le moment.
                </p>
              )}
            </CollapsibleCategory>
          );
        })}
      </div>

      {/* ─── Quiz ─── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-brand-600" strokeWidth={2} />
          <h2 className="text-lg font-semibold text-gray-900">Quiz</h2>
        </div>

        {categories.map((cat) => {
          const qs = textQuizzes.filter((q) => chapterCat[q.chapter_id] === cat);
          return (
            <CollapsibleCategory key={`quiz-${cat}`} title={cat} count={qs.length}>
              {qs.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {qs.map((quiz) => (
                    <Link
                      key={quiz.id}
                      href={`/training/${quiz.training_chapters?.module_id}/${quiz.chapter_id}`}
                    >
                      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300">
                        <h3 className="text-sm font-semibold text-gray-900">{quiz.title}</h3>
                        <div className="mt-1 text-xs text-gray-500">
                          Quiz · {Math.round((quiz.passing_score || 0) * 100)}% pour réussir
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Aucun quiz pour le moment.</p>
              )}
            </CollapsibleCategory>
          );
        })}
      </div>
    </div>
  );
}
