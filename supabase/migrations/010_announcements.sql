-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Amigo Karting — 010 : Annonces                                  ║
-- ╚══════════════════════════════════════════════════════════════════╝

CREATE TABLE public.announcements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  priority      TEXT NOT NULL DEFAULT 'normal'
                CHECK (priority IN ('normal', 'important', 'urgent')),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  expires_at    TIMESTAMPTZ,           -- NULL = jamais expire
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_announcements_active ON announcements(is_active, created_at DESC);

CREATE TRIGGER trg_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Les employés lisent les annonces
-- Les gérants/patrons créent, modifient, suppriment
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY ann_read ON announcements
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY ann_manage ON announcements
  FOR ALL USING (is_manager());

-- Table pour tracker qui a lu quelle annonce
CREATE TABLE public.announcement_reads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  read_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_read UNIQUE (announcement_id, employee_id)
);

CREATE INDEX idx_ann_reads_employee ON announcement_reads(employee_id);

ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY ann_reads_own ON announcement_reads
  FOR SELECT USING (employee_id = current_employee_id() OR is_manager());

CREATE POLICY ann_reads_insert ON announcement_reads
  FOR INSERT WITH CHECK (employee_id = current_employee_id());

GRANT ALL ON announcements TO anon, authenticated, service_role;
GRANT ALL ON announcement_reads TO anon, authenticated, service_role;
