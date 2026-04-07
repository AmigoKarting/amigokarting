-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Amigo Karting — 003 : Formation (modules, chapitres, vidéos)   ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ─── Modules de formation ───────────────────────────────────────
-- Niveau le plus haut : « Sécurité », « Service client », etc.
CREATE TABLE public.training_modules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  thumbnail_url TEXT,                        -- Image de couverture (Supabase Storage)
  sort_order    INT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_modules_active ON training_modules(sort_order) WHERE is_active = true;

CREATE TRIGGER trg_modules_updated_at
  BEFORE UPDATE ON training_modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Chapitres (sous-sections d'un module) ──────────────────────
CREATE TABLE public.training_chapters (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id     UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chapters_module ON training_chapters(module_id, sort_order);

-- ─── Vidéos de formation ────────────────────────────────────────
-- Chaque vidéo appartient à un chapitre
-- Les vidéos ne peuvent PAS être avancées (contrôle côté front)
CREATE TABLE public.training_videos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id    UUID NOT NULL REFERENCES training_chapters(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  video_url     TEXT NOT NULL,               -- URL dans Supabase Storage
  duration_sec  INT NOT NULL DEFAULT 0       -- Durée totale en secondes
                CHECK (duration_sec >= 0),
  sort_order    INT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_videos_chapter ON training_videos(chapter_id, sort_order);

-- ─── Progression de visionnement ────────────────────────────────
-- Enregistre exactement combien de secondes un employé a regardé
-- La contrainte UNIQUE empêche les doublons employé+vidéo
CREATE TABLE public.video_watch_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  video_id      UUID NOT NULL REFERENCES training_videos(id) ON DELETE CASCADE,
  watched_sec   INT NOT NULL DEFAULT 0       -- Secondes réellement regardées
                CHECK (watched_sec >= 0),
  max_position  INT NOT NULL DEFAULT 0       -- Position max atteinte (anti-triche)
                CHECK (max_position >= 0),
  completed     BOOLEAN NOT NULL DEFAULT false,
  completed_at  TIMESTAMPTZ,                 -- NULL tant que pas complété
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_watch_employee_video UNIQUE (employee_id, video_id)
);

CREATE INDEX idx_watch_employee     ON video_watch_log(employee_id);
CREATE INDEX idx_watch_completed    ON video_watch_log(employee_id, completed);
CREATE INDEX idx_watch_video        ON video_watch_log(video_id);

CREATE TRIGGER trg_watch_updated_at
  BEFORE UPDATE ON video_watch_log
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Trigger : remplir completed_at automatiquement ─────────────
CREATE OR REPLACE FUNCTION set_watch_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = true AND OLD.completed = false THEN
    NEW.completed_at = now();
  END IF;
  -- Empêcher de « dé-compléter » une vidéo
  IF OLD.completed = true AND NEW.completed = false THEN
    NEW.completed = true;
    NEW.completed_at = OLD.completed_at;
  END IF;
  -- max_position ne peut que monter
  IF NEW.max_position < OLD.max_position THEN
    NEW.max_position = OLD.max_position;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_watch_completed
  BEFORE UPDATE ON video_watch_log
  FOR EACH ROW EXECUTE FUNCTION set_watch_completed_at();

-- ─── Vue : progression par employé et par module ────────────────
CREATE OR REPLACE VIEW public.training_progress AS
SELECT
  e.id                                          AS employee_id,
  e.first_name,
  e.last_name,
  tm.id                                         AS module_id,
  tm.title                                      AS module_title,
  COUNT(DISTINCT tv.id)                         AS total_videos,
  COUNT(DISTINCT vwl.video_id)
    FILTER (WHERE vwl.completed = true)         AS completed_videos,
  -- Pourcentage de progression
  CASE
    WHEN COUNT(DISTINCT tv.id) = 0 THEN 0
    ELSE ROUND(
      COUNT(DISTINCT vwl.video_id) FILTER (WHERE vwl.completed = true)::NUMERIC
      / COUNT(DISTINCT tv.id) * 100
    )
  END                                           AS progress_pct,
  -- Temps total visionné (en secondes)
  COALESCE(SUM(vwl.watched_sec), 0)            AS total_watched_sec,
  -- Date de dernière activité
  MAX(vwl.updated_at)                           AS last_activity_at
FROM employees e
CROSS JOIN training_modules tm
LEFT JOIN training_chapters tc ON tc.module_id = tm.id
LEFT JOIN training_videos tv   ON tv.chapter_id = tc.id AND tv.is_active = true
LEFT JOIN video_watch_log vwl  ON vwl.video_id = tv.id AND vwl.employee_id = e.id
WHERE e.is_active = true AND tm.is_active = true
GROUP BY e.id, e.first_name, e.last_name, tm.id, tm.title;

-- ─── Vue : activité temps réel (qui regarde quoi maintenant) ────
-- Le gestionnaire voit les employés actifs dans les 10 dernières min
CREATE OR REPLACE VIEW public.training_live_activity AS
SELECT
  e.id          AS employee_id,
  e.first_name,
  e.last_name,
  tv.title      AS video_title,
  tc.title      AS chapter_title,
  tm.title      AS module_title,
  vwl.watched_sec,
  tv.duration_sec,
  vwl.updated_at AS last_ping
FROM video_watch_log vwl
JOIN employees e       ON e.id = vwl.employee_id
JOIN training_videos tv ON tv.id = vwl.video_id
JOIN training_chapters tc ON tc.id = tv.chapter_id
JOIN training_modules tm  ON tm.id = tc.module_id
WHERE vwl.completed = false
  AND vwl.updated_at > now() - INTERVAL '10 minutes';

COMMENT ON TABLE training_modules IS 'Modules de formation regroupant les chapitres';
COMMENT ON TABLE training_chapters IS 'Chapitres contenant les vidéos, ordonnés dans un module';
COMMENT ON TABLE training_videos IS 'Vidéos de formation (avance rapide interdite côté client)';
COMMENT ON TABLE video_watch_log IS 'Progression de visionnement — une ligne par employé×vidéo';
COMMENT ON VIEW  training_progress IS 'Progression agrégée par employé et par module (%)';
COMMENT ON VIEW  training_live_activity IS 'Employés en train de regarder une vidéo (dernières 10 min)';
