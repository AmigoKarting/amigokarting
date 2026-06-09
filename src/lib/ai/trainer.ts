// ─────────────────────────────────────────────────────────────────────────────
// Formateur vocal « mock » alimenté par tout le contenu des quiz (banc de 990
// questions avec bonnes réponses + explications). Permet de poser de vraies
// questions tirées des manuels, d'évaluer une réponse parlée et d'expliquer.
// Aucune dépendance externe : 100 % déterministe, fonctionne sans OpenAI.
// ─────────────────────────────────────────────────────────────────────────────
import rawBank from "./training-bank.json";

export type QType = "mc" | "on" | "vf";

export interface BankQ {
  id: string;
  cat: string;
  mod: string;
  sort: number;
  type: QType;
  q: string;
  correct: string;
  distractors: string[];
  explanation: string;
}

const BANK: BankQ[] = (rawBank as unknown as { questions: BankQ[] }).questions;

export type Quality = "excellent" | "average" | "bad";

interface HistItem {
  role: string; // "assistant" | "ai" | "user" | "employee"
  content: string;
}

// ─── Normalisation & mots-clés ───────────────────────────────────────────────
function strip(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // accents
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP = new Set(
  ("le la les un une des de du d au aux a et ou on il elle ils elles tu te toi je " +
    "me moi nous vous se sa son ses ce cet cette ces que qui quoi est sont c est " +
    "pour par sur dans avec sans pas ne plus moins tres bien faut doit peut etre " +
    "fait faire quand comment pourquoi quel quelle quels quelles oui non vrai faux " +
    "en y lui leur leurs mon ma mes ton ta tes au plus si comme tout tous toute " +
    "toutes meme aussi donc alors car mais ainsi cela ca puis chaque entre vers " +
    "lorsqu lorsque apres avant pendant selon afin").split(" ")
);

function keywords(s: string): Set<string> {
  const out = new Set<string>();
  for (const w of strip(s).split(" ")) {
    if (w.length >= 3 && !STOP.has(w)) out.add(w);
    else if (/^\d+$/.test(w)) out.add(w); // garder les nombres
  }
  return out;
}

function overlap(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const w of a) if (b.has(w)) n++;
  return n;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// ─── Filtres par sujet (topicId de l'UI) ─────────────────────────────────────
const TOPIC_KW: Record<string, string[]> = {
  caisse: ["caisse", "reservation", "tarif", "prix", "remboursement", "telephone", "attente", "apex", "faq"],
  securite: ["securite", "drapeau", "inspection", "prevention", "risque", "regle"],
  urgence: ["accident", "urgence", "blessure", "secours", "evacuation"],
  operations: ["ouverture", "fermeture", "operation", "kart", "mecanique", "essence", "puits", "huddle", "rotation"],
  clients: ["service", "client", "plainte", "recovery", "mecontent", "reservation", "attente", "telephone"],
  casques: ["casque", "briefing", "preparation", "equipement", "depart", "course"],
};

function matchesTopic(q: BankQ, topicId?: string): boolean {
  if (!topicId || topicId === "all") return true;
  if (topicId === "caisse") return q.cat === "Caisse - Amigo Karting";
  const kw = TOPIC_KW[topicId];
  if (!kw) return true;
  const hay = strip(q.cat + " " + q.mod + " " + q.q);
  return kw.some((k) => hay.includes(k));
}

function pool(topicId?: string): BankQ[] {
  const p = BANK.filter((q) => q.q && matchesTopic(q, topicId));
  return p.length > 0 ? p : BANK;
}

// ─── Formulation d'une question (texte parlé) ────────────────────────────────
export function phraseQuestion(q: BankQ): string {
  if (q.type === "vf") return `Vrai ou faux : ${q.q}`;
  return q.q;
}

// ─── Retrouver la question en cours d'après le dernier message de l'IA ───────
export function trainerFindCurrent(lastAiText: string): BankQ | null {
  if (!lastAiText) return null;
  const hay = strip(lastAiText);
  let best: BankQ | null = null;
  let bestLen = 0;
  for (const q of BANK) {
    const nq = strip(q.q);
    if (nq.length >= 12 && hay.includes(nq) && nq.length > bestLen) {
      best = q;
      bestLen = nq.length;
    }
  }
  return best;
}

function lastAi(history: HistItem[]): string {
  for (let i = history.length - 1; i >= 0; i--) {
    const r = history[i].role;
    if (r === "assistant" || r === "ai") return history[i].content;
  }
  return "";
}

function askedIds(history: HistItem[]): Set<string> {
  const ids = new Set<string>();
  for (const h of history) {
    if (h.role === "assistant" || h.role === "ai") {
      const q = trainerFindCurrent(h.content);
      if (q) ids.add(q.id);
    }
  }
  return ids;
}

// ─── Choisir la prochaine question ───────────────────────────────────────────
export function pickQuestion(
  topicId: string | undefined,
  asked: Set<string>,
  weakSubjects?: string[]
): BankQ | null {
  let cands = pool(topicId).filter((q) => !asked.has(q.id));
  if (cands.length === 0) cands = pool(topicId); // tout revu → on recycle

  // Prioriser les sujets faibles de l'employé
  if (weakSubjects && weakSubjects.length > 0) {
    const wk = strip(weakSubjects.join(" "));
    const weak = cands.filter((q) => {
      const m = strip(q.mod + " " + q.cat);
      return wk.split(" ").some((w) => w.length >= 4 && m.includes(w));
    });
    if (weak.length > 0) cands = weak;
  }

  // Favoriser les questions à choix multiples (meilleure valeur de révision orale)
  const mc = cands.filter((q) => q.type === "mc");
  const finalPool = mc.length >= 3 ? mc : cands;

  // Sélection pseudo-aléatoire stable (varie selon le nombre déjà posé)
  const idx = (hash(topicId || "all") + asked.size * 7) % finalPool.length;
  return finalPool[idx] || null;
}

export function pickFirstQuestion(topicId?: string, weakSubjects?: string[]): BankQ | null {
  return pickQuestion(topicId, new Set(), weakSubjects);
}

// ─── Évaluer une réponse parlée ──────────────────────────────────────────────
const UNKNOWN = ["aucune idee", "je sais pas", "sais pas", "sais po", "pas sur", "pas certain", "sais plus", "sais p"];

export interface Evaluation {
  quality: Quality;
  correct: string;
  explanation: string;
}

function polarity(ans: string): "pos" | "neg" | "?" {
  const a = strip(ans);
  const neg = ["faux", "non", "incorrect", "pas vrai", "fausse", "errone"];
  const pos = ["vrai", "oui", "exact", "correct", "c est ca", "tout a fait", "effectivement"];
  if (neg.some((w) => a.includes(w))) return "neg";
  if (pos.some((w) => a.includes(w))) return "pos";
  return "?";
}

export function evaluateAnswer(q: BankQ, answer: string): Evaluation {
  const base: Evaluation = { quality: "bad", correct: q.correct, explanation: q.explanation };
  const a = strip(answer);

  if (!a || UNKNOWN.some((u) => a.includes(u))) return { ...base, quality: "bad" };

  // Vrai/Faux & Oui/Non : comparer la polarité
  if (q.type === "vf" || q.type === "on") {
    const want = q.type === "vf"
      ? (strip(q.correct) === "vrai" ? "pos" : "neg")
      : (strip(q.correct) === "oui" ? "pos" : "neg");
    const got = polarity(answer);
    if (got === "?") return { ...base, quality: "bad" };
    return { ...base, quality: got === want ? "excellent" : "bad" };
  }

  // Choix multiples : chevauchement de mots-clés réponse ↔ (bonne réponse + explication) vs distracteurs
  const ansKW = keywords(answer);
  const correctKW = new Set<string>([...keywords(q.correct), ...keywords(q.explanation)]);
  const sCorrect = overlap(ansKW, correctKW);
  let sDist = 0;
  for (const d of q.distractors) sDist = Math.max(sDist, overlap(ansKW, keywords(d)));

  // Bonus si une formulation forte de la bonne réponse est dite telle quelle
  const correctNorm = strip(q.correct);
  const strongHit = correctNorm.length >= 6 && a.includes(correctNorm.slice(0, Math.min(correctNorm.length, 24)));

  if (strongHit && sDist <= sCorrect) return { ...base, quality: "excellent" };
  if (sCorrect === 0 && sDist === 0) return { ...base, quality: "bad" };
  if (sDist > sCorrect) return { ...base, quality: "bad" };
  if (sCorrect >= 2) return { ...base, quality: "excellent" };
  if (sCorrect >= 1) return { ...base, quality: "average" };
  return { ...base, quality: "bad" };
}

// ─── Rétroaction de coach (style vocal québécois — lu à voix haute, sans emoji) ─
const PRAISE = ["Exactement, c'est ça !", "Parfait, t'as bien compris.", "Excellent, bravo !", "En plein dans le mille !", "Boom, t'as raison !", "Nickel, c'est exactement ça.", "T'as l'affaire !"];
const PARTIAL = ["T'es sur la bonne voie, mais c'est pas complet.", "Bonne idée, manque juste un petit bout.", "Presque ! On précise un peu."];
const WRONG = ["Pas tout à fait, mais c'est correct d'essayer.", "Pas exactement, je te montre.", "Hmm, c'est pas ça cette fois, regarde.", "Bonne tentative, mais non."];
const NEXTLEAD = ["Prochaine.", "On continue.", "Suivante.", "Ok, celle-ci.", "Bon, dis-moi :", "Allez, une autre."];
const STREAK = ["Deux de suite, t'es en feu !", "Encore une bonne, tu enchaînes !", "Belle série, continue comme ça !"];
const PRAISE_STEMS = ["exactement", "parfait", "excellent", "bravo", "mille", "boom", "nickel", "affaire", "suite", "enchaine", "serie", "feu"];

function rnd<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Nombre de bonnes réponses d'affilée juste avant (détecté via les marques d'éloge)
function goodStreak(history: HistItem[]): number {
  let n = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    const h = history[i];
    if (h.role !== "assistant" && h.role !== "ai") continue;
    const t = strip(h.content);
    if (PRAISE_STEMS.some((p) => t.startsWith(p))) n++;
    else break;
  }
  return n;
}

