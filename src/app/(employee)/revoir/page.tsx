import { getAuthEmployee } from "@/lib/supabase/middleware";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { roleCategory } from "@/lib/roles";
import { MistakesReview } from "@/components/training/MistakesReview";

export const dynamic = "force-dynamic";

interface Mistake {
  question_id: string;
  question: string;
  correct: string;
  explanation: string;
  category: string;
  module_title: string;
}

export default async function RevoirPage() {
  const emp: any = await getAuthEmployee();
  if (!emp) return null;

  let items: Mistake[] = [];
  try {
    const { data } = await supabaseAdmin.rpc("employee_mistakes", { p_emp: emp.id });
    items = (data as Mistake[]) || [];
  } catch {
    items = [];
  }

  const cat = roleCategory(emp.role);
  if (cat) {
    items = items.filter((row) => row.category === cat);
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-5 lg:max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">À revoir</h1>
        <p className="mt-1 text-sm text-gray-500">
          Refais les questions que tu rates encore, jusqu&apos;à les maîtriser.
        </p>
      </div>

      <MistakesReview items={items} />
    </div>
  );
}
