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

// Enlève les accents et met en minuscules (recherche robuste)
function norm(s: string): string {
  return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

const STOP_NORM = new Set([...STOP_WORDS].map(norm));

function extractKeywords(text: string): string[] {
  return norm(text)
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_NORM.has(w));
}

// Synonymes : aide à relier les mots de l'employé au vocabulaire des manuels
const SYNONYMS: Record<string, string[]> = {
  argent: ["caisse", "fonds", "paiement", "comptant"],
  cash: ["caisse", "fonds", "comptant"],
  monnaie: ["caisse", "fonds"],
  fond: ["fonds", "caisse"],
  prix: ["prix", "tarif", "forfait", "cout"],
  tarif: ["prix", "tarif", "forfait"],
  cout: ["prix", "tarif"],
  coute: ["prix", "tarif"],
  rabais: ["rabais", "prix", "negociable"],
  rembourser: ["remboursement", "rembourse"],
  remboursement: ["remboursement", "rembourse"],
  feu: ["drapeau"],
  lumiere: ["drapeau"],
  blesse: ["blessure", "accident", "urgence"],
  blessure: ["blessure", "accident", "urgence"],
  urgence: ["accident", "urgence", "secours"],
  accident: ["accident", "urgence"],
  ouvrir: ["ouverture"],
  ouverture: ["ouverture"],
  fermer: ["fermeture"],
  fermeture: ["fermeture", "close"],
  pluie: ["pluie", "mouille", "meteo"],
  mouille: ["pluie"],
  fache: ["mecontent", "plainte"],
  mecontent: ["mecontent", "plainte"],
  plainte: ["plainte", "mecontent"],
  vehicule: ["kart"],
  voiture: ["kart"],
  essence: ["essence", "carburant", "gaz"],
  gaz: ["essence", "carburant"],
  reservation: ["reservation", "groupe"],
  groupe: ["groupe", "reservation"],
  pause: ["pause", "repas"],
  casque: ["casque", "equipement", "ceinture"],
};

function expandKeywords(kws: string[]): string[] {
  const out = new Set(kws);
  for (const k of kws) (SYNONYMS[k] || []).forEach((s) => out.add(s));
  return [...out];
}

