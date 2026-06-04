import Link from "next/link";
import { FileText, Video, ChevronRight } from "lucide-react";

interface Chapter {
  id: string;
  title: string;
  sort_order: number;
  training_videos?: any;
  questionCount?: number;
}

export function ChapterList({ chapters, moduleId }: { chapters: Chapter[]; moduleId: string }) {
  const sorted = [...chapters].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-3">
      {sorted.map((ch, i) => {
        const videoCount = ch.training_videos?.[0]?.count ?? 0;
        const questionCount = ch.questionCount ?? 0;
        const isQuiz = questionCount > 0 && videoCount === 0;

        return (
          <Link key={ch.id} href={`/training/${moduleId}/${ch.id}`}>
            <div className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                {isQuiz ? <FileText className="h-5 w-5" /> : <Video className="h-5 w-5" />}
              </span>
              <div className="flex-1">
                <h3 className="font-medium">{ch.title}</h3>
                <p className="text-xs text-gray-400">
                  {isQuiz
                    ? `Quiz · ${questionCount} question${questionCount > 1 ? "s" : ""}`
                    : `${videoCount} vidéo${videoCount > 1 ? "s" : ""}`}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
