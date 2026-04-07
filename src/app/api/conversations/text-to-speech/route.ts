import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai/client";

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: "nova",
    input: text,
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": buffer.length.toString(),
    },
  });
}
