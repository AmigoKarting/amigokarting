import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ChapterList } from "@/components/training/ChapterList";
import { notFound } from "next/navigation";

export default async function ModulePage({ params }: { params: { moduleId: string } }) {
  const supabase = createServerSupabaseClient();

  const { data: module } = await supabase
    .from("training_modules")
    .select("*, training_chapters(*, training_videos(count))")
    .eq("id", params.moduleId)
    .single();

  if (!module) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{module.title}</h1>
        {module.description && (
          <p className="mt-1 text-gray-500">{module.description}</p>
        )}
      </div>
      <ChapterList chapters={module.training_chapters || []} moduleId={module.id} />
    </div>
  );
}
