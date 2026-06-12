-- Cibles du rappel « complète ta fiche » : abonnés actifs (hors patron/dev)
-- dont la fiche est incomplète et pas déjà rappelés aujourd'hui. Utilisé par
-- le cron (passe hebdomadaire, le lundi).
CREATE OR REPLACE FUNCTION public.fiche_reminder_targets()
RETURNS TABLE(employee_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER
AS $fn$
  SELECT ps.employee_id
  FROM public.push_subscriptions ps
  JOIN public.employees e ON e.id = ps.employee_id
  JOIN public.employee_missing_info mi ON mi.id = ps.employee_id
  WHERE e.is_active
    AND e.role NOT IN ('patron', 'developpeur')
    AND mi.has_missing_info
    AND (ps.last_reminded_at IS NULL
         OR (ps.last_reminded_at AT TIME ZONE 'America/Toronto')::date
            < (now() AT TIME ZONE 'America/Toronto')::date)
  GROUP BY ps.employee_id;
$fn$;
