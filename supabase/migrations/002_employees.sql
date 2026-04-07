-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Amigo Karting — 002 : Table employés                           ║
-- ╚══════════════════════════════════════════════════════════════════╝

CREATE TABLE public.employees (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id            UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,

  -- ─── Identité ──────────────────────────────────────────────────
  first_name              TEXT NOT NULL,
  last_name               TEXT NOT NULL,
  phone_last4             TEXT NOT NULL
                          CHECK (phone_last4 ~ '^\d{4}$'),    -- Exactement 4 chiffres

  -- ─── Coordonnées ──────────────────────────────────────────────
  phone                   TEXT
                          CHECK (phone IS NULL OR length(phone) >= 10),
  email                   TEXT,
  address                 TEXT,
  city                    TEXT,
  postal_code             TEXT
                          CHECK (postal_code IS NULL OR postal_code ~ '^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$'),
  province                TEXT NOT NULL DEFAULT 'QC',

  -- ─── Contact d'urgence ────────────────────────────────────────
  emergency_contact_name  TEXT,
  emergency_contact_phone TEXT,

  -- ─── Uniformes ────────────────────────────────────────────────
  uniform_size_shirt      TEXT
                          CHECK (uniform_size_shirt IS NULL
                            OR uniform_size_shirt IN ('XS','S','M','L','XL','XXL','XXXL')),
  uniform_size_pants      TEXT,
  uniform_size_shoes      TEXT,

  -- ─── Rôle & statut ───────────────────────────────────────────
  role                    TEXT NOT NULL DEFAULT 'employee'
                          CHECK (role IN ('employee', 'manager')),
  is_active               BOOLEAN NOT NULL DEFAULT true,

  -- ─── Horodatage ──────────────────────────────────────────────
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Index ──────────────────────────────────────────────────────
CREATE INDEX idx_employees_auth     ON employees(auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE INDEX idx_employees_active   ON employees(is_active) WHERE is_active = true;
CREATE INDEX idx_employees_lookup   ON employees(lower(first_name), phone_last4, is_active);
CREATE INDEX idx_employees_role     ON employees(role) WHERE is_active = true;

-- ─── Trigger updated_at ─────────────────────────────────────────
CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Helpers d'authentification (RLS policies) ──────────────────
-- Créés ICI car ils dépendent de la table employees
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employees
    WHERE auth_user_id = auth.uid()
      AND role = 'manager'
      AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.current_employee_id()
RETURNS UUID AS $$
  SELECT id FROM public.employees
  WHERE auth_user_id = auth.uid()
    AND is_active = true
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── Contrainte : au moins un gestionnaire actif ────────────────
-- (empêche de désactiver le dernier manager)
CREATE OR REPLACE FUNCTION check_at_least_one_manager()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role = 'manager' AND OLD.is_active = true
     AND (NEW.is_active = false OR NEW.role != 'manager') THEN
    IF NOT EXISTS (
      SELECT 1 FROM employees
      WHERE role = 'manager' AND is_active = true AND id != OLD.id
    ) THEN
      RAISE EXCEPTION 'Impossible : il doit rester au moins un gestionnaire actif.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_last_manager
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION check_at_least_one_manager();

-- ─── Vue : champs manquants par employé ─────────────────────────
-- Les champs manquants apparaissent en rouge dans le tableau de bord
CREATE OR REPLACE VIEW public.employee_missing_info AS
SELECT
  e.id,
  e.first_name,
  e.last_name,
  e.phone,
  -- Détail par champ
  (e.phone IS NULL OR e.phone = '')                              AS missing_phone,
  (e.address IS NULL OR e.address = '')                          AS missing_address,
  (e.city IS NULL OR e.city = '')                                AS missing_city,
  (e.postal_code IS NULL OR e.postal_code = '')                  AS missing_postal_code,
  (e.emergency_contact_name IS NULL OR e.emergency_contact_name = '')  AS missing_emergency_contact,
  (e.emergency_contact_phone IS NULL OR e.emergency_contact_phone = '') AS missing_emergency_phone,
  (e.uniform_size_shirt IS NULL)                                 AS missing_uniform_shirt,
  -- Résumé global
  (
    e.phone IS NULL OR e.address IS NULL
    OR e.emergency_contact_name IS NULL
    OR e.emergency_contact_phone IS NULL
    OR e.uniform_size_shirt IS NULL
  ) AS has_missing_info,
  -- Nombre de champs manquants
  (
    CASE WHEN e.phone IS NULL THEN 1 ELSE 0 END +
    CASE WHEN e.address IS NULL THEN 1 ELSE 0 END +
    CASE WHEN e.emergency_contact_name IS NULL THEN 1 ELSE 0 END +
    CASE WHEN e.emergency_contact_phone IS NULL THEN 1 ELSE 0 END +
    CASE WHEN e.uniform_size_shirt IS NULL THEN 1 ELSE 0 END
  ) AS missing_count
FROM employees e
WHERE e.is_active = true;

-- ─── Table notifications (SMS, push, alertes) ──────────────────
CREATE TABLE public.notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type          TEXT NOT NULL
                CHECK (type IN ('missing_info', 'agendrix_reminder', 'training_reminder', 'quiz_failed', 'general')),
  message       TEXT NOT NULL,
  channel       TEXT NOT NULL DEFAULT 'sms'
                CHECK (channel IN ('sms', 'push', 'in_app')),
  sent_at       TIMESTAMPTZ,
  read_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_employee ON notifications(employee_id, created_at DESC);
CREATE INDEX idx_notifications_unread   ON notifications(employee_id) WHERE read_at IS NULL;

COMMENT ON TABLE employees IS 'Employés d''Amigo Karting — fiches personnelles et rôles';
COMMENT ON TABLE notifications IS 'Notifications envoyées aux employés (SMS, push, in-app)';
COMMENT ON VIEW  employee_missing_info IS 'Vue temps réel des champs manquants par employé';
