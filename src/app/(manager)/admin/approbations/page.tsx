import { getAuthEmployee } from "@/lib/supabase/middleware";
import { ApprovalsManager } from "@/components/admin/ApprovalsManager";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const me: any = await getAuthEmployee();
  const canApprove = me?.role === "patron" || me?.role === "developpeur";

  if (!canApprove) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-10 text-center shadow-sm">
        <p className="text-4xl">🔒</p>
        <p className="mt-3 font-semibold text-gray-800">Accès réservé</p>
        <p className="mt-1 text-sm text-gray-500">
          Seuls le patron et le développeur peuvent approuver les nouveaux comptes.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Approbations des comptes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Accepte ou refuse les nouveaux employés qui se sont inscrits. Tant qu'un compte n'est
          pas accepté, la personne ne peut pas entrer dans l'app.
        </p>
      </div>
      <ApprovalsManager />
    </div>
  );
}
