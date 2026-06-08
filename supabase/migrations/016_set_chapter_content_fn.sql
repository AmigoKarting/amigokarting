-- Fonction utilitaire pour (re)définir le contenu de lecture (formation) d'un module,
-- identifié par son titre exact. Met à jour training_chapters.content.
-- Utilisée par scripts/load_content_json.py (données dans scripts/data/content/*.json).
CREATE OR REPLACE FUNCTION public.set_chapter_content(data jsonb) RETURNS void AS $fn$
DECLARE v_title text := data->>'title'; v_content text := data->>'content'; m_id uuid;
BEGIN
  SELECT id INTO m_id FROM public.training_modules WHERE title = v_title;
  IF m_id IS NULL THEN RAISE EXCEPTION 'Module introuvable: %', v_title; END IF;
  UPDATE public.training_chapters SET content = v_content WHERE module_id = m_id;
END;
$fn$ LANGUAGE plpgsql;
