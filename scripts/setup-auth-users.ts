/**
 * Script de configuration initiale des comptes Supabase Auth.
 *
 * Ce script lit la table employees et crée un utilisateur Supabase Auth
 * pour chaque employé qui n'a pas encore de auth_user_id.
 *
 * Usage :
 *   1. Remplir la table employees avec les données (prénom, phone_last4)
 *   2. Exécuter : npx tsx scripts/setup-auth-users.ts
 *
 * Le mot de passe de chaque employé = ses 4 derniers chiffres de téléphone.
 * L'email fictif = prenom.id-court@amigo.local
 */

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  console.log("══════════════════════════════════════════════");
  console.log("  Amigo Karting — Configuration des comptes Auth");
  console.log("══════════════════════════════════════════════\n");

  // Récupérer tous les employés sans auth_user_id
  const { data: employees, error } = await supabaseAdmin
    .from("employees")
    .select("id, first_name, last_name, phone_last4, role, auth_user_id")
    .eq("is_active", true);

  if (error) {
    console.error("Erreur lecture employees:", error.message);
    process.exit(1);
  }

  const toSetup = employees?.filter((e) => !e.auth_user_id) || [];

  if (toSetup.length === 0) {
    console.log("✅ Tous les employés ont déjà un compte Auth.\n");

    // Afficher le récapitulatif quand même
    console.log("Comptes existants :");
    for (const emp of employees || []) {
      const shortId = emp.id.split("-")[0];
      const email = `${emp.first_name.toLowerCase()}.${shortId}@amigo.local`;
      console.log(`  • ${emp.first_name} ${emp.last_name} → ${email} (PIN: ${emp.phone_last4})`);
    }
    return;
  }

  console.log(`${toSetup.length} employé(s) à configurer :\n`);

  let created = 0;
  let errors = 0;

  for (const emp of toSetup) {
    const shortId = emp.id.split("-")[0];
    const email = `${emp.first_name.toLowerCase()}.${shortId}@amigo.local`;
    const password = emp.phone_last4;

    process.stdout.write(`  ${emp.first_name} ${emp.last_name} (${email})... `);

    // Créer l'utilisateur Auth
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: emp.first_name,
        last_name: emp.last_name,
        role: emp.role,
        employee_id: emp.id,
      },
    });

    if (createError) {
      console.log(`❌ ${createError.message}`);
      errors++;
      continue;
    }

    // Lier l'auth_user_id à l'employé
    const { error: updateError } = await supabaseAdmin
      .from("employees")
      .update({ auth_user_id: newUser.user.id })
      .eq("id", emp.id);

    if (updateError) {
      console.log(`⚠️  User créé mais liaison échouée: ${updateError.message}`);
      errors++;
      continue;
    }

    console.log("✅");
    created++;
  }

  console.log(`\n══════════════════════════════════════════════`);
  console.log(`  Résultat : ${created} créés, ${errors} erreurs`);
  console.log(`══════════════════════════════════════════════\n`);

  // Récapitulatif des identifiants
  console.log("📋 Identifiants de connexion :");
  console.log("──────────────────────────────────────────────");
  for (const emp of employees || []) {
    console.log(`  Prénom : ${emp.first_name.padEnd(15)} Code : ${emp.phone_last4}    (${emp.role})`);
  }
  console.log("──────────────────────────────────────────────\n");
}

main().catch(console.error);
