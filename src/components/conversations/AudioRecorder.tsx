"use client";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

interface Props {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

export function AudioRecorder({ onTranscription, disabled }: Props) {
  const { isRecording, audioBlob, startRecording, stopRecording, transcribe } = useVoiceRecorder();

  async function handleStop() {
    stopRecording();
    // Le hook met à jour audioBlob, on le transcrit ensuite
    if (audioBlob) {
      const text = await transcribe(audioBlob);
      onTranscription(text);
    }
  }

  return (
    <button
      onClick={isRecording ? handleStop : startRecording}
      disabled={disabled}
      className={`flex h-14 w-14 items-center justify-center rounded-full text-white transition ${
        isRecording ? "animate-pulse bg-red-500" : "bg-brand-500 hover:bg-brand-600"
      } disabled:opacity-50`}
      aria-label={isRecording ? "Arrêter l'enregistrement" : "Enregistrer"}
    >
      {isRecording ? "⏹" : "🎤"}
    </button>
  );
}
