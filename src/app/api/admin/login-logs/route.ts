import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { data: emp } = await supabase
      .from("employees").select("role").eq("auth_user_id", user.id).single();
    if (!emp || (emp.role !== "manager" && emp.role !== "patron" && emp.role !== "developpeur")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { data: logs } = await supabaseAdmin
      .from("login_logs")
      .select("id, first_name, success, ip_address, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    return NextResponse.json({ logs: logs || [] });
  } catch (err) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
