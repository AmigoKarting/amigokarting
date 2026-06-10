import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Configuration des notifications push. Les clés VAPID sont stockées en base
// (table app_config) pour éviter de gérer des variables d'environnement.

let configured = false;

async function ensureConfigured(): Promise<boolean> {
  if (configured) return true;
  const { data } = await supabaseAdmin
    .from("app_config")
    .select("key, value")
    .in("key", ["vapid_public", "vapid_private", "vapid_subject"]);
  const map = Object.fromEntries((data || []).map((r: any) => [r.key, r.value]));
  if (!map.vapid_public || !map.vapid_private) return false;
  webpush.setVapidDetails(
    map.vapid_subject || "mailto:info@complexeamigo.com",
    map.vapid_public,
    map.vapid_private
  );
  configured = true;
  return true;
}

export async function getPublicKey(): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("app_config")
    .select("value")
    .eq("key", "vapid_public")
    .single();
  return data?.value || null;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

// Envoie une notification à tous les appareils d'un employé. Nettoie les
// abonnements expirés (404/410). Retourne le nombre d'envois réussis.
export async function sendToEmployee(employeeId: string, payload: PushPayload): Promise<number> {
  if (!(await ensureConfigured())) return 0;
  const { data: subs } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("employee_id", employeeId);

  let sent = 0;
  for (const s of subs || []) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload)
      );
      sent++;
    } catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) {
        await supabaseAdmin.from("push_subscriptions").delete().eq("id", s.id);
      }
    }
  }
  return sent;
}
