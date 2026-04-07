import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ModuleCard } from "@/components/training/ModuleCard";

export default async function TrainingPage() {
  const supabase = createServerSupabaseClient();

  const { data: modules } = await supabase
    .from("training_modules")
    .select("*, training_chapters(*, training_videos(*))")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Formation</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {modules?.map((module) => (
          <ModuleCard key={module.id} module={module} />
        ))}
      </div>
    </div>
  );
}
