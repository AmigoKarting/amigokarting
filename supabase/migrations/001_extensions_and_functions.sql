-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Amigo Karting — 001 : Extensions & fonctions utilitaires       ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- Extension pour la recherche vectorielle (Q&A / RAG)
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Extension pour générer des UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Trigger : mise à jour automatique de updated_at ────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── Note ────────────────────────────────────────────────────────
-- Les fonctions is_manager() et current_employee_id() sont créées
-- dans 002_employees.sql APRÈS la table employees.
