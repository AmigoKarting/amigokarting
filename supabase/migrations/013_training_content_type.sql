-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Amigo Karting — 013 : Type de formation (texte / vidéo)         ║
-- ╚══════════════════════════════════════════════════════════════════╝
-- Sépare les modules de formation en deux catégories :
--   • 'text'  → formation écrite (le contenu est dans chapter.content)
--   • 'video' → formation vidéo  (le contenu est dans training_videos)

-- ─── Type de contenu sur le module ──────────────────────────────
ALTER TABLE public.training_modules
  ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'video';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'training_modules_content_type_chk'
  ) THEN
    ALTER TABLE public.training_modules
      ADD CONSTRAINT training_modules_content_type_chk
      CHECK (content_type IN ('text', 'video'));
  END IF;
END $$;

-- ─── Contenu écrit du chapitre (pour les modules de type 'text') ─
ALTER TABLE public.training_chapters
  ADD COLUMN IF NOT EXISTS content TEXT;

COMMENT ON COLUMN training_modules.content_type IS 'Type de formation : text (écrite) ou video';
COMMENT ON COLUMN training_chapters.content      IS 'Contenu écrit du chapitre (modules de type text)';
