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
export async function GET() {
  try {
    const { data: targets } = await supabaseAdmin.rpc("push_reminder_targets");
    const dayNumber = Math.floor(Date.now() / 86_400_000);
    let pushes = 0;
    for (const t of (targets || []) as { employee_id: string }[]) {
      const msg = MESSAGES[(hash(t.employee_id) + dayNumber) % MESSAGES.length];
      const n = await sendToEmployee(t.employee_id, msg);
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
