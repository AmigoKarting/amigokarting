-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Amigo Karting — 004 : Quiz et résultats                        ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ─── Quiz (rattaché à un chapitre de formation) ─────────────────
CREATE TABLE public.quizzes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id    UUID NOT NULL REFERENCES training_chapters(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  passing_score NUMERIC NOT NULL DEFAULT 0.70   -- 70% pour réussir
                CHECK (passing_score > 0 AND passing_score <= 1),
  max_attempts  INT DEFAULT NULL,               -- NULL = illimité
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_quizzes_chapter ON quizzes(chapter_id);

CREATE TRIGGER trg_quizzes_updated_at
  BEFORE UPDATE ON quizzes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Questions du quiz ──────────────────────────────────────────
CREATE TABLE public.quiz_questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id       UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  explanation   TEXT,                          -- Affichée si mauvaise réponse
  image_url     TEXT,                          -- Optionnel : image dans la question
  points        INT NOT NULL DEFAULT 1         -- Poids de la question
                CHECK (points > 0),
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_questions_quiz ON quiz_questions(quiz_id, sort_order);

-- ─── Choix de réponse ───────────────────────────────────────────
CREATE TABLE public.quiz_choices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id   UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  choice_text   TEXT NOT NULL,
  is_correct    BOOLEAN NOT NULL DEFAULT false,
  sort_order    INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_choices_question ON quiz_choices(question_id, sort_order);

-- ─── Contrainte : chaque question doit avoir exactement 1 bonne réponse ──
-- (vérifiée par trigger car les CHECK multi-lignes ne sont pas supportées)
CREATE OR REPLACE FUNCTION check_one_correct_choice()
RETURNS TRIGGER AS $$
DECLARE
  correct_count INT;
BEGIN
  SELECT COUNT(*) INTO correct_count
  FROM quiz_choices
  WHERE question_id = COALESCE(NEW.question_id, OLD.question_id)
    AND is_correct = true;

  -- On vérifie après INSERT/UPDATE seulement (pas après DELETE d'un choix incorrect)
  IF TG_OP = 'DELETE' AND OLD.is_correct = false THEN
    RETURN OLD;
  END IF;

  -- Avertir si plus d'une bonne réponse (ne bloque pas, car on peut
  -- être en train de mettre à jour la bonne réponse)
  IF correct_count > 1 AND TG_OP != 'DELETE' THEN
    RAISE WARNING 'Question % a % bonnes réponses (attendu : 1)',
      NEW.question_id, correct_count;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_correct_choice
  AFTER INSERT OR UPDATE OF is_correct ON quiz_choices
  FOR EACH ROW EXECUTE FUNCTION check_one_correct_choice();

-- ─── Tentatives de quiz ─────────────────────────────────────────
CREATE TABLE public.quiz_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  quiz_id       UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score         NUMERIC                       -- Pourcentage (0.0 à 1.0)
                CHECK (score IS NULL OR (score >= 0 AND score <= 1)),
  total_points  INT DEFAULT 0,                -- Points obtenus
  max_points    INT DEFAULT 0,                -- Points possibles
  passed        BOOLEAN NOT NULL DEFAULT false,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ                   -- NULL = en cours
);

CREATE INDEX idx_attempts_employee   ON quiz_attempts(employee_id, quiz_id);
CREATE INDEX idx_attempts_quiz       ON quiz_attempts(quiz_id);
CREATE INDEX idx_attempts_completed  ON quiz_attempts(employee_id, completed_at DESC);

-- ─── Réponses individuelles ─────────────────────────────────────
CREATE TABLE public.quiz_answers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id    UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id   UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  choice_id     UUID NOT NULL REFERENCES quiz_choices(id) ON DELETE CASCADE,
  is_correct    BOOLEAN NOT NULL,
  answered_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_answer_per_question UNIQUE (attempt_id, question_id)
);

