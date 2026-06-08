-- Fonction utilitaire pour insérer un document dans la base de connaissances Q&A
-- (knowledge_documents). Utilisée par scripts/load_kb.py (données scripts/data/kb.json,
-- générées à partir des manuels par scripts/build_kb.py).
-- embedding reste NULL : la recherche Q&A en mode mock est lexicale (mots-clés).
CREATE OR REPLACE FUNCTION public.seed_knowledge_doc(data jsonb) RETURNS void AS $fn$
BEGIN
  INSERT INTO public.knowledge_documents (title, content, category, source_file, chunk_index)
  VALUES (
    data->>'title',
    data->>'content',
    data->>'category',
    data->>'source_file',
    COALESCE((data->>'chunk_index')::int, 0)
  );
END;
$fn$ LANGUAGE plpgsql;
