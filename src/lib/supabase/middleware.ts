import { createServerSupabaseClient } from "./server";

export async function getAuthEmployee() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  return employee;
}

export async function requireAuth() {
  const employee = await getAuthEmployee();
  if (!employee) throw new Error("Non authentifié");
  return employee;
}

export async function requireManager() {
  const employee = await requireAuth();
  if (employee.role !== "manager" && employee.role !== "patron" && employee.role !== "developpeur") throw new Error("Accès refusé");
  return employee;
}

export async function requirePatron() {
  const employee = await requireAuth();
  if (employee.role !== "patron" && employee.role !== "developpeur") throw new Error("Accès réservé au patron");
  return employee;
}