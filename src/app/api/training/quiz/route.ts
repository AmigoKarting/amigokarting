import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { quizId, answers } = await req.json();

    // ─── Validation ──────────────────────────────────────────
    if (!quizId || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: "quizId et answers[] requis" },
        { status: 400 }
      );
    }

    // ─── Auth ────────────────────────────────────────────────
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: employee } = await supabase
      .from("employees")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!employee) {
      return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });
    }

    // ─── Récupérer le quiz et son seuil de passage ───────────
    const { data: quiz } = await supabase
      .from("quizzes")
      .select("id, passing_score, max_attempts")
      .eq("id", quizId)
      .single();

    if (!quiz) {
      return NextResponse.json({ error: "Quiz introuvable" }, { status: 404 });
    }

    // ─── Vérifier la limite de tentatives ────────────────────
    if (quiz.max_attempts) {
      const { count } = await supabase
        .from("quiz_attempts")
        .select("*", { count: "exact", head: true })
        .eq("employee_id", employee.id)
        .eq("quiz_id", quizId);

      if ((count || 0) >= quiz.max_attempts) {
        return NextResponse.json(
          { error: "Nombre maximum de tentatives atteint." },
          { status: 403 }
        );
      }
    }

    // ─── Récupérer les questions avec les bonnes réponses ────
    const { data: questions } = await supabase
      .from("quiz_questions")
      .select("id, question_text, explanation, points, quiz_choices(id, is_correct)")
      .eq("quiz_id", quizId);

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: "Aucune question dans ce quiz" }, { status: 404 });
    }

    // ─── Corriger chaque réponse ─────────────────────────────
    const correctedAnswers = answers.map((a: { questionId: string; choiceId: string }) => {
      const question = questions.find((q) => q.id === a.questionId);
      if (!question) return { ...a, is_correct: false, points: 0 };

      const choices = (question as any).quiz_choices || [];
      const selectedChoice = choices.find((c: any) => c.id === a.choiceId);

      return {
        questionId: a.questionId,
        choiceId: a.choiceId,
        is_correct: selectedChoice?.is_correct === true,
        points: (question as any).points || 1,
      };
    });

    // ─── Calculer le score ───────────────────────────────────
    const totalPoints = correctedAnswers.reduce((s: number, a: any) => s + a.points, 0);
    const earnedPoints = correctedAnswers
      .filter((a: any) => a.is_correct)
      .reduce((s: number, a: any) => s + a.points, 0);

    const score = totalPoints > 0 ? earnedPoints / totalPoints : 0;
    const scorePercent = Math.round(score * 100);
    const passed = score >= quiz.passing_score;
    const correctCount = correctedAnswers.filter((a: any) => a.is_correct).length;

    // ─── Créer la tentative ──────────────────────────────────
    const { data: attempt, error: attemptError } = await supabase
      .from("quiz_attempts")
      .insert({
        employee_id: employee.id,
        quiz_id: quizId,
        score: Math.round(score * 10000) / 10000,
        total_points: earnedPoints,
        max_points: totalPoints,
        passed,
        completed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (attemptError || !attempt) {
      console.error("Erreur création tentative:", attemptError);
      return NextResponse.json(
        { error: "Erreur sauvegarde de la tentative" },
        { status: 500 }
      );
    }

    // ─── Enregistrer chaque réponse ──────────────────────────
    const answerRows = correctedAnswers.map((a: any) => ({
      attempt_id: attempt.id,
      question_id: a.questionId,
      choice_id: a.choiceId,
      is_correct: a.is_correct,
    }));

    const { error: answersError } = await supabase
      .from("quiz_answers")
      .insert(answerRows);

    if (answersError) {
      console.error("Erreur sauvegarde réponses:", answersError);
      // La tentative est déjà créée, on ne bloque pas
    }

    // ─── Récupérer les explications des mauvaises réponses ───
    const wrongQuestionIds = correctedAnswers
      .filter((a: any) => !a.is_correct)
      .map((a: any) => a.questionId);

    let corrections: any[] = [];
    if (wrongQuestionIds.length > 0) {
      const { data: wrongQuestions } = await supabase
        .from("quiz_questions")
        .select("id, question_text, explanation")
        .in("id", wrongQuestionIds);

      corrections = wrongQuestions || [];
    }

    // ─── Réponse ─────────────────────────────────────────────
    return NextResponse.json({
      score: scorePercent,
      passed,
      total: correctedAnswers.length,
      correct: correctCount,
      earnedPoints,
      totalPoints,
      passingScore: Math.round(quiz.passing_score * 100),
      attemptId: attempt.id,
      corrections,
    });
  } catch (err) {
    console.error("Erreur API quiz:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
