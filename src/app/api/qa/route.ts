import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const STOP_WORDS = new Set([
  "le", "la", "les", "un", "une", "des", "de", "du", "au", "aux",
  "et", "ou", "en", "a", "à", "est", "ce", "se", "sa", "son", "ses",
  "que", "qui", "ne", "pas", "plus", "je", "tu", "il", "on", "nous",
  "vous", "ils", "mon", "ton", "dans", "sur", "pour", "par", "avec",
  "mais", "bien", "ça", "quoi", "comment", "c'est", "faut", "peut",
  "fait", "faire", "être", "avoir", "très", "quand", "aussi", "tout",
  "bon", "bonne", "oui", "non", "là", "ici", "car", "donc", "si",
]);

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zàâäéèêëïîôùûüç0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

// ─── Questions reliées par catégorie ────────────────────────────
const RELATED_MAP: Record<string, { text: string; category: string }[]> = {
  accueil: [
    { text: "Quels sont les forfaits disponibles ?", category: "accueil" },
    { text: "Comment gérer une file d'attente ?", category: "accueil" },
    { text: "Comment proposer un forfait supérieur ?", category: "accueil" },
  ],
  casque: [
    { text: "Comment savoir si un casque est à la bonne taille ?", category: "sécurité" },
    { text: "Quoi faire avec un casque fissuré ?", category: "sécurité" },
    { text: "Comment désinfecter les casques ?", category: "sécurité" },
  ],
  sécurité: [
    { text: "Que signifient les drapeaux de course ?", category: "sécurité" },
    { text: "C'est quoi le briefing de sécurité ?", category: "sécurité" },
    { text: "Distance minimale entre les karts ?", category: "sécurité" },
  ],
  urgence: [
    { text: "Quels sont les numéros d'urgence ?", category: "sécurité" },
    { text: "Quoi faire en cas d'accident sur la piste ?", category: "sécurité" },
    { text: "Où est la trousse de premiers soins ?", category: "sécurité" },
  ],
  opérations: [
    { text: "C'est quoi la checklist d'ouverture ?", category: "opérations" },
    { text: "Comment faire la fermeture du centre ?", category: "opérations" },
    { text: "Comment gérer la caisse ?", category: "opérations" },
  ],
  caisse: [
    { text: "Comment faire le Rapport Z ?", category: "opérations" },
    { text: "Combien laisser de fond de caisse ?", category: "opérations" },
    { text: "Qui peut autoriser un remboursement ?", category: "opérations" },
  ],
  drapeau: [
    { text: "Que signifie le drapeau jaune ?", category: "sécurité" },
    { text: "Différence entre drapeau rouge et jaune ?", category: "sécurité" },
    { text: "C'est quoi le drapeau à damier ?", category: "sécurité" },
  ],
  fermeture: [
    { text: "Comment fermer la caisse ?", category: "opérations" },
    { text: "Faut-il activer l'alarme ?", category: "opérations" },
    { text: "Combien de temps avant la fermeture arrêter les courses ?", category: "opérations" },
  ],
};

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { data: employee } = await supabase
      .from("employees")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    if (!employee) return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // ─── Autocomplete ──────────────────────────────────
    if (action === "autocomplete") {
      const q = url.searchParams.get("q") || "";
      const keywords = extractKeywords(q);
      if (keywords.length === 0) return NextResponse.json({ suggestions: [] });

      const { data: docs } = await supabaseAdmin
        .from("knowledge_documents")
        .select("title, category");

      const suggestions = (docs || [])
        .filter((d: any) => keywords.some((kw) => d.title.toLowerCase().includes(kw) || d.category?.toLowerCase().includes(kw)))
        .map((d: any) => d.title)
        .slice(0, 5);

      return NextResponse.json({ suggestions });
    }

    // ─── Suggestions selon les faiblesses ──────────────
    if (action === "suggestions") {
      try {
        const { data: ctx } = await supabaseAdmin
          .from("employee_ai_context")
          .select("weak_subjects, weak_questions")
          .eq("employee_id", employee.id)
          .single();

        const suggestions: string[] = [];

        if (ctx?.weak_subjects) {
          const subjects = ctx.weak_subjects.split(" | ");
          subjects.slice(0, 3).forEach((s: string) => {
            if (s.toLowerCase().includes("sécurité")) suggestions.push("Procédures de sécurité", "Drapeaux de course");
            else if (s.toLowerCase().includes("casque")) suggestions.push("Gestion des casques", "Casque défectueux");
            else if (s.toLowerCase().includes("urgence")) suggestions.push("Procédures d'urgence", "Numéros d'urgence");
            else if (s.toLowerCase().includes("opération")) suggestions.push("Ouverture du centre", "Fermeture du centre");
            else if (s.toLowerCase().includes("caisse")) suggestions.push("Fermeture de caisse", "Remboursements");
            else suggestions.push(s);
          });
        }

        if (ctx?.weak_questions) {
          const questions = ctx.weak_questions.split(" | ").slice(0, 2);
          questions.forEach((q: string) => {
            if (q.length < 50) suggestions.push(q);
          });
        }

        if (suggestions.length === 0) {
          suggestions.push("Briefing de sécurité", "Casques", "Procédures d'urgence");
        }

        return NextResponse.json({ weaknessSuggestions: [...new Set(suggestions)].slice(0, 6) });
      } catch {
        return NextResponse.json({ weaknessSuggestions: ["Briefing de sécurité", "Casques", "Urgences"] });
      }
    }

    // ─── Historique ─────────────────────────────────────
    if (action === "history") {
      try {
        const { data: mem } = await supabaseAdmin
          .from("ai_memory")
          .select("value")
          .eq("employee_id", employee.id)
          .eq("key", "qa_history")
          .single();

        if (mem?.value) {
          return NextResponse.json({ history: JSON.parse(mem.value) });
        }
      } catch {}
      return NextResponse.json({ history: [] });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (err) {
    console.error("QA GET error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { data: employee } = await supabase
      .from("employees")
      .select("id, first_name")
      .eq("auth_user_id", user.id)
      .single();
    if (!employee) return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });

    const body = await req.json();
    const { action, query } = body;

    if (action === "search" && query) {
      const keywords = extractKeywords(query);

      // Chercher dans knowledge_documents
      const { data: docs } = await supabaseAdmin
        .from("knowledge_documents")
        .select("id, title, content, category");

      if (!docs || docs.length === 0) {
        return NextResponse.json({ results: [], relatedQuestions: [], autocomplete: [] });
      }

      // Scorer chaque document
      const scored = docs.map((doc: any) => {
        const titleLower = doc.title.toLowerCase();
        const contentLower = doc.content.toLowerCase();
        const categoryLower = (doc.category || "").toLowerCase();

        let score = 0;

        for (const kw of keywords) {
          // Titre = 3 points
          if (titleLower.includes(kw)) score += 3;
          // Catégorie = 2 points
          if (categoryLower.includes(kw)) score += 2;
          // Contenu = 1 point par occurrence (max 3)
          const matches = (contentLower.match(new RegExp(kw, "g")) || []).length;
          score += Math.min(matches, 3);
        }

        // Créer un highlight (première phrase qui contient un mot-clé)
        const sentences = doc.content.split(/[.!?]+/).filter((s: string) => s.trim());
        let highlight = sentences[0] || doc.content.slice(0, 150);
        for (const s of sentences) {
          if (keywords.some((kw) => s.toLowerCase().includes(kw))) {
            highlight = s.trim();
            break;
          }
        }

        return {
          id: doc.id,
          title: doc.title,
          content: doc.content,
          category: doc.category || "Général",
          relevance: Math.min(100, score * 10),
          highlight: highlight.length > 150 ? highlight.slice(0, 150) + "..." : highlight,
        };
      });

      // Trier par pertinence et filtrer les 0
      const results = scored
        .filter((r: any) => r.relevance > 0)
        .sort((a: any, b: any) => b.relevance - a.relevance)
        .slice(0, 5);

      // Questions reliées basées sur les catégories des résultats
      const relatedCategories = [...new Set(results.map((r: any) => r.category.toLowerCase()))];
      let related: { text: string; category: string }[] = [];
      for (const cat of relatedCategories) {
        const catRelated = RELATED_MAP[cat] || [];
        related.push(...catRelated);
      }
      // Pas de doublons et pas la même question que la recherche
      related = related
        .filter((r, i, arr) => arr.findIndex((x) => x.text === r.text) === i)
        .filter((r) => !r.text.toLowerCase().includes(query.toLowerCase().slice(0, 10)))
        .slice(0, 4);

      // Sauvegarder l'historique
      try {
        const { data: existingMem } = await supabaseAdmin
          .from("ai_memory")
          .select("value")
          .eq("employee_id", employee.id)
          .eq("key", "qa_history")
          .single();

        let historyArr: any[] = [];
        if (existingMem?.value) {
          try { historyArr = JSON.parse(existingMem.value); } catch {}
        }

        // Ajouter la nouvelle recherche
        historyArr = historyArr.filter((h: any) => h.query !== query);
        historyArr.unshift({ query, timestamp: new Date().toISOString() });
        historyArr = historyArr.slice(0, 20);

        await supabaseAdmin
          .from("ai_memory")
          .upsert({
            employee_id: employee.id,
            key: "qa_history",
            value: JSON.stringify(historyArr),
            updated_at: new Date().toISOString(),
          }, { onConflict: "employee_id,key" });

        // Compter les questions pour le score
        await supabaseAdmin
          .from("ai_memory")
          .upsert({
            employee_id: employee.id,
            key: "qa_total_questions",
            value: String(historyArr.length),
            updated_at: new Date().toISOString(),
          }, { onConflict: "employee_id,key" });
      } catch {}

      return NextResponse.json({ results, relatedQuestions: related });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (err) {
    console.error("QA POST error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
