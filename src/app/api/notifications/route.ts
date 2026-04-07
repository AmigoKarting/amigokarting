import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendSMS, buildAgendrixReminder } from "@/lib/notifications/sms";

// Appelé par un cron (Supabase Edge Function ou Vercel Cron)
export async function POST(req: NextRequest) {
  const { secret, type, startDate, endDate } = await req.json();

  // Vérifier le secret pour les appels cron
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (type === "agendrix_reminder") {
    const { data: employees } = await supabaseAdmin
      .from("employees")
      .select("id, phone")
      .eq("is_active", true)
      .not("phone", "is", null);

    const message = buildAgendrixReminder(startDate, endDate);
    let sent = 0;

    for (const emp of employees || []) {
      if (emp.phone) {
        try {
          await sendSMS(emp.phone, message);
          await supabaseAdmin.from("notifications").insert({
            employee_id: emp.id,
            type: "agendrix_reminder",
            message,
            sent_at: new Date().toISOString(),
          });
          sent++;
        } catch (err) {
          console.error(`SMS échoué pour ${emp.id}:`, err);
        }
      }
    }

    return NextResponse.json({ success: true, sent });
  }

  return NextResponse.json({ error: "Type inconnu" }, { status: 400 });
}
