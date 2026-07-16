import Link from "next/link";
import type { TrainingModule } from "@/types/training";

export function ModuleCard({ module }: { module: TrainingModule }) {
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
      </div>
    </Link>
  );
}
