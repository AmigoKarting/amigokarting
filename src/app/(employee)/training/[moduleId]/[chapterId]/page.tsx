import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAuthEmployee } from "@/lib/supabase/middleware";
import { VideoPlayer } from "@/components/training/VideoPlayer";
import { QuizForm } from "@/components/training/QuizForm";
import { notFound } from "next/navigation";

export default async function ChapterPage({
  params,
}: {
  params: { moduleId: string; chapterId: string };
}) {
  const supabase = createServerSupabaseClient();
  const employee = await getAuthEmployee();

  const { data: chapter } = await supabase
    .from("training_chapters")
    .select("*, training_videos(*)")
    .eq("id", params.chapterId)
    .single();

  if (!chapter) notFound();

  // Récupérer la progression de l'employé
  const videoIds = chapter.training_videos?.map((v: any) => v.id) || [];
  const { data: watchLogs } = await supabase
    .from("video_watch_log")
    .select("*")
    .eq("employee_id", employee?.id)
    .in("video_id", videoIds);

  // Récupérer le quiz associé
  const { data: quiz } = await supabase
    .from("quizzes")
    .select("*, quiz_questions(*, quiz_choices(*))")
    .eq("chapter_id", params.chapterId)
    .single();

  const allVideosCompleted = chapter.training_videos?.every((v: any) =>
    watchLogs?.find((w: any) => w.video_id === v.id && w.completed)
  );

  const showQuiz = !!quiz && !!allVideosCompleted;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold">{chapter.title}</h1>

      {/* Bouton vers le quiz — début de la formation */}
      {chapter.content && showQuiz && (
        <a
          href="#quiz"
          className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
        >
          Passer directement au quiz ↓
        </a>
      )}

      {chapter.content && (
        <div className="whitespace-pre-wrap rounded-xl bg-white p-6 leading-relaxed text-gray-800 shadow-sm">
          {chapter.content}
        </div>
      )}

      {/* Bouton vers le quiz — fin de la formation */}
      {chapter.content && showQuiz && (
        <div className="flex justify-center">
          <a
            href="#quiz"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition hover:shadow-lg active:scale-[0.98]"
          >
            Faire le quiz maintenant ↓
          </a>
        </div>
      )}

      <div className="space-y-6">
        {chapter.training_videos
          ?.sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((video: any) => {
            const log = watchLogs?.find((w: any) => w.video_id === video.id);
            return (
              <div key={video.id} className="space-y-2">
                <h3 className="font-medium">{video.title}</h3>
                {video.description && (
                  <p className="text-sm text-gray-500">{video.description}</p>
                )}
                <VideoPlayer
                  videoUrl={video.video_url}
                  videoId={video.id}
                  initialProgress={log?.watched_sec || 0}
                />
              </div>
            );
          })}
      </div>

      {quiz && allVideosCompleted && (
        <div id="quiz" className="scroll-mt-24 space-y-4">
          <h2 className="text-xl font-bold">Quiz : {quiz.title}</h2>
          <QuizFormWrapper quiz={quiz} employeeId={employee?.id} />
        </div>
      )}

      {quiz && !allVideosCompleted && (
        <div className="rounded-xl bg-amber-50 p-6 text-center text-sm text-amber-800">
          Complete toutes les vidéos pour débloquer le quiz.
        </div>
      )}
    </div>
  );
}

// Client wrapper pour le QuizForm
function QuizFormWrapper({ quiz, employeeId }: { quiz: any; employeeId?: string }) {
  // Le QuizForm attend `choices` sur chaque question (la BD fournit `quiz_choices`)
  const questions = (quiz.quiz_questions || []).map((q: any) => ({
    ...q,
    choices: q.quiz_choices || [],
  }));

  return (
    <QuizForm
      quizId={quiz.id}
      quizTitle={quiz.title}
      passingScore={quiz.passing_score}
      questions={questions}
      employeeId={employeeId}
    />
  );
}
