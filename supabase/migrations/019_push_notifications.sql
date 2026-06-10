-- Notifications push : configuration (clés VAPID) + abonnements + ciblage.

-- Config clé/valeur (clés VAPID stockées ici, pas en variables d'env).
CREATE TABLE IF NOT EXISTS public.app_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Abonnements push des employés (un par appareil/navigateur).
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  last_reminded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_push_sub_emp ON public.push_subscriptions(employee_id);

-- Cibles du rappel quotidien : abonnés dont la dernière activité = hier
-- (série en danger) et pas déjà rappelés aujourd'hui.
CREATE OR REPLACE FUNCTION public.push_reminder_targets()
RETURNS TABLE(employee_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER
AS $fn$
  SELECT ps.employee_id
  FROM public.push_subscriptions ps
  JOIN public.quiz_attempts a
    ON a.employee_id = ps.employee_id AND a.completed_at IS NOT NULL
  WHERE ps.last_reminded_at IS NULL
     OR (ps.last_reminded_at AT TIME ZONE 'America/Toronto')::date
        < (now() AT TIME ZONE 'America/Toronto')::date
  GROUP BY ps.employee_id
  HAVING MAX((a.completed_at AT TIME ZONE 'America/Toronto')::date)
         = (now() AT TIME ZONE 'America/Toronto')::date - 1;
$fn$;
