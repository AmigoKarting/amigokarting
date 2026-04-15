import { VoiceInterface } from "@/components/conversations/VoiceInterface";

export default function ConversationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Conversations IA</h1>
        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">BÊTA</span>
      </div>
      <VoiceInterface />
    </div>
  );
}