-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Amigo Karting — 005 : Row Level Security (RLS)                 ║
-- ╚══════════════════════════════════════════════════════════════════╝
-- Règle : un employé voit ses propres données, le gestionnaire voit tout.
-- Les tables de référence (modules, chapitres, vidéos, quiz) sont en lecture pour tous.

-- ═══════════════════════════════════════════════════════════════════
-- EMPLOYEES
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Employé : lire et modifier sa propre fiche
CREATE POLICY employees_select_own ON employees
  FOR SELECT USING (auth_user_id = auth.uid() OR is_manager());

CREATE POLICY employees_update_own ON employees
  FOR UPDATE USING (auth_user_id = auth.uid())
  WITH CHECK (
    -- L'employé ne peut pas changer son rôle ni se désactiver
    auth_user_id = auth.uid()
    AND role = (SELECT role FROM employees WHERE id = employees.id)
    AND is_active = (SELECT is_active FROM employees WHERE id = employees.id)
  );

-- Gestionnaire : tout faire
CREATE POLICY employees_manager_all ON employees
  FOR ALL USING (is_manager());

-- ═══════════════════════════════════════════════════════════════════
-- NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notif_own_read ON notifications
  FOR SELECT USING (employee_id = current_employee_id());

CREATE POLICY notif_own_update ON notifications
  FOR UPDATE USING (employee_id = current_employee_id())
  WITH CHECK (employee_id = current_employee_id());

CREATE POLICY notif_manager ON notifications
  FOR ALL USING (is_manager());

-- ═══════════════════════════════════════════════════════════════════
-- FORMATION — Lecture pour tous les authentifiés
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY modules_read ON training_modules
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY modules_manage ON training_modules
  FOR ALL USING (is_manager());

ALTER TABLE training_chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY chapters_read ON training_chapters
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY chapters_manage ON training_chapters
  FOR ALL USING (is_manager());

ALTER TABLE training_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY videos_read ON training_videos
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY videos_manage ON training_videos
  FOR ALL USING (is_manager());

-- ═══════════════════════════════════════════════════════════════════
-- PROGRESSION VIDÉO
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE video_watch_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY watch_own_select ON video_watch_log
  FOR SELECT USING (employee_id = current_employee_id() OR is_manager());

CREATE POLICY watch_own_insert ON video_watch_log
  FOR INSERT WITH CHECK (employee_id = current_employee_id());

CREATE POLICY watch_own_update ON video_watch_log
  FOR UPDATE USING (employee_id = current_employee_id())
  WITH CHECK (employee_id = current_employee_id());

CREATE POLICY watch_manager ON video_watch_log
  FOR ALL USING (is_manager());

-- ═══════════════════════════════════════════════════════════════════
-- QUIZ — Questions et choix en lecture pour tous
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY quizzes_read ON quizzes
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY quizzes_manage ON quizzes
  FOR ALL USING (is_manager());

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY questions_read ON quiz_questions
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY questions_manage ON quiz_questions
  FOR ALL USING (is_manager());

ALTER TABLE quiz_choices ENABLE ROW LEVEL SECURITY;
CREATE POLICY choices_read ON quiz_choices
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY choices_manage ON quiz_choices
  FOR ALL USING (is_manager());

-- ═══════════════════════════════════════════════════════════════════
-- TENTATIVES ET RÉPONSES QUIZ
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY attempts_own_select ON quiz_attempts
  FOR SELECT USING (employee_id = current_employee_id() OR is_manager());

CREATE POLICY attempts_own_insert ON quiz_attempts
  FOR INSERT WITH CHECK (employee_id = current_employee_id());

CREATE POLICY attempts_own_update ON quiz_attempts
  FOR UPDATE USING (employee_id = current_employee_id());

CREATE POLICY attempts_manager ON quiz_attempts
  FOR ALL USING (is_manager());

ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY answers_own_select ON quiz_answers
  FOR SELECT USING (
    attempt_id IN (SELECT id FROM quiz_attempts WHERE employee_id = current_employee_id())
    OR is_manager()
  );

CREATE POLICY answers_own_insert ON quiz_answers
  FOR INSERT WITH CHECK (
    attempt_id IN (SELECT id FROM quiz_attempts WHERE employee_id = current_employee_id())
  );

CREATE POLICY answers_manager ON quiz_answers
  FOR ALL USING (is_manager());

-- ═══════════════════════════════════════════════════════════════════
-- Supabase Realtime : activer pour le suivi en temps réel
-- ═══════════════════════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE video_watch_log;
ALTER PUBLICATION supabase_realtime ADD TABLE quiz_attempts;
