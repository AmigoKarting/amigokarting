import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendToEmployee } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Messages de rappel variés — invitent à venir faire une activité.
const MESSAGES: { title: string; body: string; url: string }[] = [
  { title: "Ta question du jour t'attend", body: "2 minutes pour rester au top — on y va ?", url: "/dashboard" },
  { title: "Un petit quiz aujourd'hui ?", body: "Quelques questions pour progresser sur ton poste.", url: "/training" },
  { title: "Garde ta série", body: "Fais une activité aujourd'hui pour ne pas la perdre.", url: "/training" },
  { title: "Révise tes erreurs", body: "Refais les questions que tu rates encore — ça paie vite.", url: "/revoir" },
  { title: "Quelques fiches mémo ?", body: "Une révision express avant ton prochain quart.", url: "/fiches" },
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Rappel quotidien (cron Vercel) : prévient les abonnés qui n'ont rien fait
// aujourd'hui, avec un message qui varie selon l'employé et le jour.
// La déduplication (last_reminded_at) empêche tout envoi multiple le même jour.
async function markReminded(employeeId: string) {
  await supabaseAdmin
    .from("push_subscriptions")
    .update({ last_reminded_at: new Date().toISOString() })
    .eq("employee_id", employeeId);
}

// Réglages configurables depuis Paramètres (app_config).
async function getConfig() {
  const { data } = await supabaseAdmin
    .from("app_config")
    .select("key, value")
    .in("key", ["reminder_enabled", "reminder_hour", "reminder_days", "fiche_reminder_day"]);
  const m = Object.fromEntries((data || []).map((r: any) => [r.key, r.value]));
  return {
    enabled: (m.reminder_enabled ?? "true") === "true",
    hour: parseInt(m.reminder_hour ?? "18", 10),
    days: (m.reminder_days ?? "Mon,Tue,Wed,Thu,Fri,Sat,Sun").split(",").filter(Boolean),
    ficheDay: m.fiche_reminder_day ?? "Mon",
  };
}

export async function GET() {
  try {
    const cfg = await getConfig();
    if (!cfg.enabled) return NextResponse.json({ skipped: "disabled" });

    const tz = "America/Toronto";
    const torontoHour = parseInt(
      new Date().toLocaleString("en-US", { timeZone: tz, hour: "2-digit", hour12: false }),
      10
    );
    const weekday = new Date().toLocaleDateString("en-US", { timeZone: tz, weekday: "short" });

    // Pas encore l'heure d'envoi (la dédup last_reminded_at évite tout doublon
    // si le cron tourne aussi aux heures suivantes).
    if (isNaN(torontoHour) || torontoHour < cfg.hour) {
      return NextResponse.json({ skipped: "not yet", torontoHour });
    }

    let pushes = 0;

    // Rappel « complète ta fiche » — le jour configuré.
    if (weekday === cfg.ficheDay) {
      const { data: fiche } = await supabaseAdmin.rpc("fiche_reminder_targets");
      for (const t of (fiche || []) as { employee_id: string }[]) {
        const n = await sendToEmployee(t.employee_id, {
          title: "Complète ta fiche",
          body: "Il manque des infos sur ta fiche (téléphone, contact d'urgence…). Ça prend 1 minute.",
          url: "/profile",
        });
        if (n > 0) { await markReminded(t.employee_id); pushes += n; }
      }
    }

    // Rappel d'activité — les jours configurés.
    if (cfg.days.includes(weekday)) {
      const { data: targets } = await supabaseAdmin.rpc("push_reminder_targets");
      const dayNumber = Math.floor(Date.now() / 86_400_000);
      for (const t of (targets || []) as { employee_id: string }[]) {
        const msg = MESSAGES[(hash(t.employee_id) + dayNumber) % MESSAGES.length];
        const n = await sendToEmployee(t.employee_id, msg);
        if (n > 0) { await markReminded(t.employee_id); pushes += n; }
      }
    }

    return NextResponse.json({ pushes, torontoHour, weekday });
  } catch (err) {
    console.error("Erreur cron reminders:", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
