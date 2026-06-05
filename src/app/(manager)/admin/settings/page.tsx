import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsClient } from "./SettingsClient";

// Page réservée au patron et au développeur. Un gérant est redirigé.
export default async function SettingsPage() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: employee } = await supabase
    .from("employees")
    .select("role")
    .eq("auth_user_id", user.id)
    .single();

  if (employee?.role !== "patron" && employee?.role !== "developpeur") {
    redirect("/admin");
  }

  return <SettingsClient />;
}
