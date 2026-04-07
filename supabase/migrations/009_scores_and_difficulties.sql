-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Amigo Karting — 009 : Score global et suivi des difficultés     ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ─── Vue : difficultés par employé (questions ratées avec détails) ─
CREATE OR REPLACE VIEW public.employee_difficulties AS
SELECT
  e.id AS employee_id,
  e.first_name,
  e.last_name,
  qq.id AS question_id,
  qq.question_text,
  qq.explanation,
  q.title AS quiz_title,
  tc.title AS chapter_title,
  tm.title AS module_title,
  COUNT(qa.id) AS times_wrong,
  MAX(qa.answered_at) AS last_wrong_at,
  -- Vérifier si l'employé a fini par avoir la bonne réponse
  EXISTS (
    SELECT 1 FROM quiz_answers qa2
    JOIN quiz_attempts att2 ON att2.id = qa2.attempt_id
    WHERE qa2.question_id = qq.id
      AND att2.employee_id = e.id
      AND qa2.is_correct = true
  ) AS eventually_correct
FROM quiz_answers qa
JOIN quiz_questions qq ON qq.id = qa.question_id
JOIN quiz_attempts att ON att.id = qa.attempt_id
JOIN quizzes q ON q.id = att.quiz_id
JOIN training_chapters tc ON tc.id = q.chapter_id
JOIN training_modules tm ON tm.id = tc.module_id
JOIN employees e ON e.id = att.employee_id
WHERE qa.is_correct = false
  AND e.is_active = true
GROUP BY e.id, e.first_name, e.last_name, qq.id, qq.question_text,
         qq.explanation, q.title, tc.title, tm.title
ORDER BY e.last_name, times_wrong DESC;

-- ─── Vue : score global par employé ───────────────────────────────
-- Combine : formation (vidéos), quiz, conversations IA, Q&A
CREATE OR REPLACE VIEW public.employee_global_score AS
SELECT
  e.id AS employee_id,
  e.first_name,
  e.last_name,
  e.role,

  -- Formation : % vidéos complétées
  COALESCE(vid.completed_videos, 0) AS completed_videos,
  COALESCE(vid.total_videos, 0) AS total_videos,
  CASE WHEN COALESCE(vid.total_videos, 0) = 0 THEN 0
    ELSE ROUND(vid.completed_videos::NUMERIC / vid.total_videos * 100)
  END AS formation_pct,

  -- Quiz : moyenne des scores + nb réussis
  COALESCE(quiz.total_attempts, 0) AS quiz_attempts,
  COALESCE(quiz.quizzes_passed, 0) AS quizzes_passed,
  COALESCE(quiz.avg_score, 0) AS quiz_avg_score,
  COALESCE(quiz.wrong_answers, 0) AS quiz_wrong_answers,

  -- Conversations IA : heures + note moyenne
  COALESCE(conv.total_sessions, 0) AS conv_sessions,
  COALESCE(conv.total_seconds, 0) AS conv_total_seconds,
  ROUND(COALESCE(conv.total_seconds, 0)::NUMERIC / 3600, 1) AS conv_hours,
  COALESCE(conv.avg_rating, 0) AS conv_avg_rating,

  -- Q&A : nombre de questions posées
  COALESCE(qalogs.questions_asked, 0) AS qa_questions_asked,

  -- Score global (sur 100)
  -- Formation 40% + Quiz 30% + Conversations 20% + Q&A 10%
  ROUND(
    CASE WHEN COALESCE(vid.total_videos, 0) = 0 THEN 0
      ELSE vid.completed_videos::NUMERIC / vid.total_videos * 40
    END
    + COALESCE(quiz.avg_score, 0) * 30
    + LEAST(COALESCE(conv.total_seconds, 0)::NUMERIC / 3600, 5) / 5 * 20
    + LEAST(COALESCE(qalogs.questions_asked, 0), 20)::NUMERIC / 20 * 10
  ) AS global_score,

  -- Dernière activité
  GREATEST(
    vid.last_video_at,
    quiz.last_quiz_at,
    conv.last_conv_at,
    qalogs.last_qa_at
  ) AS last_activity_at

FROM employees e

-- Formation
LEFT JOIN (
  SELECT
    wl.employee_id,
    COUNT(*) FILTER (WHERE wl.completed) AS completed_videos,
    (SELECT COUNT(*) FROM training_videos) AS total_videos,
    MAX(wl.updated_at) AS last_video_at
  FROM video_watch_log wl
  GROUP BY wl.employee_id
) vid ON vid.employee_id = e.id

-- Quiz
LEFT JOIN (
  SELECT
    att.employee_id,
    COUNT(att.id) AS total_attempts,
    COUNT(att.id) FILTER (WHERE att.passed) AS quizzes_passed,
    ROUND(AVG(att.score) FILTER (WHERE att.completed_at IS NOT NULL), 2) AS avg_score,
    (SELECT COUNT(*) FROM quiz_answers qa2 
     JOIN quiz_attempts att2 ON att2.id = qa2.attempt_id 
     WHERE att2.employee_id = att.employee_id AND qa2.is_correct = false
    ) AS wrong_answers,
    MAX(att.completed_at) AS last_quiz_at
  FROM quiz_attempts att
  GROUP BY att.employee_id
) quiz ON quiz.employee_id = e.id

-- Conversations
LEFT JOIN (
  SELECT
    cs.employee_id,
    COUNT(cs.id) AS total_sessions,
    COALESCE(SUM(cs.duration_sec), 0) AS total_seconds,
    ROUND(AVG(cs.rating)::NUMERIC, 1) AS avg_rating,
    MAX(cs.started_at) AS last_conv_at
  FROM conversation_sessions cs
  GROUP BY cs.employee_id
) conv ON conv.employee_id = e.id

-- Q&A
LEFT JOIN (
  SELECT
    ql.employee_id,
    COUNT(ql.id) AS questions_asked,
    MAX(ql.created_at) AS last_qa_at
  FROM qa_logs ql
  GROUP BY ql.employee_id
) qalogs ON qalogs.employee_id = e.id

WHERE e.is_active = true
ORDER BY global_score DESC NULLS LAST;
