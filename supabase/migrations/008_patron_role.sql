-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Amigo Karting — 008 : Ajout du rôle Patron                     ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- Modifier la contrainte de rôle pour accepter 'patron'
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_role_check;
ALTER TABLE employees ADD CONSTRAINT employees_role_check 
  CHECK (role IN ('employee', 'manager', 'patron'));

-- Mettre à jour la fonction is_manager() pour inclure le patron
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.employees
    WHERE auth_user_id = auth.uid()
      AND role IN ('manager', 'patron')
      AND is_active = true
  );
END;
$$;

-- Mettre à jour le trigger qui empêche de supprimer le dernier gestionnaire
CREATE OR REPLACE FUNCTION public.check_last_manager()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.role IN ('manager', 'patron') AND (NEW.role = 'employee' OR NEW.is_active = false) THEN
    IF (
      SELECT COUNT(*) FROM employees
      WHERE role IN ('manager', 'patron') AND is_active = true AND id != OLD.id
    ) = 0 THEN
      RAISE EXCEPTION 'Impossible de retirer le dernier gestionnaire/patron actif';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
