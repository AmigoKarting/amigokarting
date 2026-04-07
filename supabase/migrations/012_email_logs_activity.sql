-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Amigo Karting — 012 : Emails envoyés & suivi d'activité        ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ─── Journal des emails envoyés ─────────────────────────────────
CREATE TABLE public.email_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Qui envoie
  sent_by       UUID REFERENCES employees(id),  -- NULL = système automatique
  -- Destinataire
  to_email      TEXT NOT NULL,
  to_name       TEXT,
  -- Contenu
  subject       TEXT NOT NULL,
  body          TEXT NOT NULL,
  -- Type d'email
  type          TEXT NOT NULL DEFAULT 'general'
                CHECK (type IN (
                  'availability_reminder',   -- Rappel disponibilités
                  'document_request',        -- Demande de document
                  'training_reminder',       -- Rappel formation
                  'profile_reminder',        -- Rappel fiche incomplète
                  'report',                  -- Rapport automatique
                  'general'                  -- Autre
                )),
  -- Statut
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,                          -- Message d'erreur si échoué
  -- Référence
  reference_type TEXT,                         -- 'availability_period', 'document_request', etc.
  reference_id  UUID,                          -- ID de l'objet concerné
  -- Timestamps
  sent_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_logs_status ON email_logs(status, created_at DESC);
CREATE INDEX idx_email_logs_type ON email_logs(type, created_at DESC);
CREATE INDEX idx_email_logs_to ON email_logs(to_email);

-- ─── Vue : historique complet des rappels par employé ───────────
CREATE OR REPLACE VIEW public.reminder_history AS
SELECT
  r.id,
  r.type,
  r.message,
  r.channel,
  r.email_to,
  r.is_read,
  r.sent_at,
  r.reference_id,
  e.id AS employee_id,
  e.first_name,
  e.last_name,
  e.role
FROM reminders r
JOIN employees e ON e.id = r.employee_id
ORDER BY r.sent_at DESC;

-- ─── Vue : activité des employés (dernière connexion, actions) ──
CREATE OR REPLACE VIEW public.employee_activity AS
SELECT
  e.id AS employee_id,
  e.first_name,
  e.last_name,
  e.role,
  e.is_active,
  e.created_at AS account_created,

  -- Dernière vidéo regardée
  (SELECT MAX(updated_at) FROM video_watch_log WHERE employee_id = e.id) AS last_video_at,

  -- Dernier quiz
  (SELECT MAX(completed_at) FROM quiz_attempts WHERE employee_id = e.id) AS last_quiz_at,

  -- Dernière conversation IA
  (SELECT MAX(started_at) FROM conversation_sessions WHERE employee_id = e.id) AS last_conversation_at,

  -- Dernière question Q&A
  (SELECT MAX(created_at) FROM qa_logs WHERE employee_id = e.id) AS last_qa_at,

  -- Dernière soumission de disponibilités
  (SELECT MAX(submitted_at) FROM availability_responses WHERE employee_id = e.id) AS last_availability_at,

  -- Dernier document soumis
  (SELECT MAX(submitted_at) FROM document_submissions WHERE employee_id = e.id) AS last_document_at,

  -- Nombre de rappels non-lus
  (SELECT COUNT(*) FROM reminders WHERE employee_id = e.id AND is_read = false) AS unread_reminders,

  -- Dernière activité (la plus récente de toutes)
  GREATEST(
    (SELECT MAX(updated_at) FROM video_watch_log WHERE employee_id = e.id),
    (SELECT MAX(completed_at) FROM quiz_attempts WHERE employee_id = e.id),
    (SELECT MAX(started_at) FROM conversation_sessions WHERE employee_id = e.id),
    (SELECT MAX(created_at) FROM qa_logs WHERE employee_id = e.id),
    (SELECT MAX(submitted_at) FROM availability_responses WHERE employee_id = e.id),
    (SELECT MAX(submitted_at) FROM document_submissions WHERE employee_id = e.id)
  ) AS last_activity_at,

  -- Jours depuis la dernière activité
  CASE
    WHEN GREATEST(
      (SELECT MAX(updated_at) FROM video_watch_log WHERE employee_id = e.id),
      (SELECT MAX(completed_at) FROM quiz_attempts WHERE employee_id = e.id),
      (SELECT MAX(started_at) FROM conversation_sessions WHERE employee_id = e.id),
      (SELECT MAX(created_at) FROM qa_logs WHERE employee_id = e.id)
    ) IS NULL THEN NULL
    ELSE EXTRACT(DAY FROM now() - GREATEST(
      (SELECT MAX(updated_at) FROM video_watch_log WHERE employee_id = e.id),
      (SELECT MAX(completed_at) FROM quiz_attempts WHERE employee_id = e.id),
      (SELECT MAX(started_at) FROM conversation_sessions WHERE employee_id = e.id),
      (SELECT MAX(created_at) FROM qa_logs WHERE employee_id = e.id)
    ))::INT
  END AS days_inactive

FROM employees e
WHERE e.is_active = true
ORDER BY last_activity_at DESC NULLS LAST;

-- ─── Vue : résumé des emails par type ───────────────────────────
CREATE OR REPLACE VIEW public.email_summary AS
SELECT
  type,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status = 'sent') AS sent_count,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed_count,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
  MAX(created_at) AS last_sent_at
FROM email_logs
GROUP BY type
ORDER BY total DESC;

-- ─── RLS ────────────────────────────────────────────────────────
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY email_logs_manage ON email_logs FOR ALL USING (is_manager());

GRANT ALL ON email_logs TO anon, authenticated, service_role;
