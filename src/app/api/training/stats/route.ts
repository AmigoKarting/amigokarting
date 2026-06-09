import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Stats de gamification (points, rang, série quotidienne, badges, classement).
// Tout est calculé à partir des tentatives de quiz via la fonction SQL training_stats.
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { data: employee } = await supabase
      .from("employees")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    if (!employee) return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });

    const { data, error } = await supabaseAdmin.rpc("training_stats", { p_emp: employee.id });
    if (error) {
      console.error("training_stats error:", error);
      return NextResponse.json({ error: "Erreur stats" }, { status: 500 });
    }

    return NextResponse.json(data || {});
  } catch (err) {
    console.error("Erreur API stats:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