CREATE INDEX idx_answers_attempt  ON quiz_answers(attempt_id);
CREATE INDEX idx_answers_question ON quiz_answers(question_id, is_correct);

-- ─── Trigger : calculer le score automatiquement ────────────────
-- Quand toutes les réponses sont soumises, recalculer score + passed
CREATE OR REPLACE FUNCTION recalculate_quiz_score()
RETURNS TRIGGER AS $$
DECLARE
  v_total_points  INT;
  v_earned_points INT;
  v_total_questions INT;
  v_answered INT;
  v_score NUMERIC;
  v_passing NUMERIC;
  v_quiz_id UUID;
BEGIN
  -- Récupérer le quiz_id via l'attempt
  SELECT qa2.quiz_id INTO v_quiz_id
  FROM quiz_attempts qa2 WHERE qa2.id = NEW.attempt_id;

  -- Compter les questions et calculer les points
  SELECT COUNT(*), SUM(points) INTO v_total_questions, v_total_points
  FROM quiz_questions WHERE quiz_id = v_quiz_id;

  SELECT COUNT(*) INTO v_answered
  FROM quiz_answers WHERE attempt_id = NEW.attempt_id;

  -- Calculer les points obtenus
  SELECT COALESCE(SUM(qq.points), 0) INTO v_earned_points
  FROM quiz_answers qa_inner
  JOIN quiz_questions qq ON qq.id = qa_inner.question_id
  WHERE qa_inner.attempt_id = NEW.attempt_id
    AND qa_inner.is_correct = true;

  -- Calculer le score
  v_score := CASE WHEN v_total_points > 0
    THEN v_earned_points::NUMERIC / v_total_points
    ELSE 0 END;

  -- Récupérer le seuil de passage
  SELECT passing_score INTO v_passing
  FROM quizzes WHERE id = v_quiz_id;

  -- Mettre à jour la tentative
  UPDATE quiz_attempts SET
    score = ROUND(v_score, 4),
    total_points = v_earned_points,
    max_points = v_total_points,
    passed = (v_score >= v_passing),
    completed_at = CASE
      WHEN v_answered >= v_total_questions THEN now()
      ELSE NULL
    END
  WHERE id = NEW.attempt_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recalculate_score
  AFTER INSERT ON quiz_answers
  FOR EACH ROW EXECUTE FUNCTION recalculate_quiz_score();

-- ═══════════════════════════════════════════════════════════════
-- VUES ANALYTIQUES POUR LE GESTIONNAIRE
-- ═══════════════════════════════════════════════════════════════

-- ─── Taux de réussite par question ──────────────────────────────
-- Permet d'identifier les questions les plus difficiles
CREATE OR REPLACE VIEW public.quiz_question_stats AS
SELECT
  qq.id             AS question_id,
  qq.question_text,
  qq.explanation,
  q.id              AS quiz_id,
  q.title           AS quiz_title,
  tm.title          AS module_title,
  COUNT(qa.id)      AS total_answers,
  SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) AS correct_answers,
  ROUND(
    CASE WHEN COUNT(qa.id) = 0 THEN 0
    ELSE SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END)::NUMERIC / COUNT(qa.id)
    END, 2
  )                 AS success_rate
FROM quiz_questions qq
JOIN quizzes q            ON q.id = qq.quiz_id
JOIN training_chapters tc ON tc.id = q.chapter_id
JOIN training_modules tm  ON tm.id = tc.module_id
LEFT JOIN quiz_answers qa ON qa.question_id = qq.id
GROUP BY qq.id, qq.question_text, qq.explanation, q.id, q.title, tm.title
ORDER BY success_rate ASC NULLS LAST;

-- ─── Mauvaises réponses par employé ─────────────────────────────
-- Réutilisées dans les conversations IA pour reposer ces questions
CREATE OR REPLACE VIEW public.employee_wrong_answers AS
SELECT DISTINCT ON (att.employee_id, qq.id)
  att.employee_id,
  e.first_name,
  e.last_name,
  qq.id             AS question_id,
  qq.question_text,
  qq.explanation,
  q.title           AS quiz_title,
  qa.answered_at
