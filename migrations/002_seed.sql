-- Migration 002 : Données initiales — Catégories et Communes de La Réunion

-- ─── CATÉGORIES ───────────────────────────────────────────────────────────────

INSERT INTO place_categories (slug, label, icon, sort_order) VALUES
  ('restaurant',      'Restaurant',          '🍽️',  10),
  ('cafe',            'Café & salon de thé', '☕',   20),
  ('bar',             'Bar & brasserie',     '🍺',   30),
  ('hotel',           'Hôtel & logement',    '🏨',   40),
  ('gite',            'Gîte & chambre d''hôtes', '🏡', 50),
  ('plage',           'Plage',               '🏖️',  60),
  ('parc',            'Parc & jardin',       '🌿',   70),
  ('randonnee',       'Randonnée & nature',  '🥾',   80),
  ('commerce',        'Commerce',            '🛍️',  90),
  ('veterinaire',     'Vétérinaire',         '🩺',  100),
  ('toilettage',      'Toilettage',          '✂️',  110),
  ('pension',         'Pension & garderie',  '🏠',  120),
  ('activite',        'Activité & loisir',   '🎯',  130),
  ('transport',       'Transport',           '🚗',  140),
  ('autre',           'Autre',               '📌',  200)
ON CONFLICT (slug) DO NOTHING;

-- ─── COMMUNES DE LA RÉUNION ───────────────────────────────────────────────────

INSERT INTO communes (slug, name, lat, lng) VALUES
  ('saint-denis',              'Saint-Denis',              -20.8823,  55.4504),
  ('saint-paul',               'Saint-Paul',               -21.0037,  55.2710),
  ('saint-pierre',             'Saint-Pierre',             -21.3398,  55.4781),
  ('le-tampon',                'Le Tampon',                -21.2693,  55.5152),
  ('saint-louis',              'Saint-Louis',              -21.2769,  55.4199),
  ('saint-benoit',             'Saint-Benoît',             -21.0336,  55.7156),
  ('saint-andre',              'Saint-André',              -20.9637,  55.6469),
  ('saint-joseph',             'Saint-Joseph',             -21.3858,  55.6194),
  ('saint-leu',                'Saint-Leu',                -21.1607,  55.2835),
  ('sainte-marie',             'Sainte-Marie',             -20.8980,  55.5278),
  ('sainte-suzanne',           'Sainte-Suzanne',           -20.9204,  55.6045),
  ('saint-gilles-les-bains',   'Saint-Gilles-les-Bains',  -21.0568,  55.2233),
  ('la-possession',            'La Possession',            -20.9319,  55.3366),
  ('le-port',                  'Le Port',                  -20.9353,  55.2960),
  ('l-etang-sale',             'L''Étang-Salé',            -21.2580,  55.3800),
  ('les-avirons',              'Les Avirons',              -21.2393,  55.3325),
  ('petite-ile',               'Petite-Île',               -21.3569,  55.5662),
  ('entre-deux',               'Entre-Deux',               -21.2378,  55.4745),
  ('cilaos',                   'Cilaos',                   -21.1264,  55.4769),
  ('salazie',                  'Salazie',                  -21.0301,  55.5386),
  ('la-plaine-des-palmistes',  'La Plaine-des-Palmistes',  -21.1149,  55.6316),
  ('bras-panon',               'Bras-Panon',               -21.0019,  55.6938),
  ('sainte-rose',              'Sainte-Rose',              -21.1255,  55.7899),
  ('saint-philippe',           'Saint-Philippe',           -21.3618,  55.7671)
ON CONFLICT (slug) DO NOTHING;
