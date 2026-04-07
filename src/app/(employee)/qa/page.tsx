import { ChatInterface } from "@/components/qa/ChatInterface";

export default function QAPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Questions & Réponses</h1>
      <p className="text-sm text-gray-500">
        Pose n'importe quelle question sur les procédures, le manuel ou l'entreprise.
      </p>
      <ChatInterface />
    </div>
  );
}
