-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Amigo Karting — 006 : Base de connaissances Q&A (RAG)          ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ─── Documents du manuel d'entreprise ───────────────────────────
-- Chaque ligne = un "chunk" de texte avec son embedding vectoriel
CREATE TABLE public.knowledge_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,                 -- Ex: "Procédure casques — Distribution"
  content       TEXT NOT NULL,                 -- Texte brut du chunk (500-1000 tokens idéal)
  category      TEXT,                          -- Ex: "sécurité", "accueil", "opérations"
  source_file   TEXT,                          -- Nom du fichier d'origine
  chunk_index   INT DEFAULT 0,                 -- Position dans le document d'origine
  embedding     VECTOR(1536),                  -- Embedding OpenAI text-embedding-3-small
  token_count   INT,                           -- Nombre de tokens du chunk
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_knowledge_category ON knowledge_documents(category);
CREATE INDEX idx_knowledge_embedding ON knowledge_documents
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE TRIGGER trg_knowledge_updated_at
  BEFORE UPDATE ON knowledge_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Fonction de recherche vectorielle ──────────────────────────
-- Trouve les documents les plus similaires à un embedding de question
CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  category TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kd.id,
    kd.title,
    kd.content,
    kd.category,
    (1 - (kd.embedding <=> query_embedding))::FLOAT AS similarity
  FROM knowledge_documents kd
  WHERE kd.embedding IS NOT NULL
    AND (1 - (kd.embedding <=> query_embedding)) > match_threshold
  ORDER BY kd.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ─── Logs des questions/réponses ────────────────────────────────
-- Historique de toutes les questions posées et réponses générées
CREATE TABLE public.qa_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  question      TEXT NOT NULL,
  answer        TEXT NOT NULL,
  source_docs   UUID[],                        -- IDs des documents utilisés pour la réponse
  input_type    TEXT NOT NULL DEFAULT 'text'
                CHECK (input_type IN ('text', 'voice')),
  confidence    FLOAT,                         -- Score de confiance (similarité moyenne)
  response_ms   INT,                           -- Temps de réponse en ms
  helpful       BOOLEAN,                       -- Feedback de l'employé (pouce haut/bas)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_qa_employee ON qa_logs(employee_id, created_at DESC);
CREATE INDEX idx_qa_recent   ON qa_logs(created_at DESC);

-- ─── Vue : questions les plus fréquentes ────────────────────────
CREATE OR REPLACE VIEW public.qa_frequent_questions AS
SELECT
  question,
  COUNT(*) AS times_asked,
  ROUND(AVG(confidence)::NUMERIC, 2) AS avg_confidence,
  COUNT(*) FILTER (WHERE helpful = true) AS helpful_count,
  COUNT(*) FILTER (WHERE helpful = false) AS not_helpful_count,
  MAX(created_at) AS last_asked_at
FROM qa_logs
GROUP BY question
ORDER BY times_asked DESC;

-- ─── RLS ────────────────────────────────────────────────────────
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY knowledge_read ON knowledge_documents
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY knowledge_manage ON knowledge_documents
  FOR ALL USING (is_manager());

ALTER TABLE qa_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY qa_own_read ON qa_logs
  FOR SELECT USING (employee_id = current_employee_id() OR is_manager());
CREATE POLICY qa_own_insert ON qa_logs
  FOR INSERT WITH CHECK (employee_id = current_employee_id());
CREATE POLICY qa_own_update ON qa_logs
  FOR UPDATE USING (employee_id = current_employee_id());
CREATE POLICY qa_manager ON qa_logs
  FOR ALL USING (is_manager());

COMMENT ON TABLE knowledge_documents IS 'Chunks du manuel avec embeddings pour recherche vectorielle (RAG)';
COMMENT ON TABLE qa_logs IS 'Historique des questions/réponses des employés';
COMMENT ON FUNCTION match_documents IS 'Recherche vectorielle — retourne les chunks les plus similaires';
