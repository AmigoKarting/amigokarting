import { createServerSupabaseClient } from "@/lib/supabase/server";
import { QuestionManager } from "@/components/admin/QuestionManager";

export default async function QuestionsPage() {
  const supabase = createServerSupabaseClient();

  const { data: questions } = await supabase
    .from("conversation_questions")
    .select("*")
    .order("is_priority", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Questions pour les conversations</h1>
      <p className="text-sm text-gray-500">
        Gérez les questions posées par l'IA. Marquez les prioritaires pour qu'elles soient posées en premier.
      </p>
      <QuestionManager questions={questions || []} />
    </div>
  );
}
