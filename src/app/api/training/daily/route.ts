import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { roleCategory } from "@/lib/roles";
import bank from "@/lib/ai/training-bank.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface BankQuestion {
  id: string;
  cat: string;
  mod?: string;
  sort?: number;
  type: "mc" | "vf" | "on";
  q: string;
  correct: string;
  distractors?: string[];
  explanation?: string;
}

// Hash de chaîne stable (multiply-by-31), toujours positif.
function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export async function GET() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  // Date du jour (America/Toronto) au format YYYY-MM-DD.
  const dateStr = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Toronto",
  });

  // Bassin de questions ciblé par le rôle.
  const all = (bank as { questions: BankQuestion[] }).questions;
  const category = roleCategory((employee as { role?: string }).role);
  const pool = category ? all.filter((q) => q.cat === category) : all;

  if (pool.length === 0) {
    return NextResponse.json({ error: "Aucune question disponible" }, { status: 404 });
  }

  // Question déterministe du jour.
  const index = hashString(dateStr) % pool.length;
  const q = pool[index];

  // Construction des choix.
  let choices: string[];
  let correctIndex: number;

  if (q.type === "mc") {
    const options = [q.correct, ...(q.distractors || [])];
    // Ordre déterministe stable (ne change pas au rafraîchissement).
    const ordered = options
      .map((value) => ({ value, key: hashString(dateStr + q.id + value) }))
      .sort((a, b) => a.key - b.key)
      .map((o) => o.value);
    choices = ordered;
    correctIndex = ordered.findIndex((v) => v === q.correct);
  } else if (q.type === "vf") {
    choices = ["Vrai", "Faux"];
    correctIndex = q.correct.trim().toLowerCase().startsWith("v") ? 0 : 1;
  } else {
    choices = ["Oui", "Non"];
    correctIndex = q.correct.trim().toLowerCase().startsWith("o") ? 0 : 1;
  }

  return NextResponse.json({
    date: dateStr,
    id: q.id,
    q: q.q,
    choices,
    correctIndex,
    explanation: q.explanation || "",
  });
}
