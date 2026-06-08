-- Fonction utilitaire pour (re)charger un module de quiz à partir d'un objet JSON.
-- Idempotente : supprime le module existant (par titre) puis recrée
-- module → chapitre → quiz → questions → choix.
-- Utilisée par scripts/load_quiz_json.py (données dans scripts/data/*.json).
CREATE OR REPLACE FUNCTION public.seed_quiz_module(data jsonb) RETURNS void AS $fn$
DECLARE
  m_id uuid; c_id uuid; q_id uuid; qq uuid;
  v_title text := data->>'title';
  v_cat   text := data->>'category';
  v_desc  text := 'Examen de certification — ' || v_cat || '. ' || v_title || '.';
  v_so    int  := (data->>'sort_order')::int;
  v_pass  numeric := COALESCE((data->>'passing_score')::numeric, 0.70);
  q jsonb; ch jsonb; qi int := 0; ci int; corr int;
BEGIN
  DELETE FROM public.training_modules WHERE title = v_title;
  INSERT INTO public.training_modules (title, description, content_type, category, sort_order, is_active)
    VALUES (v_title, v_desc, 'text', v_cat, v_so, true) RETURNING id INTO m_id;
  INSERT INTO public.training_chapters (module_id, title, sort_order)
    VALUES (m_id, v_title, 0) RETURNING id INTO c_id;
  INSERT INTO public.quizzes (chapter_id, title, description, passing_score, is_active)
    VALUES (c_id, 'Examen — ' || v_title, v_desc, v_pass, true) RETURNING id INTO q_id;
  FOR q IN SELECT * FROM jsonb_array_elements(data->'questions') LOOP
    qi := qi + 1;
    corr := (q->>'correct')::int;
    INSERT INTO public.quiz_questions (quiz_id, question_text, explanation, points, sort_order)
      VALUES (q_id, q->>'q', NULLIF(q->>'explanation',''), 1, qi) RETURNING id INTO qq;
    ci := 0;
    FOR ch IN SELECT * FROM jsonb_array_elements(q->'choices') LOOP
      INSERT INTO public.quiz_choices (question_id, choice_text, is_correct, sort_order)
        VALUES (qq, ch #>> '{}', (ci = corr), ci + 1);
      ci := ci + 1;
    END LOOP;
  END LOOP;
END;
$fn$ LANGUAGE plpgsql;
