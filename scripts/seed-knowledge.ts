/**
 * Script pour peupler la base de connaissances avec le manuel d'Amigo Karting.
 *
 * Usage :
 *   1. Configurer .env.local (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY)
 *   2. Exécuter la migration 006_qa_knowledge_base.sql
 *   3. Lancer : npx tsx scripts/seed-knowledge.ts
 *
 * Pour importer votre VRAI manuel :
 *   - Remplacez le contenu de MANUAL_SECTIONS par vos propres textes
 *   - Ou utilisez l'API admin POST /api/admin/knowledge { action: "import", ... }
 */

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// ─── Contenu du manuel (exemple) ────────────────────────────────
// Remplacez par le VRAI contenu de votre manuel d'employé
const MANUAL_SECTIONS = [
  {
    title: "Accueil des clients",
    category: "accueil",
    content: `Quand un client arrive chez Amigo Karting, il faut l'accueillir avec le sourire dans les 30 premières secondes. Dis "Bonjour, bienvenue chez Amigo Karting !" et demande-lui s'il a une réservation. Si oui, vérifie dans le système Agendrix. Si non, explique les forfaits disponibles.

Les forfaits sont : Tour simple (10 minutes, 1 course), Forfait 3 tours (3 courses, 15% de rabais), Forfait groupe (6+ personnes, 20% de rabais), et Forfait fête (inclut salle privée, pizza, boissons). Toujours proposer le forfait supérieur — par exemple si le client veut un tour simple, mentionne le forfait 3 tours.

En cas de file d'attente : informe le client du temps d'attente approximatif (compte 12 minutes par groupe sur la piste). Propose-lui de s'inscrire et d'attendre dans la zone arcade ou au snack-bar. Ne jamais laisser un client sans information sur son temps d'attente.`,
  },
  {
    title: "Distribution et gestion des casques",
    category: "sécurité",
    content: `Le port du casque est OBLIGATOIRE pour tous les pilotes sans exception. Aucun client ne peut accéder à la piste sans casque, même pour "juste un tour".

Procédure de distribution :
1. Demande la taille de tête du client ou estime visuellement.
2. Propose un casque et demande au client de l'essayer.
3. Le casque doit être ajusté : il ne doit pas bouger quand le client secoue la tête, mais ne doit pas serrer au point d'être inconfortable.
4. Vérifie que la jugulaire est bien attachée et serrée (un doigt doit passer entre la sangle et le menton).

Après chaque utilisation, le casque doit être désinfecté avec le spray antibactérien (bouteille bleue) à l'intérieur et à l'extérieur. Laisser sécher 30 secondes avant de remettre en circulation.

Si un casque est endommagé (fissure, mousse décollée, jugulaire cassée), le retirer IMMÉDIATEMENT de la circulation. Le mettre dans le bac rouge "Casques défectueux" et noter le numéro du casque dans le registre. Aviser le gestionnaire.`,
  },
  {
    title: "Briefing de sécurité pré-course",
    category: "sécurité",
    content: `Le briefing de sécurité est OBLIGATOIRE avant chaque session de course. Même si un client est un habitué, il doit écouter le briefing. Le briefing dure environ 2 minutes.

Points à couvrir dans le briefing :
- Règle numéro 1 : PAS DE CONTACT. On ne pousse pas, on ne frappe pas le kart d'un autre pilote.
- Garder les deux mains sur le volant en tout temps.
- Les pieds : pied droit = accélérateur, pied gauche = frein. Ne jamais utiliser les deux en même temps.
- Maintenir une distance de 2 mètres (une longueur de kart) avec le pilote devant.
- Les dépassements se font UNIQUEMENT dans les lignes droites, jamais dans les virages.
- Signaux des drapeaux : VERT = départ/course normale, JAUNE = attention/ralentir/pas de dépassement, ROUGE = arrêt immédiat (freiner progressivement et s'arrêter sur le côté), DAMIER = fin de course (dernier tour puis rentrer au stand).
- En cas de tête-à-queue ou d'arrêt : rester dans le kart, lever le bras pour signaler, attendre qu'un employé vienne aider.
- Vitesse maximale : les karts sont limités électroniquement. Ne JAMAIS tenter de modifier les réglages.`,
  },
  {
    title: "Procédures d'urgence",
    category: "sécurité",
    content: `En cas d'accident ou d'incident sur la piste :

ÉTAPE 1 — ARRÊTER LA COURSE
Agiter immédiatement le drapeau ROUGE. Tous les pilotes doivent s'arrêter. Couper l'alimentation des karts via le bouton d'arrêt d'urgence (boîtier rouge sur le mur du stand).

ÉTAPE 2 — SÉCURISER LA ZONE
Aller vers le lieu de l'incident. Empêcher les autres karts d'approcher. Si un kart bloque la piste, ne PAS essayer de le déplacer si un pilote est blessé.

ÉTAPE 3 — ÉVALUER LA SITUATION
Si le pilote est conscient et peut bouger : l'aider à sortir du kart et l'amener au stand. Si le pilote est inconscient, ne bouge pas, ou se plaint de douleurs au cou/dos : NE PAS LE DÉPLACER. Appeler le 911 immédiatement.

ÉTAPE 4 — PREMIERS SOINS
La trousse de premiers soins est dans l'armoire blanche à côté du stand. Pour les blessures mineures (égratignures, bosses), nettoyer et appliquer un pansement. Pour tout ce qui est plus grave, attendre les paramédics.

ÉTAPE 5 — RAPPORT
Remplir le formulaire d'incident (classeur orange sur le bureau du gestionnaire). Noter : date, heure, nom du client, description de l'incident, actions prises. Prendre des photos si possible.

Numéros d'urgence affichés au stand : 911, Centre antipoison (1-800-463-5060), Gestionnaire de garde.`,
  },
  {
    title: "Ouverture du centre",
    category: "opérations",
    content: `Checklist d'ouverture (arriver 30 minutes avant l'ouverture) :

1. Désarmer le système d'alarme (code sur le babillard du bureau).
2. Allumer les lumières : interrupteur principal dans le local électrique, puis les lumières de la piste.
3. Vérifier la piste : faire un tour à pied, ramasser tout débris, vérifier que les barrières sont en place.
4. Inspection des karts : vérifier chaque kart — pneus (pression visuelle), direction (tourner le volant), freins (tester), charge de batterie (tableau de bord). Un kart qui ne passe pas l'inspection va dans la zone "Hors service" avec une étiquette rouge.
5. Préparer les casques : vérifier qu'il y en a suffisamment de chaque taille, que tous sont propres.
6. Allumer les ordinateurs : caisse, système de réservation, affichage des temps.
7. Vérifier la caisse : compter le fond de caisse (200$), noter dans le registre.
8. Mettre la musique d'ambiance (playlist Spotify "Amigo Karting").`,
  },
  {
    title: "Gestion de la caisse",
    category: "opérations",
    content: `Modes de paiement acceptés : comptant, débit, crédit (Visa, Mastercard, Amex). Les cartes-cadeaux Amigo Karting sont aussi acceptées.

Pour chaque transaction :
1. Sélectionner le forfait dans le système de caisse.
2. Appliquer les rabais si applicable (groupe 20%, membre 10%, promotion en cours).
3. Demander le mode de paiement.
4. Remettre le reçu au client.

Remboursements : seul le gestionnaire peut autoriser un remboursement. Si un client demande un remboursement, noter son nom et numéro de téléphone, et aviser le gestionnaire.

Fermeture de caisse :
1. Imprimer le rapport Z (bouton "Fin de journée" dans le système).
2. Compter l'argent comptant.
3. Le total comptant + les transactions électroniques doit correspondre au rapport Z (tolérance de 5$).
4. Mettre l'argent dans l'enveloppe marquée avec la date, sceller, et déposer dans le coffre.
5. Laisser le fond de caisse de 200$ pour le lendemain.`,
  },
  {
    title: "Fermeture du centre",
    category: "opérations",
    content: `Checklist de fermeture (dernière course 30 minutes avant la fermeture) :

1. Dernière course : annoncer "Dernière course dans 5 minutes" au micro.
2. Après la dernière course : ramener tous les karts au stand, les brancher pour la recharge.
3. Fermeture de caisse (voir procédure caisse).
4. Nettoyage : balayer la zone d'accueil, vider les poubelles, nettoyer les tables du snack-bar.
5. Désinfection des casques : tous les casques utilisés dans la journée.
6. Rangement : remettre les cônes, drapeaux, et équipements à leur place.
7. Vérification finale : tour complet du centre, vérifier que personne n'est encore dans le bâtiment.
8. Éteindre les lumières de la piste, puis les lumières intérieures.
9. Activer le système d'alarme.
10. Verrouiller toutes les portes (porte principale, porte arrière, porte du garage).

NE JAMAIS partir sans avoir activé l'alarme et vérifié TOUTES les portes.`,
  },
];

