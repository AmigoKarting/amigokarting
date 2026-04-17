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

    // Alertes
    const { data: alerts } = await supabaseAdmin
      .from("manager_alerts")
      .select("id, employee_id, alert_type, title, message, is_read, created_at, employees(first_name, last_name)")
      .order("created_at", { ascending: false })
      .limit(50);

    // Vérifier les employés inactifs et créer des alertes
    const { data: allEmployees } = await supabaseAdmin
      .from("employees")
      .select("id, first_name, role")
      .eq("is_active", true)
      .in("role", ["employee", "manager"]);

    for (const e of (allEmployees || [])) {
      const { data: activity } = await supabaseAdmin
        .from("employee_activity")
        .select("updated_at")
        .eq("employee_id", e.id)
        .single();

      if (activity?.updated_at) {
        const days = Math.floor((Date.now() - new Date(activity.updated_at).getTime()) / (1000 * 60 * 60 * 24));
        if (days >= 7) {
          // Vérifier si on a déjà alerté cette semaine
          const { count } = await supabaseAdmin
            .from("manager_alerts")
            .select("*", { count: "exact", head: true })
            .eq("employee_id", e.id)
            .eq("alert_type", "inactive")
            .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

          if (!count || count === 0) {
            await supabaseAdmin.from("manager_alerts").insert({
              employee_id: e.id,
              alert_type: "inactive",
              title: `${e.first_name} est inactif depuis ${days} jours`,
              message: `Aucune activité de formation depuis ${days} jours.`,
            });
          }
        }
      }
    }

    // Évolution des scores
    const { data: employees } = await supabaseAdmin
      .from("employees")
      .select("id, first_name, last_name")
      .eq("is_active", true)
      .in("role", ["employee", "manager"]);

    const evolutions = [];
    for (const e of (employees || [])) {
      const { data: gs } = await supabaseAdmin
        .from("employee_global_score")
        .select("global_score")
        .eq("employee_id", e.id)
        .single();

      const { data: history } = await supabaseAdmin
        .from("score_history")
        .select("global_score, recorded_at")
        .eq("employee_id", e.id)
        .order("recorded_at", { ascending: true })
        .limit(30);

      const current = Math.round(gs?.global_score || 0);
      const historyPoints = (history || []).map((h: any) => ({
        date: h.recorded_at,
        score: h.global_score,
      }));

      const firstScore = historyPoints.length > 0 ? historyPoints[0].score : current;
      const trend = current > firstScore ? "up" : current < firstScore ? "down" : "stable";

      evolutions.push({
        name: `${e.first_name} ${e.last_name || ""}`.trim(),
        current,
        level: current >= 85 ? "Diamant" : current >= 65 ? "Or" : current >= 40 ? "Argent" : "Bronze",
        history: historyPoints,
        trend,
      });
    }

    // Trier par score croissant (les pires en premier)
    evolutions.sort((a, b) => a.current - b.current);

    // Re-fetch alerts après la génération
    const { data: finalAlerts } = await supabaseAdmin
      .from("manager_alerts")
      .select("id, employee_id, alert_type, title, message, is_read, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    return NextResponse.json({ alerts: finalAlerts || [], evolutions });
  } catch (err) {
    console.error("Alerts error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await req.json();

    if (body.action === "markRead") {
      await supabaseAdmin
        .from("manager_alerts")
        .update({ is_read: true })
        .eq("id", body.alertId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
