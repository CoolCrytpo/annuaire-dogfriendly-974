-- Migration 005 : Balades + Services complets
-- Dépend de 001, 002, 004

-- ─── LISTING_TYPE : ajout 'balade' ────────────────────────────────────────────

-- PostgreSQL ne supporte pas ALTER CHECK directement — on recrée la contrainte
ALTER TABLE place_categories
  DROP CONSTRAINT IF EXISTS place_categories_listing_type_check;

ALTER TABLE place_categories
  ADD CONSTRAINT place_categories_listing_type_check
  CHECK (listing_type IN ('lieu', 'spot', 'balade', 'service'));

-- Reclasser randonnée comme balade (plus que spot)
UPDATE place_categories SET listing_type = 'balade' WHERE slug = 'randonnee';

-- Nouvelles catégories de services manquantes
INSERT INTO place_categories (slug, label, icon, sort_order, listing_type) VALUES
  ('educateur',   'Éducateur canin',  '🐕‍🦺', 125, 'service'),
  ('pet_sitting', 'Pet-sitting',      '🛏️',  130, 'service')
ON CONFLICT (slug) DO NOTHING;

-- Reclasser 'transport' en service (était neutre avant)
UPDATE place_categories SET listing_type = 'service' WHERE slug = 'transport';

-- ─── TRAIL_DETAILS sur places ─────────────────────────────────────────────────

-- Champ JSONB pour les données spécifiques aux balades/randonnées
ALTER TABLE places
  ADD COLUMN IF NOT EXISTS trail_details JSONB;

-- Structure attendue :
-- {
--   "difficulty": "easy" | "moderate" | "hard" | "expert",
--   "distance_km": number,
--   "elevation_m": number,
--   "duration_minutes": number,
--   "terrain_type": "forest" | "coastal" | "mountain" | "mixed",
--   "leash_required": boolean,
--   "has_water_points": boolean,
--   "water_points_desc": string | null,
--   "regulated_zones": string | null,
--   "start_lat": number | null,
--   "start_lng": number | null
-- }

-- ─── AD SLOTS supplémentaires ─────────────────────────────────────────────────

INSERT INTO ad_slots (slot_key, label, position, description) VALUES
  ('balades_list_inline',   'Inline balades — position 4', 'list',       'Encart dans la liste des balades'),
  ('services_list_inline',  'Inline services — position 4','list',       'Encart dans la liste des services'),
  ('fiche_bas',             'Bas de fiche lieu',           'place_page', 'Encart en bas de toute fiche')
ON CONFLICT (slot_key) DO NOTHING;

-- ─── INDEX pour trail_details ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_places_trail_difficulty
  ON places ((trail_details->>'difficulty'))
  WHERE trail_details IS NOT NULL;
