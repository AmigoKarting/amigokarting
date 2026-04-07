import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ConversationReport } from "@/components/admin/ConversationReport";

export default async function AdminConversationsPage() {
  const supabase = createServerSupabaseClient();

  const { data: report } = await supabase
    .from("conversation_employee_report")
    .select("*")
    .order("total_seconds", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Rapport conversations IA</h1>
      <ConversationReport data={report || []} />
    </div>
  );
}
