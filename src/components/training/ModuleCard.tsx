import Link from "next/link";
import type { TrainingModule } from "@/types/training";

type ModuleProgress = { done: number; total: number; resume?: string };

export function ModuleCard({
  module,
  progress,
}: {
  module: TrainingModule;
  progress?: ModuleProgress;
}) {
  // La requête Supabase renvoie `training_chapters`/`training_videos` —
  // on gère les deux formes pour que les compteurs soient justes.
  const chapters: any[] = (module as any).training_chapters ?? module.chapters ?? [];
  const chapterCount = chapters.length;
  const isText = module.content_type === "text";
  const videoCount = chapters.reduce(
    (acc: number, ch: any) => acc + ((ch.training_videos ?? ch.videos)?.length || 0),
    0
  );

  return (
    <Link href={`/training/${module.id}`}>
      <div className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md">
        <h3 className="font-semibold text-gray-900">{module.title}</h3>
        {module.description && (
          <p className="mt-1 text-sm text-gray-500">{module.description}</p>
        )}
        <div className="mt-4 flex gap-4 text-xs text-gray-400">
          <span>{chapterCount} chapitre{chapterCount > 1 ? "s" : ""}</span>
          {isText ? (
            <span>Lecture</span>
          ) : (
            <span>{videoCount} vidéo{videoCount > 1 ? "s" : ""}</span>
          )}
        </div>

        {/* Progression de l'employé : complétées + où il est rendu */}
        {progress && progress.total > 0 && (
          <div className="mt-3">
            <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
              <span className={`font-medium ${progress.done === progress.total ? "text-green-600" : "text-gray-600"}`}>
                {progress.done === progress.total
                  ? "Toutes les vidéos complétées"
                  : `${progress.done}/${progress.total} vidéo${progress.total > 1 ? "s" : ""} complétée${progress.total > 1 ? "s" : ""}`}
              </span>
              {progress.resume && (
                <span className="font-medium text-brand-600">{progress.resume}</span>
              )}
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full ${progress.done === progress.total ? "bg-green-500" : "bg-brand-600"}`}
                style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
