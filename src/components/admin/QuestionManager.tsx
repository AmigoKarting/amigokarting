"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { ConversationQuestion } from "@/types/conversation";

export function QuestionManager({ questions }: { questions: ConversationQuestion[] }) {
  const router = useRouter();
  const [newQuestion, setNewQuestion] = useState("");
  const [adding, setAdding] = useState(false);

  async function addQuestion() {
    if (!newQuestion.trim()) return;
    setAdding(true);
    await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", questionText: newQuestion, isPriority: false }),
    });
    setNewQuestion("");
    setAdding(false);
    router.refresh();
  }

  async function togglePriority(id: string, current: boolean) {
    await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "togglePriority", questionId: id, isPriority: !current }),
    });
    router.refresh();
  }

  async function deleteQuestion(id: string) {
    await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", questionId: id }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input
          type="text"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="Ajouter une question manuellement..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        <Button onClick={addQuestion} disabled={adding || !newQuestion.trim()}>
          {adding ? "..." : "Ajouter"}
        </Button>
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        {questions.map((q) => (
          <div key={q.id} className="flex items-center gap-3 border-b px-4 py-3 last:border-0">
            <button
              onClick={() => togglePriority(q.id, q.is_priority)}
              className={`rounded-full px-2 py-0.5 text-xs font-medium transition ${
                q.is_priority
                  ? "bg-brand-100 text-brand-700"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {q.is_priority ? "Prioritaire" : "Normal"}
            </button>
            <p className="flex-1 text-sm">{q.question_text}</p>
            <span className="text-xs text-gray-400">{q.source}</span>
            <button
              onClick={() => deleteQuestion(q.id)}
              className="text-xs text-red-400 hover:text-red-600"
            >
              Supprimer
            </button>
          </div>
        ))}
        {questions.length === 0 && (
          <p className="p-6 text-center text-sm text-gray-400">Aucune question. Ajoutez-en ou générez-en via les paramètres.</p>
        )}
      </div>
    </div>
  );
}
