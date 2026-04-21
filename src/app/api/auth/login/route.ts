import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const MAX_ATTEMPTS = 5;
const BLOCK_MINUTES = 15;

// ─── Vérifier si l'utilisateur est bloqué ───────────────────────
async function checkBlocked(identifier: string): Promise<{ blocked: boolean; minutesLeft: number }> {
  try {
    const { data } = await supabaseAdmin
      .from("login_attempts")
      .select("attempts, blocked_until")
      .eq("identifier", identifier)
      .single();

    if (!data) return { blocked: false, minutesLeft: 0 };

    if (data.blocked_until) {
      const blockedUntil = new Date(data.blocked_until);
      if (blockedUntil > new Date()) {
        const minutesLeft = Math.ceil((blockedUntil.getTime() - Date.now()) / (1000 * 60));
        return { blocked: true, minutesLeft };
      }
      // Déblocage : reset
      await supabaseAdmin.from("login_attempts").delete().eq("identifier", identifier);
      return { blocked: false, minutesLeft: 0 };
    }

    return { blocked: false, minutesLeft: 0 };
  } catch {
    return { blocked: false, minutesLeft: 0 };
  }
}

// ─── Enregistrer une tentative ratée ────────────────────────────
async function recordFailedAttempt(identifier: string): Promise<{ blocked: boolean; attemptsLeft: number }> {
  try {
    const { data: existing } = await supabaseAdmin
      .from("login_attempts")
      .select("attempts")
      .eq("identifier", identifier)
      .single();

    const newAttempts = (existing?.attempts || 0) + 1;

    if (newAttempts >= MAX_ATTEMPTS) {
      const blockedUntil = new Date(Date.now() + BLOCK_MINUTES * 60 * 1000);
      await supabaseAdmin.from("login_attempts").upsert({
        identifier,
        attempts: newAttempts,
        blocked_until: blockedUntil.toISOString(),
        last_attempt_at: new Date().toISOString(),
      }, { onConflict: "identifier" });
      return { blocked: true, attemptsLeft: 0 };
    }

    await supabaseAdmin.from("login_attempts").upsert({
      identifier,
      attempts: newAttempts,
      blocked_until: null,
      last_attempt_at: new Date().toISOString(),
    }, { onConflict: "identifier" });

    return { blocked: false, attemptsLeft: MAX_ATTEMPTS - newAttempts };
  } catch {
    return { blocked: false, attemptsLeft: MAX_ATTEMPTS };
  }
}

// ─── Reset les tentatives après succès ──────────────────────────
async function clearAttempts(identifier: string) {
  try {
    await supabaseAdmin.from("login_attempts").delete().eq("identifier", identifier);
  } catch {}
}

// ─── Logger la connexion ────────────────────────────────────────
async function logLogin(employeeId: string | null, firstName: string, success: boolean, req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const ua = req.headers.get("user-agent") || "unknown";
    await supabaseAdmin.from("login_logs").insert({
      employee_id: employeeId,
      first_name: firstName,
      success,
      ip_address: ip.split(",")[0].trim(),
      user_agent: ua.slice(0, 200),
    });
  } catch {}
}

export async function POST(req: NextRequest) {
  try {
    const { firstName, pin } = await req.json();

    // ─── Validation ─────────────────────────────────────
    if (!firstName || typeof firstName !== "string" || firstName.trim().length < 2) {
      return NextResponse.json({ error: "Le prénom doit contenir au moins 2 caractères." }, { status: 400 });
    }

    if (!pin || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: "Le code doit contenir exactement 4 chiffres." }, { status: 400 });
    }

    const normalizedName = firstName.trim().toLowerCase();
    const identifier = `${normalizedName}-${pin}`;

    // ─── Vérifier si bloqué ─────────────────────────────
    const { blocked, minutesLeft } = await checkBlocked(identifier);
    if (blocked) {
      return NextResponse.json({
        error: `Trop de tentatives. Réessaie dans ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}.`,
      }, { status: 429 });
    }

    // ─── Chercher l'employé ─────────────────────────────
    const { data: employee, error: lookupError } = await supabaseAdmin
      .from("employees")
      .select("id, first_name, last_name, phone_last4, role, is_active, auth_user_id")
      .ilike("first_name", normalizedName)
      .eq("phone_last4", pin)
      .single();

    if (lookupError || !employee) {
      await recordFailedAttempt(identifier);
      await logLogin(null, normalizedName, false, req);

      const { attemptsLeft } = await checkBlocked(identifier).then(() => 
        ({ attemptsLeft: MAX_ATTEMPTS - ((lookupError ? 1 : 0)) })
      );

      return NextResponse.json({ error: "Identifiant ou code incorrect." }, { status: 401 });
    }

    if (!employee.is_active) {
      await logLogin(employee.id, employee.first_name, false, req);
      return NextResponse.json({
        error: "Ton compte est en attente d'approbation par ton gestionnaire.",
      }, { status: 403 });
    }

    // ─── Construire l'email fictif ──────────────────────
    const shortId = employee.id.split("-")[0];
    const email = `${normalizedName}.${shortId}@amigo.local`;
    const password = pin;

    // ─── Créer ou récupérer l'utilisateur auth ──────────
    let authUserId = employee.auth_user_id;

    if (!authUserId) {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: employee.first_name,
          last_name: employee.last_name,
          role: employee.role,
          employee_id: employee.id,
        },
      });

      if (createError) {
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find((u) => u.email === email);

        if (existingUser) {
          authUserId = existingUser.id;
          await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { password });
        } else {
          return NextResponse.json({ error: "Erreur lors de la création du compte." }, { status: 500 });
        }
      } else {
        authUserId = newUser.user.id;
      }

      await supabaseAdmin.from("employees").update({ auth_user_id: authUserId }).eq("id", employee.id);
    } else {
      const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(authUserId);
      if (existingUser?.user) {
        await supabaseAdmin.auth.admin.updateUserById(authUserId, { password });
      }
    }

    // ─── Succès — reset tentatives + logger ─────────────
    await clearAttempts(identifier);
    await logLogin(employee.id, employee.first_name, true, req);

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
    return NextResponse.json({ error: "Erreur interne du serveur." }, { status: 500 });
  }
}
