import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendToEmployee } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Rappel quotidien (déclenché par le cron Vercel) : prévient les employés
// dont la série est en danger (dernière activité = hier) pour qu'ils reviennent.
// La déduplication (last_reminded_at) empêche tout envoi multiple le même jour.
export async function GET() {
  try {
    const { data: targets } = await supabaseAdmin.rpc("push_reminder_targets");
    let pushes = 0;
    for (const t of (targets || []) as { employee_id: string }[]) {
      const n = await sendToEmployee(t.employee_id, {
        title: "🔥 Ta série t'attend !",
        body: "Reviens faire une activité aujourd'hui pour garder ta série de jours.",
        url: "/training",
      });
      if (n > 0) {
        await supabaseAdmin
          .from("push_subscriptions")
          .update({ last_reminded_at: new Date().toISOString() })
          .eq("employee_id", t.employee_id);
        pushes += n;
      }
    }
    return NextResponse.json({ reminded: (targets || []).length, pushes });
  } catch (err) {
    console.error("Erreur cron reminders:", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