function feedback(ev: Evaluation, streak: number): string {
  const expl = ev.explanation ? ` ${ev.explanation}` : "";
  if (ev.quality === "excellent") {
    const lead = streak >= 2 ? rnd(STREAK) : rnd(PRAISE);
    return `${lead}${expl}`;
  }
  if (ev.quality === "average") {
    return `${rnd(PARTIAL)} La bonne réponse : ${ev.correct}.${expl}`;
  }
  return `${rnd(WRONG)} La bonne réponse, c'est : ${ev.correct}.${expl}`;
}

// ─── Indice pour la question en cours ────────────────────────────────────────
export function trainerHint(q: BankQ): string {
  const kw = [...new Set<string>([...keywords(q.correct), ...keywords(q.explanation)])].slice(0, 5);
  if (kw.length > 0) return `Indice : pense à ${kw.join(", ")}.`;
  return "Indice : repense à la procédure, étape par étape.";
}

// ─── Commandes parlées (ne comptent pas comme une réponse) ───────────────────
const RX_GREET = /\b(salut|allo|allô|bonjour|bonsoir|coucou|hey|yo|hello|bon matin)\b/;
const RX_REPEAT = /\b(repete|repeter|redis|redire|pas compris|comprends pas|comprend pas|pardon|hein|peux tu repeter|encore une fois)\b/;
const RX_REVEAL = /\b(la reponse|donne moi la reponse|donne la reponse|dis moi la reponse|dis la reponse|je veux la reponse|tu peux me la dire)\b/;
const RX_SKIP = /\b(on passe|passe|change|autre question|suivant|suivante|skip|next|change de sujet|autre chose)\b/;
const RX_THANKS = /\b(merci|cool|nice|genial|trop bien)\b/;

