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
  "merci", "ok", "oui", "non", "svp", "stp",
]);

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zàâäéèêëïîôùûüç0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

// ─── Suggestions dynamiques par sujet ───────────────────────────
const FOLLOW_UP: Record<string, string[]> = {
  accueil: [
    "Quels sont les 4 forfaits ?",
    "Comment gérer une file d'attente ?",
    "Si un client a pas de réservation ?",
    "Comment proposer un forfait supérieur ?",
  ],
  casque: [
    "Comment savoir la bonne taille ?",
    "Quoi faire si un casque est fissuré ?",
    "Comment désinfecter les casques ?",
    "La jugulaire, c'est quoi la règle ?",
  ],
  sécurité: [
    "C'est quoi le briefing pré-course ?",
    "Distance minimale entre karts ?",
    "Que signifient les drapeaux ?",
    "Quoi faire si un client enlève son casque ?",
  ],
  urgence: [
    "Quels sont les numéros d'urgence ?",
    "Étapes en cas d'accident ?",
    "Où est la trousse de premiers soins ?",
    "On bouge un blessé ou non ?",
  ],
  opérations: [
    "Checklist d'ouverture le matin ?",
    "Comment fermer le centre ?",
    "Inspection des karts, on check quoi ?",
    "C'est quoi le fond de caisse ?",
  ],
  caisse: [
    "Comment faire le Rapport Z ?",
    "Qui peut autoriser un remboursement ?",
    "Combien de fond de caisse ?",
    "Quels modes de paiement ?",
  ],
  drapeau: [
    "Que signifie le drapeau jaune ?",
    "Différence rouge vs jaune ?",
    "C'est quoi le damier ?",
    "Quand utiliser le drapeau vert ?",
  ],
  fermeture: [
    "La dernière course, c'est quand ?",
    "Faut-il activer l'alarme ?",
    "Quoi faire avec les karts le soir ?",
    "Comment faire la caisse de fermeture ?",
  ],
  général: [
    "Comment accueillir un client ?",
    "Les règles de sécurité de base ?",
    "Procédure d'urgence ?",
    "Comment ouvrir le centre ?",
  ],
};

function detectCategory(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("casque") || t.includes("jugulaire") || t.includes("taille")) return "casque";
  if (t.includes("drapeau") || t.includes("jaune") || t.includes("rouge") || t.includes("damier") || t.includes("vert")) return "drapeau";
  if (t.includes("urgence") || t.includes("accident") || t.includes("911") || t.includes("bless") || t.includes("premier soin")) return "urgence";
  if (t.includes("caisse") || t.includes("rapport z") || t.includes("argent") || t.includes("comptant") || t.includes("rembours")) return "caisse";
  if (t.includes("ouvrir") || t.includes("ouverture") || t.includes("matin") || t.includes("checklist") || t.includes("alarme")) return "opérations";
  if (t.includes("fermer") || t.includes("fermeture") || t.includes("soir") || t.includes("dernière course")) return "fermeture";
  if (t.includes("accueil") || t.includes("client") || t.includes("forfait") || t.includes("réservation") || t.includes("prix")) return "accueil";
  if (t.includes("sécurité") || t.includes("briefing") || t.includes("piste") || t.includes("distance") || t.includes("dépassement")) return "sécurité";
  return "général";
}

function buildSmartResponse(query: string, docs: any[]): { response: string; sources: string[]; category: string } {
  const keywords = extractKeywords(query);
  if (keywords.length === 0) {
    return { response: "Pose-moi une question plus précise sur les procédures d'Amigo Karting.", sources: [], category: "général" };
  }

  // Scorer les documents
  const scored = docs.map((doc: any) => {
    const titleLower = doc.title.toLowerCase();
    const contentLower = doc.content.toLowerCase();
    const categoryLower = (doc.category || "").toLowerCase();

    let score = 0;
    for (const kw of keywords) {
      if (titleLower.includes(kw)) score += 3;
      if (categoryLower.includes(kw)) score += 2;
      const matches = (contentLower.match(new RegExp(kw, "g")) || []).length;
      score += Math.min(matches, 3);
    }

    return { ...doc, score };
  });

  const relevant = scored.filter((d: any) => d.score > 0).sort((a: any, b: any) => b.score - a.score);

  if (relevant.length === 0) {
    return {
      response: "J'ai pas trouvé ça dans le manuel. Essaie de reformuler ou demande-moi un sujet précis comme les casques, la sécurité ou les urgences.",
      sources: [],
      category: detectCategory(query),
    };
  }

  const best = relevant[0];
  const category = best.category || detectCategory(query);

  // Construire une réponse intelligente (pas juste copier-coller)
  const content = best.content as string;
  const sentences = content.split(/(?<=[.!?])\s+/).filter((s: string) => s.trim().length > 10);

  // Trouver les phrases les plus pertinentes
  const rankedSentences = sentences.map((s: string) => {
    let score = 0;
    for (const kw of keywords) {
      if (s.toLowerCase().includes(kw)) score += 1;
    }
    return { text: s, score };
  }).sort((a, b) => b.score - a.score);

  // Prendre les 3-5 meilleures phrases
  const topSentences = rankedSentences.filter((s) => s.score > 0).slice(0, 5);

  let response: string;

  if (topSentences.length >= 2) {
    // Résumé intelligent
    response = `Selon le manuel (${best.title}) :\n\n${topSentences.map((s) => s.text.trim()).join("\n\n")}`;
  } else if (topSentences.length === 1) {
    response = `Selon le manuel (${best.title}) :\n\n${topSentences[0].text.trim()}`;
    // Ajouter du contexte avec la phrase avant et après
    const idx = sentences.indexOf(topSentences[0].text);
    if (idx > 0) response += `\n\n${sentences[idx - 1].trim()}`;
    if (idx < sentences.length - 1) response += `\n\n${sentences[idx + 1].trim()}`;
  } else {
    // Prendre le début du document
    response = `Voici ce que le manuel dit sur ${best.title} :\n\n${sentences.slice(0, 3).join(" ")}`;
  }

  // Si un deuxième document est pertinent, ajouter une note
  if (relevant.length > 1 && relevant[1].score >= 3) {
    response += `\n\nÀ voir aussi : ${relevant[1].title}.`;
  }

  const sources = relevant.slice(0, 2).map((d: any) => d.title);

  return { response, sources, category };
}

