import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAuthEmployee } from "@/lib/supabase/middleware";
import { roleCategory } from "@/lib/roles";
import { ModuleCard } from "@/components/training/ModuleCard";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function TrainingVideoPage() {
  const supabase = createServerSupabaseClient();
  const me: any = await getAuthEmployee();
  // Formation ciblée (comme la formation texte) : un rôle « caisse »/« piste »
  // ne voit que les vidéos de sa catégorie ; gérant/patron/dev voient tout.
  const onlyCategory = roleCategory(me?.role);

  const { data: modules } = await supabase
    .from("training_modules")
    .select("*, training_chapters(*, training_videos(*))")
    .eq("is_active", true)
    .neq("content_type", "text")
    .order("sort_order");

  const videoModules = (modules || []).filter(
    (m: any) => !onlyCategory || m.category === onlyCategory
  );

  // Progression de l'employé : vidéos complétées + où il est rendu.
  const { data: logs } = await supabase
    .from("video_watch_log")
    .select("video_id, completed, watched_sec, max_position, updated_at")
    .eq("employee_id", me?.id);

  function progressFor(mod: any) {
    const videos = (mod.training_chapters || []).flatMap(
      (ch: any) => ch.training_videos || []
    );
    if (videos.length === 0) return undefined;
    const byId = new Map((logs || []).map((l: any) => [l.video_id, l]));
    const done = videos.filter((v: any) => byId.get(v.id)?.completed).length;
    // La vidéo en cours la plus récente (pas terminée, mais commencée)
    const started = videos
      .map((v: any) => ({ v, log: byId.get(v.id) }))
      .filter(
        (x: any) =>
          x.log && !x.log.completed &&
          Math.max(x.log.max_position || 0, x.log.watched_sec || 0) > 0
      )
      .sort(
        (a: any, b: any) =>
          new Date(b.log.updated_at).getTime() - new Date(a.log.updated_at).getTime()
      )[0];
    let resume: string | undefined;
    if (started) {
      const sec = Math.max(started.log.max_position || 0, started.log.watched_sec || 0);
      const partie = started.v.title.includes("—")
        ? started.v.title.split("—").pop()!.trim()
        : started.v.title;
      resume = `${partie} · rendu à ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
    }
    return { done, total: videos.length, resume };
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/training"
          className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} /> Retour
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Formation vidéo</h1>
      </div>

      {videoModules.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {videoModules.map((module: any) => (
            <ModuleCard key={module.id} module={module} progress={progressFor(module)} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Aucune formation vidéo pour le moment.
        </p>
      )}
    </div>
  );
}
