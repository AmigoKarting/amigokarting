import Link from "next/link";
import type { TrainingModule } from "@/types/training";

export function ModuleCard({ module }: { module: TrainingModule }) {
  const chapterCount = module.chapters?.length || 0;
  const videoCount = module.chapters?.reduce(
    (acc, ch) => acc + (ch.videos?.length || 0), 0
  ) || 0;

  return (
    <Link href={`/training/${module.id}`}>
      <div className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md">
        <h3 className="font-semibold text-gray-900">{module.title}</h3>
        {module.description && (
          <p className="mt-1 text-sm text-gray-500">{module.description}</p>
        )}
        <div className="mt-4 flex gap-4 text-xs text-gray-400">
          <span>{chapterCount} chapitre{chapterCount > 1 ? "s" : ""}</span>
          <span>{videoCount} vidéo{videoCount > 1 ? "s" : ""}</span>
        </div>
      </div>
    </Link>
  );
}
