-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Amigo Karting — 011 : Disponibilités, documents, rappels       ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ─── Périodes de disponibilité ──────────────────────────────────
-- Le gérant crée une période (ex: "Semaine du 18 mars")
-- Les employés soumettent leurs disponibilités pour cette période
CREATE TABLE public.availability_periods (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,                  -- "Semaine du 18 mars"
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  deadline      TIMESTAMPTZ NOT NULL,           -- Date limite pour répondre
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_by    UUID NOT NULL REFERENCES employees(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_avail_periods_active ON availability_periods(is_active, deadline DESC);

-- Réponses des employés
CREATE TABLE public.availability_responses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id     UUID NOT NULL REFERENCES availability_periods(id) ON DELETE CASCADE,
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  -- Disponibilités par jour (JSON: {"lundi": "am+pm", "mardi": "am", ...})
  -- Valeurs possibles: "am", "pm", "am+pm", "non"
  schedule      JSONB NOT NULL DEFAULT '{}',
  notes         TEXT,                           -- Commentaire de l'employé
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_avail_response UNIQUE (period_id, employee_id)
);

CREATE INDEX idx_avail_responses_period ON availability_responses(period_id);
CREATE INDEX idx_avail_responses_employee ON availability_responses(employee_id);

CREATE TRIGGER trg_avail_response_updated
  BEFORE UPDATE ON availability_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Demandes de documents ──────────────────────────────────────
-- Le gérant demande un document (screenshot, photo, etc.)
CREATE TABLE public.document_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,                  -- "Capture d'écran Agendrix"
  description   TEXT,                           -- Instructions détaillées
  requested_by  UUID NOT NULL REFERENCES employees(id),
  -- NULL = demandé à tous, sinon à un employé spécifique
  target_employee_id UUID REFERENCES employees(id),
  deadline      TIMESTAMPTZ,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_doc_requests_active ON document_requests(is_active, created_at DESC);

-- Réponses/soumissions de documents
CREATE TABLE public.document_submissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id    UUID NOT NULL REFERENCES document_requests(id) ON DELETE CASCADE,
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  -- URL du fichier dans Supabase Storage ou texte de la réponse
  file_url      TEXT,
  file_name     TEXT,
  notes         TEXT,
  status        TEXT NOT NULL DEFAULT 'submitted'
                CHECK (status IN ('submitted', 'approved', 'rejected')),
  reviewed_by   UUID REFERENCES employees(id),
  reviewed_at   TIMESTAMPTZ,
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_doc_submission UNIQUE (request_id, employee_id)
);

CREATE INDEX idx_doc_submissions_request ON document_submissions(request_id);
CREATE INDEX idx_doc_submissions_employee ON document_submissions(employee_id);

-- ─── Journal de rappels envoyés ─────────────────────────────────
CREATE TABLE public.reminders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type          TEXT NOT NULL CHECK (type IN (
    'availability', 'document', 'training', 'profile', 'general'
  )),
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  message       TEXT NOT NULL,
  channel       TEXT NOT NULL DEFAULT 'in_app'
                CHECK (channel IN ('in_app', 'email')),
  email_to      TEXT,                           -- Adresse email si envoyé par email
  is_read       BOOLEAN NOT NULL DEFAULT false,
  reference_id  UUID,                           -- ID de la période/demande/etc.
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reminders_employee ON reminders(employee_id, is_read, sent_at DESC);
CREATE INDEX idx_reminders_type ON reminders(type, sent_at DESC);

-- ─── Vue : suivi des disponibilités par période ─────────────────
CREATE OR REPLACE VIEW public.availability_tracking AS
SELECT
  ap.id AS period_id,
  ap.title AS period_title,
  ap.start_date,
  ap.end_date,
  ap.deadline,
  e.id AS employee_id,
  e.first_name,
  e.last_name,
  e.role,
  ar.id AS response_id,
  ar.schedule,
  ar.notes,
  ar.submitted_at,
  CASE WHEN ar.id IS NOT NULL THEN true ELSE false END AS has_responded
FROM availability_periods ap
CROSS JOIN employees e
LEFT JOIN availability_responses ar
  ON ar.period_id = ap.id AND ar.employee_id = e.id
WHERE ap.is_active = true
  AND e.is_active = true
ORDER BY ap.deadline DESC, e.last_name;

-- ─── Vue : suivi des documents demandés ─────────────────────────
CREATE OR REPLACE VIEW public.document_tracking AS
SELECT
  dr.id AS request_id,
  dr.title AS request_title,
  dr.description,
  dr.deadline,
  dr.target_employee_id,
  e.id AS employee_id,
  e.first_name,
  e.last_name,
  ds.id AS submission_id,
  ds.file_url,
  ds.file_name,
  ds.notes AS submission_notes,
  ds.status,
  ds.submitted_at,
  CASE WHEN ds.id IS NOT NULL THEN true ELSE false END AS has_submitted
FROM document_requests dr
CROSS JOIN employees e
LEFT JOIN document_submissions ds
  ON ds.request_id = dr.id AND ds.employee_id = e.id
WHERE dr.is_active = true
  AND e.is_active = true
  AND (dr.target_employee_id IS NULL OR dr.target_employee_id = e.id)
ORDER BY dr.created_at DESC, e.last_name;

-- ─── RLS ────────────────────────────────────────────────────────
ALTER TABLE availability_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY ap_read ON availability_periods FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY ap_manage ON availability_periods FOR ALL USING (is_manager());

ALTER TABLE availability_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY ar_own ON availability_responses FOR SELECT USING (employee_id = current_employee_id() OR is_manager());
CREATE POLICY ar_insert ON availability_responses FOR INSERT WITH CHECK (employee_id = current_employee_id());
CREATE POLICY ar_update ON availability_responses FOR UPDATE USING (employee_id = current_employee_id());

ALTER TABLE document_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY dr_read ON document_requests FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY dr_manage ON document_requests FOR ALL USING (is_manager());

ALTER TABLE document_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY ds_own ON document_submissions FOR SELECT USING (employee_id = current_employee_id() OR is_manager());
CREATE POLICY ds_insert ON document_submissions FOR INSERT WITH CHECK (employee_id = current_employee_id());
CREATE POLICY ds_manage ON document_submissions FOR ALL USING (is_manager());

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY rem_own ON reminders FOR SELECT USING (employee_id = current_employee_id() OR is_manager());
CREATE POLICY rem_manage ON reminders FOR ALL USING (is_manager());

-- Permissions
GRANT ALL ON availability_periods TO anon, authenticated, service_role;
GRANT ALL ON availability_responses TO anon, authenticated, service_role;
GRANT ALL ON document_requests TO anon, authenticated, service_role;
GRANT ALL ON document_submissions TO anon, authenticated, service_role;
GRANT ALL ON reminders TO anon, authenticated, service_role;
