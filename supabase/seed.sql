-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Amigo Karting — Données de démonstration                       ║
-- ║  Usage : supabase db seed  OU  psql < supabase/seed.sql         ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- 1. EMPLOYÉS
INSERT INTO employees (id, first_name, last_name, phone, phone_last4, role, email, address, city, postal_code, emergency_contact_name, emergency_contact_phone, uniform_size_shirt) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Admin',   'Karting',   '514-555-0000', '0000', 'manager',  'admin@amigo.local', '100 boul. du Karting', 'Québec', 'G1K 1A1', 'Marie Karting',  '514-555-0001', 'L'),
  ('a0000000-0000-0000-0000-000000000002', 'Marc',    'Tremblay',  '514-555-1234', '1234', 'employee', NULL,                '456 rue Laval',        'Québec', 'G1R 2B3', 'Julie Tremblay', '514-555-1235', 'M'),
  ('a0000000-0000-0000-0000-000000000003', 'Sophie',  'Lavoie',    '514-555-5678', '5678', 'employee', NULL,                NULL,                    NULL,     NULL,       NULL,              NULL,            NULL),
  ('a0000000-0000-0000-0000-000000000004', 'Alex',    'Gagné',     '514-555-9012', '9012', 'employee', NULL,                '789 av. Cartier',      'Québec', 'G1R 4C5', 'Paul Gagné',      '514-555-9013', 'L'),
  ('a0000000-0000-0000-0000-000000000005', 'Camille', 'Bouchard',  NULL,            '3456', 'employee', NULL,                NULL,                    NULL,     NULL,       NULL,              NULL,            NULL);

-- 2. MODULES
INSERT INTO training_modules (id, title, description, sort_order) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Accueil et service client',  'Accueil, forfaits et réservations.',                   1),
  ('b0000000-0000-0000-0000-000000000002', 'Sécurité sur la piste',      'Équipements, briefing et procédures d''urgence.',      2),
  ('b0000000-0000-0000-0000-000000000003', 'Opérations quotidiennes',    'Ouverture, entretien des karts, caisse et fermeture.', 3);

-- 3. CHAPITRES
INSERT INTO training_chapters (id, module_id, title, sort_order) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Premier contact',             1),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Présentation des forfaits',   2),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Gestion des réservations',    3),
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'Équipements de protection',   1),
  ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 'Briefing sécurité piste',     2),
  ('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000002', 'Procédures d''urgence',       3),
  ('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000003', 'Ouverture du centre',         1),
  ('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000003', 'Entretien des karts',         2),
  ('c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000003', 'Caisse et fermeture',         3);

-- 4. VIDÉOS (URLs placeholder)
INSERT INTO training_videos (id, chapter_id, title, description, video_url, duration_sec, sort_order) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Salutations et attitude',       'Comment accueillir un client',                      'https://SUPABASE_URL/storage/v1/object/public/training-videos/m1/c1/v1.mp4', 180, 1),
  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Gestion de l''attente',          'Que faire quand il y a une file',                   'https://SUPABASE_URL/storage/v1/object/public/training-videos/m1/c1/v2.mp4', 240, 2),
  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'Les différents forfaits',        'Tour simple, multi-tours, groupe, fête',            'https://SUPABASE_URL/storage/v1/object/public/training-videos/m1/c2/v1.mp4', 300, 1),
  ('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'Upselling et promotions',        'Proposer les forfaits premium',                     'https://SUPABASE_URL/storage/v1/object/public/training-videos/m1/c2/v2.mp4', 210, 2),
  ('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000004', 'Distribution des casques',       'Tailles, ajustement, hygiène',                      'https://SUPABASE_URL/storage/v1/object/public/training-videos/m2/c4/v1.mp4', 270, 1),
  ('d0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000004', 'Vérification avant course',      'Checklist pré-départ obligatoire',                  'https://SUPABASE_URL/storage/v1/object/public/training-videos/m2/c4/v2.mp4', 195, 2),
  ('d0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000005', 'Règles de la piste',             'Dépassements, distances, virages',                  'https://SUPABASE_URL/storage/v1/object/public/training-videos/m2/c5/v1.mp4', 360, 1),
  ('d0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000005', 'Signaux et drapeaux',            'Vert, jaune, rouge, damier',                        'https://SUPABASE_URL/storage/v1/object/public/training-videos/m2/c5/v2.mp4', 240, 2),
  ('d0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000006', 'Collision sur la piste',         'Étapes d''intervention en cas d''accident',         'https://SUPABASE_URL/storage/v1/object/public/training-videos/m2/c6/v1.mp4', 420, 1),
  ('d0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000006', 'Premiers soins de base',         'Gestes essentiels en attendant les secours',        'https://SUPABASE_URL/storage/v1/object/public/training-videos/m2/c6/v2.mp4', 480, 2);

-- 5. QUIZ + QUESTIONS + CHOIX
INSERT INTO quizzes (id, chapter_id, title, passing_score) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'Quiz — Équipements de protection', 0.70),
  ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000005', 'Quiz — Sécurité piste',            0.75);

