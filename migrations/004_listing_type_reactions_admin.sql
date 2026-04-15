-- Migration 004 : listing_type sur catégories + réactions + tables admin v2
-- À appliquer après 001_initial.sql, 002_seed.sql

-- ─── LISTING_TYPE sur place_categories ────────────────────────────────────────

ALTER TABLE place_categories
  ADD COLUMN IF NOT EXISTS listing_type TEXT NOT NULL DEFAULT 'lieu'
  CHECK (listing_type IN ('lieu', 'spot', 'service'));

-- Catégories "spot" (espaces publics)
UPDATE place_categories SET listing_type = 'spot'
  WHERE slug IN ('plage', 'parc', 'randonnee');

-- Catégories "service" (professionnels canins)
UPDATE place_categories SET listing_type = 'service'
  WHERE slug IN ('veterinaire', 'toilettage', 'pension');

-- ─── RÉACTIONS ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id     UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('utile', 'merci', 'jadore', 'oups')),
  anon_hash    TEXT,            -- hash device anonyme (localStorage)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reactions_place_id ON reactions (place_id);
CREATE INDEX IF NOT EXISTS idx_reactions_anon     ON reactions (place_id, anon_hash);

-- ─── SITE_SETTINGS ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS site_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT,
  label       TEXT NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO site_settings (key, label, description, value) VALUES
  ('site_name',        'Nom du site',           NULL, 'Dog Friendly 974'),
  ('contact_email',    'Email de contact',       NULL, NULL),
  ('meta_description', 'Description SEO par défaut', NULL, NULL)
ON CONFLICT (key) DO NOTHING;

-- ─── SPONSORS ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sponsors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  logo_url      TEXT,
  website_url   TEXT,
  tagline       TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT false,
  display_order SMALLINT NOT NULL DEFAULT 0,
  starts_at     TIMESTAMPTZ,
  ends_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── AD_SLOTS ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ad_slots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_key     TEXT NOT NULL UNIQUE,
  label        TEXT NOT NULL,
  description  TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT false,
  content_html TEXT,
  link_url     TEXT,
  image_url    TEXT,
  position     TEXT NOT NULL DEFAULT 'list' CHECK (position IN ('header', 'list', 'place_page', 'footer', 'sidebar')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Emplacements publicitaires prédéfinis (désactivés par défaut)
INSERT INTO ad_slots (slot_key, label, position, description) VALUES
  ('home_top_banner',         'Bandeau haut — Accueil',    'header',     'Bannière principale sur la home'),
  ('home_featured_tile',      'Tuile mise en avant — Home','list',       'Tuile sponsorisée dans la grille catégories'),
  ('list_inline_3',           'Inline liste — position 3', 'list',       'Encart dans la liste des lieux, après 3 résultats'),
  ('listing_footer_banner',   'Bannière bas — Fiche',      'place_page', 'Bannière en bas de chaque fiche lieu'),
  ('map_bottom_sheet_sponsor','Sponsor carte',             'sidebar',    'Encart sponsor affiché sous la carte')
ON CONFLICT (slot_key) DO NOTHING;

-- ─── IMPORT_BATCHES ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS import_batches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  source_type   source_type NOT NULL DEFAULT 'osm',
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'error')),
  total_count   INTEGER NOT NULL DEFAULT 0,
  accepted_count INTEGER NOT NULL DEFAULT 0,
  rejected_count INTEGER NOT NULL DEFAULT 0,
  pending_count  INTEGER NOT NULL DEFAULT 0,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ
);

-- ─── PLACE_CANDIDATES ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS place_candidates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_batch_id  UUID REFERENCES import_batches(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  normalized_name  TEXT NOT NULL,
  category_slug    TEXT,
  commune_slug     TEXT,
  address_text     TEXT,
  lat              DOUBLE PRECISION,
  lng              DOUBLE PRECISION,
  website_url      TEXT,
  phone            TEXT,
  dog_policy       dog_policy NOT NULL DEFAULT 'unknown',
  dog_conditions_text TEXT,
  short_description TEXT,
  source_type      source_type NOT NULL DEFAULT 'osm',
  source_url       TEXT,
  source_label     TEXT,
  raw_data         JSONB,
  review_status    TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'accepted', 'rejected', 'duplicate')),
  matched_place_id UUID REFERENCES places(id),
  reviewed_at      TIMESTAMPTZ,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_candidates_status      ON place_candidates (review_status);
CREATE INDEX IF NOT EXISTS idx_candidates_batch       ON place_candidates (import_batch_id);
CREATE INDEX IF NOT EXISTS idx_candidates_normalized  ON place_candidates USING GIN (normalized_name gin_trgm_ops);
