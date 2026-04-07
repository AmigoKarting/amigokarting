import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json({ error: "Fichier audio manquant" }, { status: 400 });
    }

    // Vérifier la taille (max 25 MB pour Whisper)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 25 MB)" }, { status: 400 });
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "fr",
      response_format: "text",
    });

    // Whisper retourne directement le texte quand response_format = "text"
    const text = typeof transcription === "string"
      ? transcription
      : transcription.text;

    return NextResponse.json({ text: text.trim() });
  } catch (err: any) {
    console.error("Erreur speech-to-text:", err);
    return NextResponse.json(
      { error: "Impossible de transcrire l'audio. Réessaie." },
      { status: 500 }
    );
  }
}