function pickOne(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Suggestions dynamiques par sujet ───────────────────────────
const FOLLOW_UP: Record<string, string[]> = {
  accueil: [
    "Comment accueillir un client ?",
    "Comment présenter les prix ?",
    "Peut-on donner un rabais ?",
    "Comment gérer une réservation de groupe ?",
  ],
  casque: [
    "Comment se déroule le briefing avant la course ?",
    "Que faut-il vérifier avant le départ ?",
    "Que faire si un client enlève sa ceinture ?",
    "Quels sont les règlements de piste ?",
  ],
  sécurité: [
    "Que veut dire le drapeau jaune ?",
    "Que veut dire le drapeau rouge ?",
    "Pourquoi utiliser les drapeaux ?",
    "Quand demander du back-up ?",
  ],
  urgence: [
    "Que faire en cas d'accident ?",
    "Comment réagir avec un client blessé ?",
    "C'est quoi la règle du jogging ?",
    "Quand expulser un client dangereux ?",
  ],
  opérations: [
    "Les étapes d'ouverture de la caisse ?",
    "Comment inspecter un kart ?",
    "Comment faire le plein d'essence en sécurité ?",
    "Comment gérer les puits et les groupes ?",
  ],
  caisse: [
    "Combien dans le fonds de caisse ?",
    "Que faire s'il manque de l'argent dans la caisse ?",
    "Où inscrire la raison d'un remboursement ?",
    "Comment faire le rapprochement Apex ?",
  ],
  drapeau: [
    "Que veut dire le drapeau jaune ?",
    "Que veut dire le drapeau rouge ?",
    "Comment entretenir les drapeaux ?",
    "Que faire si un client ignore le drapeau ?",
  ],
  fermeture: [
    "Les étapes de fermeture de la caisse ?",
    "Comment fermer le site en fin de journée ?",
    "Que vérifier sur la checklist de fermeture ?",
    "Quand commence le close ?",
  ],
  général: [
    "Comment accueillir un client ?",
    "Que faire en cas d'accident ?",
    "Combien dans le fonds de caisse ?",
    "Comment gérer un client mécontent ?",
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

// ─── Couche « humaine » : salutations et petites discussions ────
function humanReply(message: string): string | null {
  const norm = message
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = norm.split(" ").filter(Boolean);
  // On ne traite comme « discussion » que les messages courts,
  // pour ne pas détourner une vraie question.
  if (words.length > 6) return null;

  const has = (re: RegExp) => re.test(norm);

  if (has(/\b(salut|bonjour|bonsoir|allo|allo+|coucou|hey|yo|hello|hi|bon matin|re)\b/) &&
      !has(/\b(combien|comment|pourquoi|quoi|quel|quelle|que|ou|drapeau|caisse|kart|client|accident)\b/)) {
    return "Salut ! 👋 Moi c'est l'assistant d'Amigo Karting. Pose-moi une question sur les procédures et je t'aide — par exemple « Combien dans le fonds de caisse ? » ou « Que veut dire le drapeau jaune ? ». De quoi t'as besoin ?";
  }
  if (has(/\b(ca va|comment ca va|comment vas|tu vas bien|comment tu vas|ca roule|quoi de neuf)\b/)) {
    return "Ça va super, merci ! 😊 Et toi, ça va ? Si t'as une question sur le manuel, je suis là pour t'aider.";
  }
  if (has(/\b(merci|thanks|thank you|nice|cool|super|parfait|genial|trop bien)\b/) && words.length <= 3) {
    return "Ça me fait plaisir ! 😊 N'hésite pas si t'as d'autres questions.";
  }
  if (has(/\b(qui es tu|tu es qui|t es qui|comment tu t'appelles|c'est quoi ton nom|tu fais quoi|tu sers a quoi|tu peux faire quoi|que peux tu faire|comment ca marche|aide|help)\b/)) {
    return "Je suis l'assistant d'Amigo Karting. Je connais les manuels — caisse, piste et service client — et je réponds à tes questions sur les procédures. Pose ta question en mots simples, comme « Que faire en cas d'accident ? » et je te trouve la réponse. 🙂";
  }
  if (has(/\b(au revoir|bye|a plus|a tantot|a bientot|bonne journee|bonne soiree|ciao|salut bye)\b/)) {
    return "À bientôt ! Bon karting 🏁";
  }
  if (has(/^(oui|non|ok|okay|d'accord|daccord|parfait)$/)) {
    return "Parfait 🙂 Pose-moi ta question quand tu veux — sur la caisse, la piste ou le service client.";
  }
  return null;
}

function buildSmartResponse(query: string, docs: any[]): { response: string; sources: string[]; category: string } {
  const keywords = expandKeywords(extractKeywords(query));
  if (keywords.length === 0) {
    return { response: "Dis-m'en un peu plus 🙂 Pose ta question en quelques mots et je te trouve la réponse dans le manuel.", sources: [], category: "général" };
  }

  // Scorer les documents (recherche sans accents)
  const scored = docs.map((doc: any) => {
    const titleN = norm(doc.title);
    const contentN = norm(doc.content);
    const categoryN = norm(doc.category || "");

    let score = 0;
    for (const kw of keywords) {
      if (titleN.includes(kw)) score += 3;
      if (categoryN.includes(kw)) score += 2;
      const matches = contentN.split(kw).length - 1;
      score += Math.min(matches, 3);
    }

    return { ...doc, score };
  });

  const relevant = scored.filter((d: any) => d.score > 0).sort((a: any, b: any) => b.score - a.score);

  if (relevant.length === 0) {
    return {
      response: "Hmm, je ne trouve pas ça précisément dans le manuel. 🤔 Essaie de reformuler, ou pose-moi une question sur la caisse, la piste ou le service client — par exemple « Que faire en cas d'accident ? » ou « Comment accueillir un client ? ».",
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
    const sn = norm(s);
    let score = 0;
    for (const kw of keywords) {
      if (sn.includes(kw)) score += 1;
    }
    return { text: s, score };
  }).sort((a, b) => b.score - a.score);

  // Prendre les meilleures phrases
  const topSentences = rankedSentences.filter((s) => s.score > 0).slice(0, 4);

  // Intro conversationnelle (varie pour un ton plus humain)
  const intro = pickOne([
    "Bonne question ! 👇",
    "Voici ce que je trouve dans le manuel 👇",
    "Ok, voilà l'info :",
    "D'après le manuel :",
  ]);

  let body: string;
  if (topSentences.length >= 2) {
    body = topSentences.map((s) => s.text.trim()).join("\n\n");
  } else if (topSentences.length === 1) {
    const parts = [topSentences[0].text.trim()];
    const idx = sentences.indexOf(topSentences[0].text);
    if (idx >= 0 && idx < sentences.length - 1) parts.push(sentences[idx + 1].trim());
    body = parts.join("\n\n");
  } else {
    body = sentences.slice(0, 3).join(" ");
  }

  let response = `${intro}\n\n${body}`;

  // Si un deuxième document est pertinent, le proposer
  if (relevant.length > 1 && relevant[1].score >= 3) {
    response += `\n\nVeux-tu que je t'en dise plus sur « ${relevant[1].title} » ?`;
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
          const defaults = ["Combien dans le fonds de caisse ?", "Que veut dire le drapeau jaune ?", "Que faire en cas d'accident ?", "Comment accueillir un client ?"];
          defaults.forEach((d) => { if (!suggestions.includes(d)) suggestions.push(d); });
        }

        return NextResponse.json({ weaknessSuggestions: [...new Set(suggestions)].slice(0, 6) });
      } catch {
        return NextResponse.json({ weaknessSuggestions: ["Combien dans le fonds de caisse ?", "Que veut dire le drapeau jaune ?", "Comment accueillir un client ?"] });
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
        return NextResponse.json({ response: "Vas-y, pose-moi ta question 🙂", nextSuggestions: FOLLOW_UP["général"] });
      }

      // Suite à une proposition « Veux-tu que je t'en dise plus sur « X » ? »
      let effectiveQuery = message;
      const lastAi = [...history].reverse().find((h: any) => h.role === "ai" || h.role === "assistant");
      const offerMatch = lastAi ? String(lastAi.content).match(/dise plus sur\s*«\s*(.+?)\s*»/) : null;
      const affirm = /^(oui|ouais|yes|yep|ok|okay|vas[- ]?y|continue|explique|dis[- ]?moi|je veux|carrement|bien sur|certain|sure|svp|s'il te plait)\b/.test(norm(message).trim());
      const decline = /^(non|nope|pas besoin|non merci|ca va|c'est bon)\b/.test(norm(message).trim());

      if (offerMatch && affirm) {
        // L'employé a dit oui → on enchaîne sur le sujet proposé
        effectiveQuery = offerMatch[1];
      } else if (offerMatch && decline) {
        return NextResponse.json({ response: "Pas de souci 🙂 Pose-moi autre chose quand tu veux — caisse, piste ou service client.", sources: [], nextSuggestions: FOLLOW_UP["général"] });
      } else {
        // Réponse humaine pour les salutations / petites discussions
        const human = humanReply(message);
        if (human) {
          return NextResponse.json({ response: human, sources: [], nextSuggestions: FOLLOW_UP["général"] });
        }
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
      const { response, sources, category } = buildSmartResponse(effectiveQuery, docs);

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

      // Sauvegarder dans qa_history
      try {
        await supabaseAdmin.from("qa_history").insert({
          employee_id: employee.id,
          query: message,
          response_preview: response.slice(0, 200),
          sources: sources.join(", "),
        });
      } catch {}

      return NextResponse.json({ response, sources, nextSuggestions });
    }

    // ─── Historique de l'employé ─────────────────────────
    if (body.action === "myHistory") {
      const { data } = await supabaseAdmin
        .from("qa_history")
        .select("id, query, response_preview, sources, created_at")
        .eq("employee_id", employee.id)
        .order("created_at", { ascending: false })
        .limit(50);

      return NextResponse.json({ history: data || [] });
    }

    // ─── Supprimer une entrée d'historique ───────────────
    if (body.action === "deleteHistory") {
      await supabaseAdmin
        .from("qa_history")
        .delete()
        .eq("id", body.historyId)
        .eq("employee_id", employee.id);
      return NextResponse.json({ success: true });
    }

    // ─── Historique de tous les employés (gérant/patron) ─
    if (body.action === "allHistory") {
      const { data: emp } = await supabase
        .from("employees")
        .select("role")
        .eq("auth_user_id", user.id)
        .single();

      if (!emp || (emp.role !== "manager" && emp.role !== "patron" && emp.role !== "developpeur")) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }

      const { data } = await supabaseAdmin
        .from("qa_history")
        .select(`
          id, query, response_preview, sources, created_at,
          employees!inner(first_name, last_name)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      return NextResponse.json({ history: data || [] });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
