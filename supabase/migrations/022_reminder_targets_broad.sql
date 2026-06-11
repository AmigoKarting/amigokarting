-- Rappel quotidien élargi : on ne vise plus seulement les « séries en danger »,
-- mais tous les abonnés actifs (hors patron/dev) qui n'ont fait AUCUNE activité
-- aujourd'hui (ni quiz complété, ni conversation) et pas déjà rappelés aujourd'hui.
CREATE OR REPLACE FUNCTION public.push_reminder_targets()
RETURNS TABLE(employee_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER
AS $fn$
  SELECT ps.employee_id
  FROM public.push_subscriptions ps
  JOIN public.employees e ON e.id = ps.employee_id
  WHERE e.is_active
    AND e.role NOT IN ('patron', 'developpeur')
    AND (ps.last_reminded_at IS NULL
         OR (ps.last_reminded_at AT TIME ZONE 'America/Toronto')::date
            < (now() AT TIME ZONE 'America/Toronto')::date)
    AND NOT EXISTS (
      SELECT 1 FROM public.quiz_attempts a
      WHERE a.employee_id = ps.employee_id
        AND a.completed_at IS NOT NULL
        AND (a.completed_at AT TIME ZONE 'America/Toronto')::date
            = (now() AT TIME ZONE 'America/Toronto')::date
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.conversation_sessions cs
      WHERE cs.employee_id = ps.employee_id
        AND (cs.created_at AT TIME ZONE 'America/Toronto')::date
            = (now() AT TIME ZONE 'America/Toronto')::date
    )
  GROUP BY ps.employee_id;
$fn$;
