import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, phone } = await req.json();

    // ─── Validation ────────────────────────────────────────
    if (!firstName || firstName.trim().length < 2) {
      return NextResponse.json({ error: "Le prénom doit contenir au moins 2 lettres." }, { status: 400 });
    }
    if (!lastName || lastName.trim().length < 2) {
      return NextResponse.json({ error: "Le nom doit contenir au moins 2 lettres." }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ error: "Le numéro de téléphone est requis." }, { status: 400 });
    }

    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      return NextResponse.json({ error: "Le numéro doit contenir 10 chiffres." }, { status: 400 });
    }

    const phoneLast4 = digits.slice(-4);
    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();

    // ─── Vérifier si l'employé existe déjà ─────────────────
    const { data: existing } = await supabaseAdmin
      .from("employees")
      .select("id")
      .ilike("first_name", cleanFirst)
      .eq("phone_last4", phoneLast4)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Un employé avec ce prénom et ce code existe déjà. Utilise la connexion." },
        { status: 409 }
      );
    }

    // ─── Créer l'employé dans la table ─────────────────────
    const { data: employee, error: insertError } = await supabaseAdmin
      .from("employees")
      .insert({
        first_name: cleanFirst,
        last_name: cleanLast,
        phone: phone.trim(),
        phone_last4: phoneLast4,
        role: "employee",
      })
      .select("id, first_name, last_name")
      .single();

    if (insertError) {
      console.error("Erreur création employé:", insertError);
      return NextResponse.json(
        { error: "Erreur lors de la création du compte. Réessaie." },
        { status: 500 }
      );
    }

    // ─── Créer le compte Supabase Auth ─────────────────────
    const shortId = employee.id.split("-")[0];
    const email = `${cleanFirst.toLowerCase()}.${shortId}@amigo.local`;

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: phoneLast4,
      email_confirm: true,
      user_metadata: {
        first_name: cleanFirst,
        last_name: cleanLast,
        employee_id: employee.id,
        role: "employee",
      },
    });

    if (authError) {
      console.error("Erreur auth:", authError);
      // Supprimer l'employé créé si l'auth échoue
      await supabaseAdmin.from("employees").delete().eq("id", employee.id);
      return NextResponse.json(
        { error: "Erreur lors de la création du compte. Réessaie." },
        { status: 500 }
      );
    }

    // Lier l'auth user à l'employé
    await supabaseAdmin
      .from("employees")
      .update({ auth_user_id: authUser.user.id })
      .eq("id", employee.id);

    return NextResponse.json({
      success: true,
      employee: {
        id: employee.id,
        firstName: employee.first_name,
        lastName: employee.last_name,
      },
      email,
      password: phoneLast4,
    });
  } catch (err) {
    console.error("Erreur register:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
