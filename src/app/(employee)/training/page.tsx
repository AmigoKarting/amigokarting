import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ModuleCard } from "@/components/training/ModuleCard";
import { FileText, Video } from "lucide-react";

export default async function TrainingPage() {
  const supabase = createServerSupabaseClient();

  const { data: modules } = await supabase
    .from("training_modules")
    .select("*, training_chapters(*, training_videos(*))")
    .eq("is_active", true)
    .order("sort_order");

  const textModules = modules?.filter((m) => m.content_type === "text") || [];
  const videoModules = modules?.filter((m) => m.content_type !== "text") || [];

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold">Formation</h1>

      {/* ─── Formation écrite ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-orange-500" />
          <h2 className="text-lg font-semibold">Formation écrite</h2>
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
      </section>

      {/* ─── Formation vidéo ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
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
