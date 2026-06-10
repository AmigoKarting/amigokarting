import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendToEmployee } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { data: emp } = await supabase
      .from("employees").select("id, first_name").eq("auth_user_id", user.id).single();
    if (!emp) return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });

    const sent = await sendToEmployee(emp.id, {
      title: "Amigo Karting 🏁",
      body: `Tes rappels sont activés, ${emp.first_name} ! On te tient au courant 🔥`,
      url: "/dashboard",
    });

    return NextResponse.json({ sent });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
