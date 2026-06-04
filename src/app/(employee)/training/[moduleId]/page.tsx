import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ChapterList } from "@/components/training/ChapterList";
import { notFound } from "next/navigation";

export default async function ModulePage({ params }: { params: { moduleId: string } }) {
  const supabase = createServerSupabaseClient();

  const { data: module } = await supabase
    .from("training_modules")
    .select("*, training_chapters(id, title, sort_order, training_videos(count))")
    .eq("id", params.moduleId)
    .single();

  if (!module) notFound();

  const chapters = module.training_chapters || [];
  const chapterIds = chapters.map((c: any) => c.id);

  // Nombre de questions de quiz par chapitre (requête séparée, motif simple)
  let quizByChapter: Record<string, number> = {};
  if (chapterIds.length > 0) {
    const { data: quizzes } = await supabase
      .from("quizzes")
      .select("chapter_id, quiz_questions(count)")
      .in("chapter_id", chapterIds)
      .eq("is_active", true);

    for (const qz of quizzes || []) {
      quizByChapter[(qz as any).chapter_id] =
        (qz as any).quiz_questions?.[0]?.count ?? 0;
    }
  }

  const enrichedChapters = chapters.map((c: any) => ({
    ...c,
    questionCount: quizByChapter[c.id] ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{module.title}</h1>
        {module.description && (
          <p className="mt-1 text-gray-500">{module.description}</p>
        )}
      </div>
      <ChapterList chapters={enrichedChapters} moduleId={module.id} />
    </div>
  );
}
