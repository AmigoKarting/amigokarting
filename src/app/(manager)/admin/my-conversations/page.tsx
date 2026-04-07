"use client";
import { VoiceInterface } from "@/components/conversations/VoiceInterface";

export default function ManagerConversationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Conversations IA</h1>
        <p className="text-sm text-gray-500">
          Révise les procédures en parlant avec l'assistant vocal.
        </p>
      </div>
      <VoiceInterface />
    </div>
  );
}