// ─── Tour complet : commandes, évaluation, et question suivante ──────────────
export interface TrainerTurn {
  response: string;
  quality: Quality | null;
}

function nextQuestion(opts: { history: HistItem[]; topicId?: string; weakSubjects?: string[] }, current: BankQ | null): BankQ | null {
  const asked = askedIds(opts.history);
  if (current) asked.add(current.id);
  return pickQuestion(opts.topicId, asked, opts.weakSubjects);
}

export function mockTrainerTurn(opts: {
  history: HistItem[];
  topicId?: string;
  answer: string;
  weakSubjects?: string[];
}): TrainerTurn | null {
  const current = trainerFindCurrent(lastAi(opts.history));
  const a = strip(opts.answer);
  const short = a.split(" ").filter(Boolean).length <= 5;

  // ─── Commandes conversationnelles ───────────────────────────────
  if (current && RX_REVEAL.test(a)) {
    const next = nextQuestion(opts, current);
    return {
      response: `La réponse, c'est : ${current.correct}. ${current.explanation}${next ? ` ${rnd(NEXTLEAD)} ${phraseQuestion(next)}` : ""}`,
      quality: null,
    };
  }
  if (current && short && /\b(explique|explique moi|pourquoi|comment ca|je comprends pas|comprends pas)\b/.test(a)) {
    const next = nextQuestion(opts, current);
    return {
      response: `La réponse, c'est : ${current.correct}. ${current.explanation}${next ? ` ${rnd(NEXTLEAD)} ${phraseQuestion(next)}` : ""}`,
      quality: null,
    };
  }
  if (current && short && RX_REPEAT.test(a)) {
    return { response: `Pas de souci, je répète. ${phraseQuestion(current)}`, quality: null };
  }
  if (current && short && RX_SKIP.test(a)) {
    const next = nextQuestion(opts, current);
    return { response: next ? `Ok, on passe à une autre. ${phraseQuestion(next)}` : "Ok ! Tu peux choisir un autre sujet quand tu veux.", quality: null };
  }
  if (short && RX_GREET.test(a)) {
    if (current) return { response: `Salut ! On continue. ${phraseQuestion(current)}`, quality: null };
    const next = nextQuestion(opts, null);
    return { response: `Salut ! On y va. ${next ? phraseQuestion(next) : ""}`.trim(), quality: null };
  }
  if (current && short && RX_THANKS.test(a)) {
    return { response: `Avec plaisir ! On continue. ${phraseQuestion(current)}`, quality: null };
  }

  if (!current) return null; // pas de question identifiée → laisser le fallback gérer

  // ─── Sinon : évaluer comme une vraie réponse ────────────────────
  const ev = evaluateAnswer(current, opts.answer);
  const next = nextQuestion(opts, current);
  const streak = ev.quality === "excellent" ? goodStreak(opts.history) + 1 : 0;
  const fb = feedback(ev, streak);
  const response = next
    ? `${fb} ${rnd(NEXTLEAD)} ${phraseQuestion(next)}`
    : `${fb} On a fait pas mal le tour de ce sujet ! Tu peux en choisir un autre quand tu veux.`;

  return { response, quality: ev.quality };
}
