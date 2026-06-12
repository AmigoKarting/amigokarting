import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEYS = ["reminder_enabled", "reminder_hour", "reminder_days", "fiche_reminder_day"];
const DEFAULTS: Record<string, string> = {
  reminder_enabled: "true",
  reminder_hour: "18",
  reminder_days: "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
  fiche_reminder_day: "Mon",
};
const VALID_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

async function requirePatron() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: emp } = await supabase
    .from("employees").select("role").eq("auth_user_id", user.id).single();
  if (!emp || (emp.role !== "patron" && emp.role !== "developpeur")) return null;
  return emp;
}

export async function GET() {
  if (!(await requirePatron())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const { data } = await supabaseAdmin.from("app_config").select("key, value").in("key", KEYS);
  const map = Object.fromEntries((data || []).map((r: any) => [r.key, r.value]));
  return NextResponse.json({
    enabled: (map.reminder_enabled ?? DEFAULTS.reminder_enabled) === "true",
    hour: parseInt(map.reminder_hour ?? DEFAULTS.reminder_hour, 10),
    days: (map.reminder_days ?? DEFAULTS.reminder_days).split(",").filter(Boolean),
    ficheDay: map.fiche_reminder_day ?? DEFAULTS.fiche_reminder_day,
  });
}

export async function POST(req: NextRequest) {
  if (!(await requirePatron())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const body = await req.json();

  const enabled = body.enabled ? "true" : "false";
  let hour = parseInt(String(body.hour), 10);
  if (isNaN(hour) || hour < 0 || hour > 23) hour = 18;
  const days = Array.isArray(body.days)
    ? body.days.filter((d: string) => VALID_DAYS.includes(d))
    : [];
  const ficheDay = VALID_DAYS.includes(body.ficheDay) ? body.ficheDay : "Mon";

  const rows = [
    { key: "reminder_enabled", value: enabled },
    { key: "reminder_hour", value: String(hour) },
    { key: "reminder_days", value: days.join(",") },
    { key: "fiche_reminder_day", value: ficheDay },
  ].map((r) => ({ ...r, updated_at: new Date().toISOString() }));

  const { error } = await supabaseAdmin.from("app_config").upsert(rows, { onConflict: "key" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
