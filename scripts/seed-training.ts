/**
 * Script pour peupler les modules de formation de base.
 * Usage : npm run seed:training
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MODULES = [
  {
    title: "Accueil et service client",
    description: "Comment accueillir les clients et gérer les réservations",
    chapters: [
      { title: "Premier contact avec le client", videos: ["Salutations et attitude", "Présentation des forfaits"] },
      { title: "Gestion des réservations", videos: ["Système de réservation", "Gestion des groupes"] },
    ],
  },
  {
    title: "Sécurité sur la piste",
    description: "Toutes les procédures de sécurité essentielles",
    chapters: [
      { title: "Équipements de protection", videos: ["Distribution des casques", "Vérification des équipements"] },
      { title: "Briefing de sécurité", videos: ["Règles de la piste", "Signaux et drapeaux"] },
      { title: "Situations d'urgence", videos: ["Accident sur la piste", "Premiers soins de base"] },
    ],
  },
  {
    title: "Opérations quotidiennes",
    description: "Entretien, caisse et fermeture",
    chapters: [
      { title: "Ouverture du centre", videos: ["Checklist d'ouverture", "Inspection des karts"] },
      { title: "Gestion de la caisse", videos: ["Encaissement", "Fermeture de caisse"] },
      { title: "Fermeture du centre", videos: ["Nettoyage", "Sécurisation des lieux"] },
    ],
  },
];

async function main() {
  console.log("Création des modules de formation...\n");

  for (let mi = 0; mi < MODULES.length; mi++) {
    const mod = MODULES[mi];
    const { data: module } = await supabase
      .from("training_modules")
      .insert({ title: mod.title, description: mod.description, sort_order: mi })
      .select()
      .single();

    console.log(`📦 ${mod.title}`);

    for (let ci = 0; ci < mod.chapters.length; ci++) {
      const ch = mod.chapters[ci];
      const { data: chapter } = await supabase
        .from("training_chapters")
        .insert({ module_id: module!.id, title: ch.title, sort_order: ci })
        .select()
        .single();

      for (let vi = 0; vi < ch.videos.length; vi++) {
        await supabase.from("training_videos").insert({
          chapter_id: chapter!.id,
          title: ch.videos[vi],
          video_url: `https://YOUR_SUPABASE.supabase.co/storage/v1/object/public/training-videos/${module!.id}/${chapter!.id}/video_${vi}.mp4`,
          sort_order: vi,
        });
      }

      console.log(`  📖 ${ch.title} (${ch.videos.length} vidéos)`);
    }
  }

  console.log("\nTerminé !");
}

main().catch(console.error);
