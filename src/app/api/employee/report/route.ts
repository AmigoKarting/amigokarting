import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendToEmployee } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  kart: "Kart en panne",
  equipement: "Équipement",
  securite: "Sécurité / incident",
  caisse: "Caisse",
  autre: "Autre",
};

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { data: emp } = await supabase
      .from("employees")
      .select("id, first_name")
      .eq("auth_user_id", user.id)
      .single();
    if (!emp) return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });

    const body = await req.json();
    const type = String(body.type || "autre");
    const location = String(body.location || "").trim().slice(0, 80);
    const description = String(body.description || "").trim().slice(0, 600);
    if (!description) return NextResponse.json({ error: "Décris le problème." }, { status: 400 });

    const typeLabel = TYPE_LABELS[type] || "Signalement";
    const title = location ? `${typeLabel} — ${location}` : typeLabel;
    const message = `${description}\n— Signalé par ${emp.first_name}`;

    await supabaseAdmin.from("manager_alerts").insert({
      employee_id: emp.id,
      alert_type: "report",
      title,
      message,
    });

    // Notifier tout de suite les gérants / patron / dev abonnés
    try {
      const { data: staff } = await supabaseAdmin
        .from("employees")
        .select("id")
        .eq("is_active", true)
        .in("role", ["manager", "patron", "developpeur"]);
      const short = description.length > 90 ? description.slice(0, 90) + "…" : description;
      await Promise.all(
        (staff || []).map((s: any) =>
          sendToEmployee(s.id, {
            title: `Signalement : ${typeLabel}`,
            body: `${short} — ${emp.first_name}`,
            url: "/admin/alerts",
          })
        )
      );
    } catch {}

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erreur report:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