// ─── GET : suggestions et historique ────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { data: employee } = await supabase
      .from("employees").select("id").eq("auth_user_id", user.id).single();
    if (!employee) return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "suggestions") {
      try {
        const { data: ctx } = await supabaseAdmin
          .from("employee_ai_context")
          .select("weak_subjects, weak_questions")
          .eq("employee_id", employee.id)
          .single();

        const suggestions: string[] = [];

        if (ctx?.weak_subjects) {
          ctx.weak_subjects.split(" | ").slice(0, 3).forEach((s: string) => {
            const cat = detectCategory(s);
            const followUps = FOLLOW_UP[cat] || FOLLOW_UP["général"];
            suggestions.push(followUps[0]);
          });
        }

        if (ctx?.weak_questions) {
          ctx.weak_questions.split(" | ").slice(0, 2).forEach((q: string) => {
            if (q.length < 50) suggestions.push(q);
          });
        }

        if (suggestions.length < 4) {
          const defaults = ["Comment accueillir un client ?", "Procédure casque fissuré", "Numéros d'urgence", "Drapeaux de course"];
          defaults.forEach((d) => { if (!suggestions.includes(d)) suggestions.push(d); });
        }

        return NextResponse.json({ weaknessSuggestions: [...new Set(suggestions)].slice(0, 6) });
      } catch {
        return NextResponse.json({ weaknessSuggestions: ["Comment accueillir un client ?", "Procédure casque fissuré", "Numéros d'urgence"] });
      }
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── POST : chat intelligent ────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { data: employee } = await supabase
      .from("employees").select("id").eq("auth_user_id", user.id).single();
    if (!employee) return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });

    const body = await req.json();

    if (body.action === "chat" || body.action === "search") {
      const message = body.message || body.query || "";
      const history = body.history || [];

      if (!message.trim()) {
        return NextResponse.json({ response: "Pose-moi une question !", nextSuggestions: FOLLOW_UP["général"] });
      }

      // Charger le manuel
      const { data: docs } = await supabaseAdmin
        .from("knowledge_documents")
        .select("id, title, content, category");

      if (!docs || docs.length === 0) {
        return NextResponse.json({
          response: "Le manuel n'est pas encore chargé. Demande à ton gestionnaire d'ajouter le contenu.",
          nextSuggestions: [],
        });
      }

      // Construire la réponse
      const { response, sources, category } = buildSmartResponse(message, docs);

      // Suggestions dynamiques basées sur le contexte de la conversation
      let nextSuggestions: string[] = [];

      // D'abord, suggestions du même sujet
      const catSuggestions = FOLLOW_UP[category] || FOLLOW_UP["général"];
      nextSuggestions.push(...catSuggestions);

      // Analyser l'historique pour varier les sujets
      const coveredCategories = new Set<string>();
      coveredCategories.add(category);
      for (const msg of history) {
        if (msg.role === "user") {
          coveredCategories.add(detectCategory(msg.content));
        }
      }

      // Ajouter des suggestions d'autres sujets pas encore couverts
      const allCategories = Object.keys(FOLLOW_UP);
      for (const cat of allCategories) {
        if (!coveredCategories.has(cat) && nextSuggestions.length < 8) {
          nextSuggestions.push(FOLLOW_UP[cat][0]);
        }
      }

      // Retirer les doublons et la question actuelle
      nextSuggestions = [...new Set(nextSuggestions)]
        .filter((s) => s.toLowerCase() !== message.toLowerCase())
        .slice(0, 6);

      // Sauvegarder l'historique
      try {
        const { data: existingMem } = await supabaseAdmin
          .from("ai_memory")
          .select("value")
          .eq("employee_id", employee.id)
          .eq("key", "qa_history")
          .single();

        let historyArr: any[] = [];
        if (existingMem?.value) { try { historyArr = JSON.parse(existingMem.value); } catch {} }

        historyArr = historyArr.filter((h: any) => h.query !== message);
        historyArr.unshift({ query: message, timestamp: new Date().toISOString() });
        historyArr = historyArr.slice(0, 30);

        await supabaseAdmin
          .from("ai_memory")
          .upsert({
            employee_id: employee.id, key: "qa_history",
            value: JSON.stringify(historyArr),
            updated_at: new Date().toISOString(),
          }, { onConflict: "employee_id,key" });

        await supabaseAdmin
          .from("ai_memory")
          .upsert({
            employee_id: employee.id, key: "qa_total_questions",
            value: String(historyArr.length),
            updated_at: new Date().toISOString(),
          }, { onConflict: "employee_id,key" });
      } catch {}

      return NextResponse.json({ response, sources, nextSuggestions });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
