import { openai } from "./client";

interface GeneratedQuestion {
  question_text: string;
  explanation: string;
  choices: { choice_text: string; is_correct: boolean }[];
}

export async function generateQuizQuestions(
  topic: string,
  count: number = 5
): Promise<GeneratedQuestion[]> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `Génère ${count} questions quiz à choix multiples pour la formation 
des employés d'un karting. Chaque question doit avoir 4 choix dont 1 seul correct.
Inclus une explication pour chaque question.
Réponds en JSON strict avec ce format :
[{ "question_text": "...", "explanation": "...", "choices": [{ "choice_text": "...", "is_correct": true/false }] }]`,
      },
      { role: "user", content: `Sujet : ${topic}` },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content || "{}";
  const parsed = JSON.parse(content);
  return parsed.questions || parsed;
}
