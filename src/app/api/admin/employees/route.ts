import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireManager, requirePatron } from "@/lib/supabase/middleware";

export async function GET() {
  await requireManager();

  const { data } = await supabaseAdmin
    .from("employees")
    .select("*")
    .eq("is_active", true)
    .order("last_name");

  return NextResponse.json({ employees: data || [] });
}

export async function POST(req: NextRequest) {
  try {
await requirePatron();
    const body = await req.json();
    const { action, employeeId } = body;

    // ─── Changer le rôle (employé ↔ gérant) ────────────────
    if (action === "changeRole") {
      const { newRole } = body;

      if (!["employee", "manager", "patron"].includes(newRole)) {
        return NextResponse.json({ error: "Rôle invalide." }, { status: 400 });
      }

      // Seul un patron peut rendre quelqu'un patron
      const requester = await supabaseAdmin
        .from("employees")
        .select("role")
        .eq("auth_user_id", (await supabaseAdmin.auth.admin.listUsers()).data.users.find(() => true)?.id)
        .single();

      // Empêcher de modifier le rôle du patron (sauf par lui-même via SQL)
      const { data: target } = await supabaseAdmin
        .from("employees")
        .select("role")
        .eq("id", employeeId)
        .single();

      if (target?.role === "patron") {
        return NextResponse.json({ error: "Le rôle du patron ne peut pas être modifié ici." }, { status: 403 });
      }

      // Vérifier qu'on ne retire pas le dernier gérant/patron
      if (newRole === "employee") {
        const { count } = await supabaseAdmin
          .from("employees")
          .select("*", { count: "exact", head: true })
          .in("role", ["manager", "patron"])
          .eq("is_active", true);

        if ((count || 0) <= 1) {
          return NextResponse.json(
            { error: "Impossible : il doit rester au moins un gérant actif." },
            { status: 400 }
          );
        }
      }

      const { error } = await supabaseAdmin
        .from("employees")
        .update({ role: newRole })
        .eq("id", employeeId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, newRole });
    }

    // ─── Désactiver un employé ─────────────────────────────
    if (action === "deactivate") {
      // Vérifier qu'on ne désactive pas le dernier gérant
      const { data: emp } = await supabaseAdmin
        .from("employees")
        .select("role")
        .eq("id", employeeId)
        .single();

      if (emp?.role === "manager") {
        const { count } = await supabaseAdmin
          .from("employees")
          .select("*", { count: "exact", head: true })
          .eq("role", "manager")
          .eq("is_active", true);

        if ((count || 0) <= 1) {
          return NextResponse.json(
            { error: "Impossible : il doit rester au moins un gérant actif." },
            { status: 400 }
          );
        }
      }

      const { error } = await supabaseAdmin
        .from("employees")
        .update({ is_active: false })
        .eq("id", employeeId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // ─── Réactiver un employé ──────────────────────────────
    if (action === "reactivate") {
      const { error } = await supabaseAdmin
        .from("employees")
        .update({ is_active: true })
        .eq("id", employeeId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (err) {
    console.error("Erreur API admin employees:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
