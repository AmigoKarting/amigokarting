import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await req.json();
    const { action } = body;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { data: employee } = await supabaseAdmin
      .from("employees")
      .select("id, role")
      .eq("auth_user_id", user.id)
      .single();

    if (!employee) return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });

    // ─── Récupérer les annonces actives ────────────────────
    if (action === "list") {
      const { data: announcements } = await supabaseAdmin
        .from("announcements")
        .select("*, employees!author_id(first_name, last_name, role)")
        .eq("is_active", true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order("created_at", { ascending: false });

      // Récupérer les annonces lues par cet employé
      const { data: reads } = await supabaseAdmin
        .from("announcement_reads")
        .select("announcement_id")
        .eq("employee_id", employee.id);

      const readIds = new Set(reads?.map((r) => r.announcement_id) || []);

      const withReadStatus = (announcements || []).map((a: any) => ({
        ...a,
        isRead: readIds.has(a.id),
        authorName: `${a.employees?.first_name} ${a.employees?.last_name}`,
        authorRole: a.employees?.role,
      }));

      return NextResponse.json({ announcements: withReadStatus });
    }

    // ─── Marquer comme lu ──────────────────────────────────
    if (action === "markRead") {
      const { announcementId } = body;

      await supabaseAdmin
        .from("announcement_reads")
        .upsert({
          announcement_id: announcementId,
          employee_id: employee.id,
        }, { onConflict: "announcement_id,employee_id" });

      return NextResponse.json({ success: true });
    }

    // ─── Créer une annonce (gérant/patron seulement) ───────
    if (action === "create") {
      if (employee.role !== "manager" && employee.role !== "patron") {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }

      const { title, content, priority, expiresAt } = body;

      if (!title?.trim() || !content?.trim()) {
        return NextResponse.json({ error: "Titre et contenu requis" }, { status: 400 });
      }

      const { data: announcement, error } = await supabaseAdmin
        .from("announcements")
        .insert({
          author_id: employee.id,
          title: title.trim(),
          content: content.trim(),
          priority: priority || "normal",
          expires_at: expiresAt || null,
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      return NextResponse.json({ success: true, announcement });
    }

    // ─── Supprimer une annonce (gérant/patron) ─────────────
    if (action === "delete") {
      if (employee.role !== "manager" && employee.role !== "patron") {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }

      const { announcementId } = body;

      await supabaseAdmin
        .from("announcements")
        .update({ is_active: false })
        .eq("id", announcementId);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (err) {
    console.error("Erreur API annonces:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
