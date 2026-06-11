import { getAuthEmployee } from "@/lib/supabase/middleware";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { roleKbCategory } from "@/lib/roles";
import { AideMemoire } from "@/components/training/AideMemoire";

export const dynamic = "force-dynamic";

export default async function AideMemoirePage() {
  const emp: any = await getAuthEmployee();
  if (!emp) return null;

  const onlyKb = roleKbCategory(emp.role);

  let docs: { id: string; title: string; content: string; category: string }[] = [];
  try {
    let q = supabaseAdmin
      .from("knowledge_documents")
      .select("id, title, content, category")
      .order("category")
      .order("title");
    if (onlyKb) q = q.eq("category", onlyKb);
    const { data } = await q;
    docs = (data as any) || [];
  } catch {
    docs = [];
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-5 lg:max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Aide-mémoire</h1>
        <p className="mt-1 text-sm text-gray-500">
          Retrouve une info en quelques secondes : prix, codes, procédures clés.
        </p>
      </div>

      <AideMemoire docs={docs} locked={!!onlyKb} />
    </div>
  );
}
