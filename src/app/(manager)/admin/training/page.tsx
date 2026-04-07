import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TrainingProgress } from "@/components/admin/TrainingProgress";

export default async function AdminTrainingPage() {
  const supabase = createServerSupabaseClient();

  const { data: employees } = await supabase
    .from("employees")
    .select("id, first_name, last_name")
    .eq("is_active", true)
    .eq("role", "employee");

  const { data: modules } = await supabase
    .from("training_modules")
    .select("id, title, training_chapters(id, training_videos(id))")
    .eq("is_active", true)
    .order("sort_order");

  const { data: watchLogs } = await supabase
    .from("video_watch_log")
    .select("employee_id, video_id, completed");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Suivi de formation</h1>
      <TrainingProgress
        employees={employees || []}
        modules={modules || []}
        watchLogs={watchLogs || []}
      />
    </div>
  );
}
