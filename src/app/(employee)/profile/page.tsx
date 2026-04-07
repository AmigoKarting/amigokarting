import { getAuthEmployee } from "@/lib/supabase/middleware";
import { ProfileForm } from "@/components/employee/ProfileForm";

export default async function ProfilePage() {
  const employee = await getAuthEmployee();
  if (!employee) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Ma fiche employé</h1>
      <ProfileForm employee={employee} />
    </div>
  );
}
