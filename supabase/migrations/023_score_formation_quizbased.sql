-- La « note » (employee_global_score) ne dépend plus des VIDÉOS (qu'il n'y a
-- quasiment pas → la part Formation restait à 0 et plafonnait tout le monde
-- à 60). La Formation (40%) est maintenant la COUVERTURE des quiz : quiz
-- réussis / total des quiz du périmètre du poste (caisse/piste = leur
-- catégorie ; employé/gérant = tout). Objectifs conversation (2h) et Q&A
-- (10 questions) abaissés pour que 100 soit atteignable.
-- Note: on garde les noms de colonnes completed_videos/total_videos pour la
-- compatibilité (CREATE OR REPLACE), mais ils représentent désormais
-- « quiz réussis / total quiz ».
CREATE OR REPLACE VIEW public.employee_global_score AS
SELECT
  e.id AS employee_id,
  e.first_name,
  e.last_name,
  e.role,
  COALESCE(qz.passed_quizzes, 0) AS completed_videos,
  COALESCE(qz.total_quizzes, 0) AS total_videos,
  CASE WHEN COALESCE(qz.total_quizzes, 0) = 0 THEN 0
    ELSE ROUND(qz.passed_quizzes::NUMERIC / qz.total_quizzes * 100)
  END AS formation_pct,
  COALESCE(quiz.total_attempts, 0) AS quiz_attempts,
  COALESCE(quiz.quizzes_passed, 0) AS quizzes_passed,
  COALESCE(quiz.avg_score, 0) AS quiz_avg_score,
  COALESCE(quiz.wrong_answers, 0) AS quiz_wrong_answers,
  COALESCE(conv.total_sessions, 0) AS conv_sessions,
  COALESCE(conv.total_seconds, 0) AS conv_total_seconds,
  ROUND(COALESCE(conv.total_seconds, 0)::NUMERIC / 3600, 1) AS conv_hours,
  COALESCE(conv.avg_rating, 0) AS conv_avg_rating,
  COALESCE(qalogs.questions_asked, 0) AS qa_questions_asked,
  ROUND(
    CASE WHEN COALESCE(qz.total_quizzes, 0) = 0 THEN 0
      ELSE qz.passed_quizzes::NUMERIC / qz.total_quizzes * 40
    END
    + COALESCE(quiz.avg_score, 0) * 30
    + LEAST(COALESCE(conv.total_seconds, 0)::NUMERIC / 3600, 2) / 2 * 20
    + LEAST(COALESCE(qalogs.questions_asked, 0), 10)::NUMERIC / 10 * 10
  ) AS global_score,
  GREATEST(vid.last_video_at, quiz.last_quiz_at, conv.last_conv_at, qalogs.last_qa_at) AS last_activity_at
FROM employees e
LEFT JOIN LATERAL (
  SELECT
    count(*) AS total_quizzes,
    count(*) FILTER (WHERE z.passed_emp) AS passed_quizzes
  FROM (
    SELECT EXISTS (
      SELECT 1 FROM quiz_attempts a
      WHERE a.employee_id = e.id AND a.quiz_id = q.id AND a.passed
    ) AS passed_emp
    FROM quizzes q
    JOIN training_chapters tc ON tc.id = q.chapter_id
    JOIN training_modules tm ON tm.id = tc.module_id
    WHERE q.is_active AND tm.is_active AND tm.content_type = 'text'
      AND (
        e.role NOT IN ('caisse', 'piste')
        OR (e.role = 'caisse' AND tm.category = 'Caisse - Amigo Karting')
        OR (e.role = 'piste' AND tm.category = 'Piste')
      )
  ) z
) qz ON true
LEFT JOIN (
  SELECT wl.employee_id,
    COUNT(*) FILTER (WHERE wl.completed) AS completed_videos,
    (SELECT COUNT(*) FROM training_videos) AS total_videos,
    MAX(wl.updated_at) AS last_video_at
  FROM video_watch_log wl GROUP BY wl.employee_id
) vid ON vid.employee_id = e.id
LEFT JOIN (
  SELECT att.employee_id,
    COUNT(att.id) AS total_attempts,
    COUNT(att.id) FILTER (WHERE att.passed) AS quizzes_passed,
    ROUND(AVG(att.score) FILTER (WHERE att.completed_at IS NOT NULL), 2) AS avg_score,
    (SELECT COUNT(*) FROM quiz_answers qa2 JOIN quiz_attempts att2 ON att2.id = qa2.attempt_id
      WHERE att2.employee_id = att.employee_id AND qa2.is_correct = false) AS wrong_answers,
    MAX(att.completed_at) AS last_quiz_at
  FROM quiz_attempts att GROUP BY att.employee_id
) quiz ON quiz.employee_id = e.id
LEFT JOIN (
  SELECT cs.employee_id, COUNT(cs.id) AS total_sessions,
    COALESCE(SUM(cs.duration_sec), 0) AS total_seconds,
    ROUND(AVG(cs.rating)::NUMERIC, 1) AS avg_rating,
    MAX(cs.started_at) AS last_conv_at
  FROM conversation_sessions cs GROUP BY cs.employee_id
) conv ON conv.employee_id = e.id
LEFT JOIN (
  SELECT ql.employee_id, COUNT(ql.id) AS questions_asked, MAX(ql.created_at) AS last_qa_at
  FROM qa_logs ql GROUP BY ql.employee_id
) qalogs ON qalogs.employee_id = e.id
WHERE e.is_active = true
ORDER BY global_score DESC NULLS LAST;
