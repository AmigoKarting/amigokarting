import Link from "next/link";

interface Chapter {
  id: string;
  title: string;
  sort_order: number;
  training_videos?: any;
}

export function ChapterList({ chapters, moduleId }: { chapters: Chapter[]; moduleId: string }) {
  const sorted = [...chapters].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-3">
      {sorted.map((ch, i) => (
        <Link key={ch.id} href={`/training/${moduleId}/${ch.id}`}>
          <div className="rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                {i + 1}
              </span>
              <div>
                <h3 className="font-medium">{ch.title}</h3>
                <p className="text-xs text-gray-400">
                  {ch.training_videos?.length || 0} vidéo(s)
                </p>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
