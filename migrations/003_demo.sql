-- Migration 003 : Données de démonstration (dev uniquement)
-- Quelques fiches publiées pour tester l'interface

DO $$
DECLARE
  v_cat_restaurant INTEGER;
  v_cat_plage      INTEGER;
  v_cat_parc       INTEGER;
  v_commune_sp     INTEGER;
  v_commune_sgb    INTEGER;
  v_commune_sd     INTEGER;
  v_place_a        UUID;
  v_place_b        UUID;
  v_place_c        UUID;
  v_source_a       UUID;
  v_source_b       UUID;
  v_source_c       UUID;
BEGIN
  SELECT id INTO v_cat_restaurant FROM place_categories WHERE slug = 'restaurant';
  SELECT id INTO v_cat_plage      FROM place_categories WHERE slug = 'plage';
  SELECT id INTO v_cat_parc       FROM place_categories WHERE slug = 'parc';
  SELECT id INTO v_commune_sp     FROM communes WHERE slug = 'saint-pierre';
  SELECT id INTO v_commune_sgb    FROM communes WHERE slug = 'saint-gilles-les-bains';
  SELECT id INTO v_commune_sd     FROM communes WHERE slug = 'saint-denis';

  -- Fiche 1 : restaurant à Saint-Pierre
  INSERT INTO places (
    slug, name, normalized_name, category_id, short_description,
    dog_policy, dog_conditions_text, confidence_score, confidence_level,
    verification_status, last_verified_at, next_review_at,
    address_text, commune_id, lat, lng,
    geom, published_at
  ) VALUES (
    'le-refuge-saint-pierre',
    'Le Refuge',
    'le refuge',
    v_cat_restaurant,
    'Restaurant familial avec terrasse couverte acceptant les chiens tenus en laisse.',
    'conditional',
    'Chiens acceptés en terrasse uniquement, tenus en laisse.',
    75, 'high',
    'published',
    now() - interval '10 days',
    now() + interval '80 days',
    '12 rue des Lataniers, 97410 Saint-Pierre',
    v_commune_sp,
    -21.3410, 55.4790,
    ST_SetSRID(ST_MakePoint(55.4790, -21.3410), 4326),
    now() - interval '10 days'
  ) RETURNING id INTO v_place_a;

  INSERT INTO place_sources (
    place_id, source_type, source_url, source_label,
    raw_excerpt, claim_dog_policy, claim_conditions_text,
    claim_confidence, is_primary, review_status, published_or_seen_at
  ) VALUES (
    v_place_a, 'official_website',
    'https://example-refuge-saintpierre.re',
    'Site officiel Le Refuge',
    '"Nos amis à 4 pattes sont les bienvenus en terrasse, tenus en laisse."',
    'conditional', 'En terrasse uniquement, en laisse.',
    80, true, 'accepted', now() - interval '12 days'
  ) RETURNING id INTO v_source_a;

  UPDATE places SET source_primary_id = v_source_a WHERE id = v_place_a;

  -- Fiche 2 : plage à Saint-Gilles
  INSERT INTO places (
    slug, name, normalized_name, category_id, short_description,
    dog_policy, dog_conditions_text, confidence_score, confidence_level,
    verification_status, last_verified_at, next_review_at,
    address_text, commune_id, lat, lng,
    geom, published_at
  ) VALUES (
    'plage-des-roches-noires',
    'Plage des Roches Noires',
    'plage des roches noires',
    v_cat_plage,
    'Plage ouverte aux chiens en dehors des horaires de baignade (avant 9h et après 18h).',
    'conditional',
    'Chiens autorisés avant 9h et après 18h. Hors saison : accès libre.',
    65, 'medium',
    'published',
    now() - interval '30 days',
    now() + interval '60 days',
    'Front de mer, 97434 Saint-Gilles-les-Bains',
    v_commune_sgb,
    -21.0590, 55.2215,
    ST_SetSRID(ST_MakePoint(55.2215, -21.0590), 4326),
    now() - interval '30 days'
  ) RETURNING id INTO v_place_b;

  INSERT INTO place_sources (
    place_id, source_type, source_url, source_label,
    raw_excerpt, claim_dog_policy, claim_conditions_text,
    claim_confidence, is_primary, review_status, published_or_seen_at
  ) VALUES (
    v_place_b, 'official_website',
    'https://mairie-saintpaul.re/espaces-naturels/plages',
    'Mairie de Saint-Paul — Règlement des plages',
    '"Accès avec animaux autorisé avant 9h et après 18h en période estivale."',
    'conditional', 'Avant 9h et après 18h en été.',
    70, true, 'accepted', now() - interval '60 days'
  ) RETURNING id INTO v_source_b;

  UPDATE places SET source_primary_id = v_source_b WHERE id = v_place_b;

  -- Fiche 3 : parc à Saint-Denis (inconnu)
  INSERT INTO places (
    slug, name, normalized_name, category_id, short_description,
    dog_policy, confidence_score, confidence_level,
    verification_status, last_verified_at, next_review_at,
    address_text, commune_id, lat, lng,
    geom, published_at
  ) VALUES (
    'jardin-de-l-etat-saint-denis',
    'Jardin de l''État',
    'jardin de l etat',
    v_cat_parc,
    'Jardin botanique historique au centre de Saint-Denis.',
    'unknown',
    30, 'low',
    'published',
    now() - interval '90 days',
    now() - interval '1 day',
    'Place Léon Dierx, 97400 Saint-Denis',
    v_commune_sd,
    -20.8820, 55.4510,
    ST_SetSRID(ST_MakePoint(55.4510, -20.8820), 4326),
    now() - interval '90 days'
  ) RETURNING id INTO v_place_c;

  INSERT INTO place_sources (
    place_id, source_type, source_label,
    raw_excerpt, claim_dog_policy,
    claim_confidence, is_primary, review_status
  ) VALUES (
    v_place_c, 'manual',
    'Vérification terrain à planifier',
    'Aucune mention explicite de la politique chien trouvée.',
    'unknown',
    30, true, 'accepted'
  ) RETURNING id INTO v_source_c;

  UPDATE places SET source_primary_id = v_source_c WHERE id = v_place_c;

  -- Une soumission en attente
  INSERT INTO submissions (
    type, submitted_name, submitted_category, submitted_commune,
    submitted_dog_policy, submitted_conditions_text, submitted_message,
    submitter_email, status
  ) VALUES (
    'new_place', 'Café Vanille', 'cafe', 'Saint-Leu',
    'allowed', 'Chiens acceptés partout, même en salle.',
    'Adore cet endroit avec mon chien, l''équipe est super accueillante !',
    'visiteur@example.re', 'received'
  );

END $$;
