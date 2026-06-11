-- Questions que l'employé rate ENCORE : on garde sa DERNIÈRE réponse par
-- question et on ne renvoie que celles toujours fausses (à revoir).
-- Renvoie aussi la bonne réponse, l'explication et la catégorie (poste).
CREATE OR REPLACE FUNCTION public.employee_mistakes(p_emp uuid)
RETURNS TABLE(
  question_id uuid,
  question text,
  correct text,
  explanation text,
  category text,
  module_title text
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $fn$
  WITH latest AS (
    SELECT DISTINCT ON (qa.question_id) qa.question_id, qa.is_correct
    FROM public.quiz_answers qa
    JOIN public.quiz_attempts att ON att.id = qa.attempt_id
    WHERE att.employee_id = p_emp
    ORDER BY qa.question_id, qa.answered_at DESC
  )
  SELECT qq.id, qq.question_text, c.choice_text, qq.explanation, tm.category, tm.title
  FROM latest l
  JOIN public.quiz_questions qq ON qq.id = l.question_id
  JOIN public.quizzes q ON q.id = qq.quiz_id
  JOIN public.training_chapters tc ON tc.id = q.chapter_id
  JOIN public.training_modules tm ON tm.id = tc.module_id
  LEFT JOIN public.quiz_choices c ON c.question_id = qq.id AND c.is_correct = true
  WHERE l.is_correct = false
  ORDER BY tm.category, tm.title;
$fn$;
