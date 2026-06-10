-- Stats de gamification de la formation (points, rang, série quotidienne,
-- badges, classement), calculées à partir des tentatives de quiz.
-- Points = somme des meilleurs résultats par quiz x 10. Exposée à l'app via
-- supabaseAdmin.rpc('training_stats', { p_emp }).
CREATE OR REPLACE FUNCTION public.training_stats(p_emp uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $fn$
DECLARE result jsonb;
BEGIN
  WITH best AS (
    SELECT a.employee_id, a.quiz_id,
           MAX(a.total_points) AS bp,
           bool_or(a.passed) AS passed,
           bool_or(a.max_points > 0 AND a.total_points = a.max_points) AS perfect
    FROM public.quiz_attempts a
    WHERE a.completed_at IS NOT NULL
    GROUP BY a.employee_id, a.quiz_id
  ),
  emp_points AS (
    SELECT e.id AS employee_id, e.first_name, e.last_name,
           COALESCE(SUM(b.bp), 0) * 10 AS points
    FROM public.employees e
    LEFT JOIN best b ON b.employee_id = e.id
    WHERE e.is_active AND e.role NOT IN ('patron', 'developpeur')
    GROUP BY e.id, e.first_name, e.last_name
  ),
  ranked AS (
    SELECT *, RANK() OVER (ORDER BY points DESC) AS rnk,
           COUNT(*) OVER () AS total_players
    FROM emp_points
  ),
  quiz_cat AS (
    SELECT q.id AS quiz_id, m.category AS category,
           (m.title LIKE 'Examen final%') AS is_final
    FROM public.quizzes q
    JOIN public.training_chapters ch ON ch.id = q.chapter_id
    JOIN public.training_modules m ON m.id = ch.module_id
    WHERE q.is_active AND m.is_active
  ),
  days AS (
    SELECT DISTINCT (a.completed_at AT TIME ZONE 'America/Toronto')::date AS d
    FROM public.quiz_attempts a
    WHERE a.employee_id = p_emp AND a.completed_at IS NOT NULL
  ),
  streak AS (
    SELECT CASE WHEN (SELECT MAX(d) FROM days) >= current_date - 1
      THEN (SELECT COUNT(*) FROM (
              SELECT d, ROW_NUMBER() OVER (ORDER BY d DESC) AS rn FROM days
            ) z WHERE z.d = (SELECT MAX(d) FROM days) - ((z.rn - 1)::int))
      ELSE 0 END AS s
  )
  SELECT jsonb_build_object(
    'points', COALESCE((SELECT points FROM ranked WHERE employee_id = p_emp), 0),
    'rank', COALESCE((SELECT rnk FROM ranked WHERE employee_id = p_emp), 0),
    'total_players', COALESCE((SELECT MAX(total_players) FROM ranked), 0),
    'quizzes_total', (SELECT COUNT(*) FROM quiz_cat WHERE NOT is_final),
    'quizzes_passed', (SELECT COUNT(*) FROM best b WHERE b.employee_id = p_emp AND b.passed),
    'perfect_count', (SELECT COUNT(*) FROM best b WHERE b.employee_id = p_emp AND b.perfect),
    'attempts', (SELECT COUNT(*) FROM public.quiz_attempts a WHERE a.employee_id = p_emp AND a.completed_at IS NOT NULL),
    'finals_passed', (SELECT COUNT(*) FROM best b JOIN quiz_cat c ON c.quiz_id = b.quiz_id WHERE b.employee_id = p_emp AND b.passed AND c.is_final),
    'daily_streak', (SELECT s FROM streak),
    'by_category', (
      SELECT COALESCE(jsonb_object_agg(category, info), '{}'::jsonb) FROM (
        SELECT c.category,
               jsonb_build_object(
                 'total', COUNT(*) FILTER (WHERE NOT c.is_final),
                 'passed', COUNT(*) FILTER (WHERE NOT c.is_final AND b.passed)
               ) AS info
        FROM quiz_cat c
        LEFT JOIN best b ON b.quiz_id = c.quiz_id AND b.employee_id = p_emp
        WHERE c.category IS NOT NULL
        GROUP BY c.category
      ) s
    ),
    'leaderboard', (
      SELECT COALESCE(jsonb_agg(row ORDER BY rnk, first_name), '[]'::jsonb) FROM (
        SELECT rnk, first_name,
          jsonb_build_object(
            'name', trim(first_name || ' ' || COALESCE(left(last_name, 1) || '.', '')),
            'points', points, 'rank', rnk, 'is_me', employee_id = p_emp
          ) AS row
        FROM ranked ORDER BY rnk, first_name LIMIT 10
      ) lb
    )
  ) INTO result;
  RETURN result;
END
$fn$;
