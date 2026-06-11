import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { roleCategory } from "@/lib/roles";
import bank from "@/lib/ai/training-bank.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BankQuestion = {
  id: string;
  cat: string;
  mod: string;
  sort: number;
  type: string;
  q: string;
  correct: string;
  distractors: string[];
  explanation: string;
};

const SUBJECT_MAP: Record<string, string> = {
  caisse: "Caisse - Amigo Karting",
  piste: "Piste",
  superviseur: "Superviseur du service à la clientèle",
};

const SUBJECTS = [
  { value: "caisse", label: "Caisse" },
  { value: "piste", label: "Piste" },
  { value: "superviseur", label: "Superviseur" },
];

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // ─── Auth ────────────────────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: employee } = await supabase
      .from("employees")
      .select("id, role")
      .eq("auth_user_id", user.id)
      .single();

    if (!employee) {
      return NextResponse.json({ error: "Employé introuvable" }, { status: 401 });
    }

    // ─── Catégorie effective ─────────────────────────────────
    const restrictCat = roleCategory(employee.role);
    let category: string | null;

    if (restrictCat) {
      category = restrictCat;
    } else {
      const subject = (req.nextUrl.searchParams.get("subject") || "").trim().toLowerCase();
      category = subject ? SUBJECT_MAP[subject] ?? null : null;
    }

    // ─── Construire les cartes depuis la banque ──────────────
    const pool = (bank.questions as BankQuestion[]).filter(
      (q) => !category || q.cat === category
    );

    const cards = pool
      .map((q) => ({
        id: q.id,
        front: q.q,
        back: q.correct,
        explanation: q.explanation,
        mod: q.mod,
      }))
      .sort(() => Math.random() - 0.5)
      .slice(0, 30);

    return NextResponse.json({
      category,
      locked: restrictCat != null,
      subjects: SUBJECTS,
      cards,
    });
  } catch (err) {
    console.error("Erreur API flashcards:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