INSERT INTO quiz_questions (id, quiz_id, question_text, explanation, sort_order) VALUES
  ('ef000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Que vérifier en premier lors de la distribution d''un casque ?',        'La taille est primordiale : un casque mal ajusté ne protège pas.',                                     1),
  ('ef000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'Un client refuse de porter le casque. Que faites-vous ?',                'Le port du casque est OBLIGATOIRE. Aucune exception.',                                                 2),
  ('ef000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'Fréquence de désinfection des casques ?',                                'Les casques sont désinfectés après CHAQUE utilisation.',                                               3),
  ('ef000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001', 'Un casque est fissuré. Bonne action ?',                                  'Un casque endommagé doit être retiré immédiatement et signalé.',                                       4),
  ('ef000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000002', 'Que signifie le drapeau jaune ?',                                        'Drapeau jaune = ATTENTION — ralentir et ne pas dépasser.',                                             1),
  ('ef000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000002', 'Distance minimale entre deux karts ?',                                   'Distance minimale de 2 mètres (environ une longueur de kart).',                                        2),
  ('ef000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000002', 'Un kart s''arrête en pleine piste. Que faire ?',                         'Drapeau jaune → arrêt de course → sécuriser le kart immobilisé.',                                      3);

INSERT INTO quiz_choices (question_id, choice_text, is_correct, sort_order) VALUES
  ('ef000000-0000-0000-0000-000000000001', 'La couleur préférée du client',              false, 1),
  ('ef000000-0000-0000-0000-000000000001', 'La taille et l''ajustement',                  true,  2),
  ('ef000000-0000-0000-0000-000000000001', 'Le modèle le plus récent',                   false, 3),
  ('ef000000-0000-0000-0000-000000000001', 'La marque du casque',                         false, 4),
  ('ef000000-0000-0000-0000-000000000002', 'On le laisse rouler, c''est son choix',       false, 1),
  ('ef000000-0000-0000-0000-000000000002', 'On explique que c''est obligatoire',           true,  2),
  ('ef000000-0000-0000-0000-000000000002', 'On propose un rabais',                        false, 3),
  ('ef000000-0000-0000-0000-000000000002', 'On appelle la police',                        false, 4),
  ('ef000000-0000-0000-0000-000000000003', 'Une fois par semaine',                        false, 1),
  ('ef000000-0000-0000-0000-000000000003', 'Après chaque utilisation',                     true,  2),
  ('ef000000-0000-0000-0000-000000000003', 'Une fois par jour',                           false, 3),
  ('ef000000-0000-0000-0000-000000000003', 'Quand ils sentent mauvais',                   false, 4),
  ('ef000000-0000-0000-0000-000000000004', 'On met du ruban adhésif',                     false, 1),
  ('ef000000-0000-0000-0000-000000000004', 'On le donne à un client plus petit',          false, 2),
  ('ef000000-0000-0000-0000-000000000004', 'On le retire et signale au gestionnaire',      true,  3),
  ('ef000000-0000-0000-0000-000000000004', 'On le garde en réserve',                      false, 4),
  ('ef000000-0000-0000-0000-000000000005', 'La course est terminée',                      false, 1),
  ('ef000000-0000-0000-0000-000000000005', 'Ralentir et ne pas dépasser',                  true,  2),
  ('ef000000-0000-0000-0000-000000000005', 'Accélérer pour s''éloigner du danger',        false, 3),
  ('ef000000-0000-0000-0000-000000000005', 'Rentrer immédiatement au stand',              false, 4),
  ('ef000000-0000-0000-0000-000000000006', '50 cm',    false, 1),
  ('ef000000-0000-0000-0000-000000000006', '1 mètre',  false, 2),
  ('ef000000-0000-0000-0000-000000000006', '2 mètres',  true,  3),
  ('ef000000-0000-0000-0000-000000000006', '5 mètres', false, 4),
  ('ef000000-0000-0000-0000-000000000007', 'On attend qu''il redémarre',                  false, 1),
  ('ef000000-0000-0000-0000-000000000007', 'On continue normalement',                     false, 2),
  ('ef000000-0000-0000-0000-000000000007', 'Drapeau jaune, arrêt, sécuriser le kart',      true,  3),
  ('ef000000-0000-0000-0000-000000000007', 'On le pousse avec notre kart',                false, 4);

-- 6. PROGRESSION SIMULÉE
INSERT INTO video_watch_log (employee_id, video_id, watched_sec, max_position, completed, completed_at) VALUES
  ('a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 180, 180, true,  now() - INTERVAL '3 days'),
  ('a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 240, 240, true,  now() - INTERVAL '3 days'),
  ('a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000005', 200, 200, false, NULL),
  ('a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000006', 195, 195, true,  now() - INTERVAL '1 day'),
  ('a0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 90,  90,  false, NULL);

DO $$ BEGIN RAISE NOTICE 'Seed OK — % employés, % modules, % vidéos, % quiz',
  (SELECT count(*) FROM employees), (SELECT count(*) FROM training_modules),
  (SELECT count(*) FROM training_videos), (SELECT count(*) FROM quizzes);
END $$;
