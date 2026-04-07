import { getAuthEmployee } from "@/lib/supabase/middleware";
import { ProfileForm } from "@/components/employee/ProfileForm";

export default async function ManagerProfilePage() {
  const employee = await getAuthEmployee();
  if (!employee) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Ma fiche</h1>
      <p className="text-sm text-gray-500">
        Remplis tes informations personnelles.
      </p>
      <ProfileForm employee={employee} />
    </div>
  );
}