// ─── Fonction principale ────────────────────────────────────────
async function main() {
  console.log("══════════════════════════════════════════════");
  console.log("  Amigo Karting — Import du manuel");
  console.log("══════════════════════════════════════════════\n");

  // Vérifier la connexion
  const { count } = await supabase
    .from("knowledge_documents")
    .select("*", { count: "exact", head: true });

  console.log(`Documents existants : ${count || 0}\n`);

  let totalChunks = 0;

  for (const section of MANUAL_SECTIONS) {
    process.stdout.write(`📄 ${section.title} [${section.category}]... `);

    // Découper en chunks (~800 tokens par chunk)
    const chunks = chunkText(section.content, 800, 100);

    for (let i = 0; i < chunks.length; i++) {
      const chunkTitle =
        chunks.length > 1
          ? `${section.title} (${i + 1}/${chunks.length})`
          : section.title;

      // Générer l'embedding
      const embRes = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunks[i],
      });

      const embedding = embRes.data[0].embedding;
      const tokenCount = embRes.usage.total_tokens;

      // Insérer
      const { error } = await supabase.from("knowledge_documents").insert({
        title: chunkTitle,
        content: chunks[i],
        category: section.category,
        source_file: "manuel-employe.md",
        chunk_index: i,
        embedding,
        token_count: tokenCount,
      });

      if (error) {
        console.error(`\n  ❌ Erreur: ${error.message}`);
      } else {
        totalChunks++;
      }
    }

    console.log(`✅ ${chunks.length} chunk(s)`);

    // Petite pause pour respecter les rate limits OpenAI
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\n══════════════════════════════════════════════`);
  console.log(`  Terminé ! ${totalChunks} chunks importés.`);
  console.log(`══════════════════════════════════════════════\n`);

  // Vérification
  const { count: finalCount } = await supabase
    .from("knowledge_documents")
    .select("*", { count: "exact", head: true });

  console.log(`Total documents en base : ${finalCount}`);
}

function chunkText(text: string, maxTokens: number, overlap: number): string[] {
  const maxChars = maxTokens * 4;
  const overlapChars = overlap * 4;
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    if ((current + "\n\n" + trimmed).length > maxChars && current) {
      chunks.push(current.trim());
      const words = current.split(/\s+/);
      const overlapWords = Math.floor(overlapChars / 5);
      current = words.slice(-overlapWords).join(" ") + "\n\n" + trimmed;
    } else {
      current = current ? current + "\n\n" + trimmed : trimmed;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  if (chunks.length === 0 && text.trim()) chunks.push(text.trim().slice(0, maxChars));
  return chunks;
}

main().catch(console.error);
