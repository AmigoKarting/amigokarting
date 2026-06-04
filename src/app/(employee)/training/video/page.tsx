import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ModuleCard } from "@/components/training/ModuleCard";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function TrainingVideoPage() {
  const supabase = createServerSupabaseClient();

  const { data: modules } = await supabase
    .from("training_modules")
    .select("*, training_chapters(*, training_videos(*))")
    .eq("is_active", true)
    .neq("content_type", "text")
    .order("sort_order");

  const videoModules = modules || [];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/training"
          className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <h1 className="text-2xl font-bold">Formation vidéo</h1>
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
    </div>
  );
}