FROM quiz_answers qa
JOIN quiz_questions qq   ON qq.id = qa.question_id
JOIN quiz_attempts att   ON att.id = qa.attempt_id
JOIN quizzes q           ON q.id = att.quiz_id
JOIN employees e         ON e.id = att.employee_id
WHERE qa.is_correct = false
ORDER BY att.employee_id, qq.id, qa.answered_at DESC;

-- ─── Résumé des quiz par employé ────────────────────────────────
CREATE OR REPLACE VIEW public.employee_quiz_summary AS
SELECT
  e.id              AS employee_id,
  e.first_name,
  e.last_name,
  COUNT(DISTINCT qa.quiz_id)                                     AS quizzes_attempted,
  COUNT(DISTINCT qa.quiz_id) FILTER (WHERE qa.passed = true)     AS quizzes_passed,
  ROUND(AVG(qa.score) FILTER (WHERE qa.completed_at IS NOT NULL), 2) AS avg_score,
  -- Meilleur score par quiz (dernier attempt)
  COUNT(DISTINCT qa.id)                                          AS total_attempts,
  MAX(qa.completed_at)                                           AS last_attempt_at
FROM employees e
LEFT JOIN quiz_attempts qa ON qa.employee_id = e.id
WHERE e.is_active = true
GROUP BY e.id, e.first_name, e.last_name;

-- ─── Fonction : vérifier si un employé peut passer un quiz ──────
-- (toutes les vidéos du chapitre doivent être complétées)
CREATE OR REPLACE FUNCTION public.can_take_quiz(
  p_employee_id UUID,
  p_quiz_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_chapter_id UUID;
  v_total_videos INT;
  v_completed_videos INT;
  v_max_attempts INT;
  v_current_attempts INT;
BEGIN
  -- Trouver le chapitre du quiz
  SELECT q.chapter_id, q.max_attempts
  INTO v_chapter_id, v_max_attempts
  FROM quizzes q WHERE q.id = p_quiz_id;

  -- Compter les vidéos du chapitre
  SELECT COUNT(*) INTO v_total_videos
  FROM training_videos WHERE chapter_id = v_chapter_id AND is_active = true;

  -- Compter les vidéos complétées par l'employé
  SELECT COUNT(*) INTO v_completed_videos
  FROM video_watch_log vwl
  JOIN training_videos tv ON tv.id = vwl.video_id
  WHERE vwl.employee_id = p_employee_id
    AND tv.chapter_id = v_chapter_id
    AND vwl.completed = true;

  -- Vidéos pas toutes complétées ?
  IF v_completed_videos < v_total_videos THEN
    RETURN false;
  END IF;

  -- Nombre max de tentatives atteint ?
  IF v_max_attempts IS NOT NULL THEN
    SELECT COUNT(*) INTO v_current_attempts
    FROM quiz_attempts
    WHERE employee_id = p_employee_id AND quiz_id = p_quiz_id;

    IF v_current_attempts >= v_max_attempts THEN
      RETURN false;
    END IF;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON TABLE quizzes IS 'Quiz associé à un chapitre — déclenché après les vidéos';
COMMENT ON TABLE quiz_questions IS 'Questions à choix multiples avec explication';
COMMENT ON TABLE quiz_choices IS 'Choix de réponse (une seule bonne par question)';
COMMENT ON TABLE quiz_attempts IS 'Tentative d''un employé — score calculé automatiquement';
COMMENT ON TABLE quiz_answers IS 'Réponse individuelle à une question dans une tentative';
COMMENT ON VIEW  quiz_question_stats IS 'Taux de réussite par question (gestionnaire)';
COMMENT ON VIEW  employee_wrong_answers IS 'Erreurs par employé — réutilisées en conversation IA';
COMMENT ON VIEW  employee_quiz_summary IS 'Résumé global des quiz par employé';
