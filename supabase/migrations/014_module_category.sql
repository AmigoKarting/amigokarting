-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Amigo Karting — 014 : Catégorie de regroupement des modules     ║
-- ╚══════════════════════════════════════════════════════════════════╝
-- Permet de regrouper les modules de formation par catégorie
-- (ex : « Caisse - Amigo Karting »).

ALTER TABLE public.training_modules
  ADD COLUMN IF NOT EXISTS category TEXT;

COMMENT ON COLUMN training_modules.category IS 'Catégorie de regroupement (ex: Caisse - Amigo Karting)';
