-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Amigo Karting — 007 : Conversations vocales IA                 ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ─── Banque de questions pour les conversations ─────────────────
-- L'IA pioche dans cette banque + les erreurs de quiz de l'employé
CREATE TABLE public.conversation_questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  category      TEXT,                          -- Ex: "sécurité", "accueil"
  is_priority   BOOLEAN NOT NULL DEFAULT false,-- Le gestionnaire marque les prioritaires
  source        TEXT NOT NULL DEFAULT 'manual'
                CHECK (source IN ('manual', 'generated', 'quiz_error')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conv_questions_priority ON conversation_questions(is_priority DESC);
CREATE INDEX idx_conv_questions_category ON conversation_questions(category);

-- ─── Sessions de conversation ───────────────────────────────────
-- Une session = un "appel" entre l'employé et l'IA
CREATE TABLE public.conversation_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at        TIMESTAMPTZ,
  duration_sec    INT,
  -- Évaluation par l'employé (après 20 min ou à la fin)
  rating          INT CHECK (rating IS NULL OR (rating BETWEEN 1 AND 10)),
  rating_comment  TEXT,
  -- Stats de la session
  total_questions INT DEFAULT 0,
  correct_answers INT DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conv_sessions_employee ON conversation_sessions(employee_id, started_at DESC);

-- ─── Messages individuels dans une session ──────────────────────
CREATE TABLE public.conversation_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES conversation_sessions(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('ai', 'employee')),
  content       TEXT NOT NULL,
  -- Lien optionnel vers la question posée
  question_id   UUID REFERENCES conversation_questions(id),
  is_correct    BOOLEAN,                       -- Null si pas une réponse évaluable
  audio_url     TEXT,                          -- URL de l'audio si message vocal
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conv_messages_session ON conversation_messages(session_id, created_at);

-- ─── Vue : rapport par employé ──────────────────────────────────
CREATE OR REPLACE VIEW public.conversation_employee_report AS
SELECT
  e.id              AS employee_id,
  e.first_name,
  e.last_name,
  COUNT(cs.id)      AS total_sessions,
  COALESCE(SUM(cs.duration_sec), 0) AS total_seconds,
  ROUND(AVG(cs.rating)::NUMERIC, 1) AS avg_rating,
  COALESCE(SUM(cs.total_questions), 0) AS total_questions,
  COALESCE(SUM(cs.correct_answers), 0) AS total_correct,
  -- Cette semaine
  COALESCE(SUM(cs.duration_sec)
    FILTER (WHERE cs.started_at >= date_trunc('week', now())), 0
  ) AS seconds_this_week,
  -- Ce mois
  COALESCE(SUM(cs.duration_sec)
    FILTER (WHERE cs.started_at >= date_trunc('month', now())), 0
  ) AS seconds_this_month,
  MAX(cs.started_at) AS last_session_at
FROM employees e
LEFT JOIN conversation_sessions cs ON cs.employee_id = e.id
WHERE e.is_active = true
GROUP BY e.id, e.first_name, e.last_name;

-- ─── Vue : questions les plus difficiles en conversation ────────
CREATE OR REPLACE VIEW public.conversation_difficult_questions AS
SELECT
  cq.id AS question_id,
  cq.question_text,
  cq.category,
  COUNT(cm.id) AS times_asked,
  SUM(CASE WHEN cm.is_correct = true THEN 1 ELSE 0 END) AS correct_count,
  SUM(CASE WHEN cm.is_correct = false THEN 1 ELSE 0 END) AS wrong_count,
  ROUND(
    CASE WHEN COUNT(cm.id) = 0 THEN 0
    ELSE SUM(CASE WHEN cm.is_correct THEN 1 ELSE 0 END)::NUMERIC / COUNT(cm.id)
    END, 2
  ) AS success_rate
FROM conversation_questions cq
LEFT JOIN conversation_messages cm ON cm.question_id = cq.id AND cm.is_correct IS NOT NULL
GROUP BY cq.id, cq.question_text, cq.category
HAVING COUNT(cm.id) > 0
ORDER BY success_rate ASC;

-- ─── RLS ────────────────────────────────────────────────────────
ALTER TABLE conversation_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY conv_q_read ON conversation_questions
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY conv_q_manage ON conversation_questions
  FOR ALL USING (is_manager());

ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY conv_s_own ON conversation_sessions
  FOR SELECT USING (employee_id = current_employee_id() OR is_manager());
CREATE POLICY conv_s_insert ON conversation_sessions
  FOR INSERT WITH CHECK (employee_id = current_employee_id());
CREATE POLICY conv_s_update ON conversation_sessions
  FOR UPDATE USING (employee_id = current_employee_id() OR is_manager());
CREATE POLICY conv_s_manager ON conversation_sessions
  FOR ALL USING (is_manager());

ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY conv_m_own ON conversation_messages
  FOR SELECT USING (
    session_id IN (SELECT id FROM conversation_sessions WHERE employee_id = current_employee_id())
    OR is_manager()
  );
CREATE POLICY conv_m_insert ON conversation_messages
  FOR INSERT WITH CHECK (
    session_id IN (SELECT id FROM conversation_sessions WHERE employee_id = current_employee_id())
  );
CREATE POLICY conv_m_manager ON conversation_messages
  FOR ALL USING (is_manager());

-- Realtime pour le suivi gestionnaire
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_sessions;

COMMENT ON TABLE conversation_questions IS 'Banque de questions pour les conversations IA vocales';
COMMENT ON TABLE conversation_sessions IS 'Sessions de conversation — un "appel" employé-IA';
COMMENT ON TABLE conversation_messages IS 'Messages échangés dans une session vocale';
