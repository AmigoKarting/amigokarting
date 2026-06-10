import { getAuthEmployee } from "@/lib/supabase/middleware";
import { ApprovalsManager } from "@/components/admin/ApprovalsManager";
import { Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const me: any = await getAuthEmployee();
  const canApprove = me?.role === "patron" || me?.role === "developpeur";

  if (!canApprove) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
          <Lock className="h-5 w-5" strokeWidth={2} />
        </span>
        <p className="mt-3 font-semibold text-gray-900">Accès réservé</p>
        <p className="mt-1 text-sm text-gray-500">
          Seuls le patron et le développeur peuvent approuver les nouveaux comptes.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Approbations des comptes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Accepte ou refuse les nouveaux employés qui se sont inscrits. Tant qu'un compte n'est
          pas accepté, la personne ne peut pas entrer dans l'app.
        </p>
      </div>
      <ApprovalsManager />
    </div>
  );
}
