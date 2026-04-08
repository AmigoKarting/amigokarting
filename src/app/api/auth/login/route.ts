import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Client admin (service_role) pour créer des utilisateurs auth
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const { firstName, pin } = await req.json();

    // ─── Validation ────────────────────────────────────────────
    if (!firstName || typeof firstName !== "string" || firstName.trim().length < 2) {
      return NextResponse.json(
        { error: "Le prénom doit contenir au moins 2 caractères." },
        { status: 400 }
      );
    }

    if (!pin || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: "Le code doit contenir exactement 4 chiffres." },
        { status: 400 }
      );
    }

    const normalizedName = firstName.trim().toLowerCase();

    // ─── Étape 1 : Chercher l'employé dans la table employees ──
    const { data: employee, error: lookupError } = await supabaseAdmin
      .from("employees")
      .select("id, first_name, last_name, phone_last4, role, is_active, auth_user_id")
      .ilike("first_name", normalizedName)
      .eq("phone_last4", pin)
      .single();

    if (lookupError || !employee) {
      return NextResponse.json(
        { error: "Identifiant ou code incorrect." },
        { status: 401 }
      );
    }

    if (!employee.is_active) {
      return NextResponse.json(
        { error: "Ton compte est en attente d'approbation par ton gestionnaire." },
        { status: 403 }
      );
    }

    // ─── Étape 2 : Construire l'email fictif ───────────────────
    // Format : prenom.id-court@amigo.local
    // On utilise les 8 premiers chars de l'UUID pour éviter les collisions
    // si deux employés ont le même prénom
    const shortId = employee.id.split("-")[0];
    const email = `${normalizedName}.${shortId}@amigo.local`;
    const password = pin; // 4 derniers chiffres du téléphone

    // ─── Étape 3 : Créer ou récupérer l'utilisateur auth ──────
    let authUserId = employee.auth_user_id;

    if (!authUserId) {
      // Première connexion : créer l'utilisateur dans Supabase Auth
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Pas besoin de confirmation par email
        user_metadata: {
          first_name: employee.first_name,
          last_name: employee.last_name,
          role: employee.role,
          employee_id: employee.id,
        },
      });

      if (createError) {
        // L'utilisateur existe peut-être déjà (reconnexion après reset)
        // Tenter de le retrouver par email
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find((u) => u.email === email);

        if (existingUser) {
          authUserId = existingUser.id;
          // Mettre à jour le mot de passe au cas où le PIN a changé
          await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
            password,
          });
        } else {
          console.error("Erreur création utilisateur auth:", createError);
          return NextResponse.json(
            { error: "Erreur lors de la création du compte. Contactez votre gestionnaire." },
            { status: 500 }
          );
        }
      } else {
        authUserId = newUser.user.id;
      }

      // Lier l'utilisateur auth à l'employé
      await supabaseAdmin
        .from("employees")
        .update({ auth_user_id: authUserId })
        .eq("id", employee.id);
    } else {
      // L'utilisateur auth existe déjà
      // S'assurer que le mot de passe correspond (si le PIN a été mis à jour)
      // Récupérer l'email de l'utilisateur auth existant
      const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(authUserId);

      if (existingUser?.user) {
        // Mettre à jour le mot de passe pour qu'il corresponde au PIN actuel
        await supabaseAdmin.auth.admin.updateUserById(authUserId, {
          password,
        });
      }
    }

    // ─── Étape 4 : Générer un lien de connexion ───────────────
    // On retourne les credentials pour que le client se connecte
    // via supabase.auth.signInWithPassword côté navigateur
    return NextResponse.json({
      success: true,
      email,
      password,
      employee: {
        id: employee.id,
        firstName: employee.first_name,
        lastName: employee.last_name,
        role: employee.role,
      },
    });
  } catch (err) {
    console.error("Erreur login:", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
