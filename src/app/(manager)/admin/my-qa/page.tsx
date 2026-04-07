import { ChatInterface } from "@/components/qa/ChatInterface";

export default function ManagerQAPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Questions &amp; Réponses</h1>
        <p className="text-sm text-gray-500">
          Pose n'importe quelle question sur les procédures, le manuel ou l'entreprise.
        </p>
      </div>
      <ChatInterface />
    </div>
  );
}
