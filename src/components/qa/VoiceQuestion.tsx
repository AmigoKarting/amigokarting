"use client";
import { AudioRecorder } from "@/components/conversations/AudioRecorder";

interface Props {
  onQuestion: (text: string) => void;
  disabled?: boolean;
}

export function VoiceQuestion({ onQuestion, disabled }: Props) {
  return (
    <div className="flex flex-col items-center gap-2">
      <AudioRecorder onTranscription={onQuestion} disabled={disabled} />
      <span className="text-xs text-gray-400">Appuie pour poser une question vocale</span>
    </div>
  );
}
