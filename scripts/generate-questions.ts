/**
 * Script pour générer des questions de conversation IA via GPT-4o.
 * Usage : npm run generate:questions
 */
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const TOPICS = [
  "Règles de sécurité sur la piste de karting",
  "Procédures d'accueil des clients",
  "Gestion des casques et équipements",
  "Procédures d'urgence et premiers soins",
  "Entretien et inspection des karts",
  "Gestion de la caisse et des paiements",
  "Règles pour les groupes et fêtes d'anniversaire",
  "Nettoyage et fermeture du centre",
];

async function main() {
  console.log("Génération de questions pour les conversations IA...\n");

  for (const topic of TOPICS) {
    console.log(`📋 ${topic}`);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "system",
        content: `Génère 10 questions de formation pour les employés d'un karting.
Sujet : ${topic}
Réponds en JSON : [{"question_text": "...", "category": "${topic}"}]`,
      }],
      response_format: { type: "json_object" },
    });

    const content = JSON.parse(response.choices[0].message.content || "{}");
    const questions = content.questions || content;

    const rows = questions.map((q: any) => ({
      question_text: q.question_text,
      category: topic,
      source: "generated",
      is_priority: false,
    }));

    const { error } = await supabase.from("conversation_questions").insert(rows);
    if (error) console.error(`  Erreur: ${error.message}`);
    else console.log(`  ✓ ${rows.length} questions ajoutées`);
  }

  console.log("\nTerminé !");
}

main().catch(console.error);
