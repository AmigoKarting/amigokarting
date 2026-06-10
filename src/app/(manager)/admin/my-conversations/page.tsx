import { VoiceInterface } from "@/components/conversations/VoiceInterface";

export default function ConversationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Conversations IA</h1>
        <span className="rounded-md bg-orange-50 px-2.5 py-1 text-xs font-semibold text-brand-700">BÊTA</span>
      </div>
      <VoiceInterface />
    </div>
  );
}