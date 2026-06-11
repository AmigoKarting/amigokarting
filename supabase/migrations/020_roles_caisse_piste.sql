-- Nouveaux rôles « caisse » et « piste » : employés réguliers (apprenants)
-- avec formation ciblée. Ils ne sont PAS du staff (pas d'accès gestion).
-- On élargit simplement la contrainte de rôle (developpeur déjà utilisé en prod).
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_role_check;
ALTER TABLE public.employees ADD CONSTRAINT employees_role_check
  CHECK (role IN ('employee', 'manager', 'patron', 'developpeur', 'caisse', 'piste'));
