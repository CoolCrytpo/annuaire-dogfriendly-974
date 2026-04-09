-- Migration 001 : Schéma initial — Annuaire Dog Friendly 974
-- Prérequis : PostgreSQL avec extension PostGIS activée

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- pour la recherche textuelle fuzzy
CREATE EXTENSION IF NOT EXISTS unaccent;  -- pour la normalisation des accents

-- ─── ENUMS ────────────────────────────────────────────────────────────────────

CREATE TYPE dog_policy AS ENUM ('allowed', 'conditional', 'disallowed', 'unknown');

CREATE TYPE verification_status AS ENUM (
  'draft',
  'pending_review',
  'published',
  'needs_recheck',
  'conflict',
  'archived'
);

CREATE TYPE source_type AS ENUM (
  'manual',
  'official_website',
  'google_places',
  'osm',
  'user_submission',
  'phone_call',
  'onsite_check',
  'partner_feed',
  'social_page',
  'booking_site'
);

CREATE TYPE submission_type AS ENUM ('new_place', 'correction');

CREATE TYPE submission_status AS ENUM (
  'received',
  'triaged',
  'accepted',
  'rejected',
  'merged'
);

CREATE TYPE confidence_level AS ENUM ('high', 'medium', 'low');

CREATE TYPE user_role AS ENUM ('admin', 'editor');

-- ─── USERS ────────────────────────────────────────────────────────────────────

CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  role       user_role NOT NULL DEFAULT 'editor',
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── PLACE_CATEGORIES ─────────────────────────────────────────────────────────

CREATE TABLE place_categories (
  id         SERIAL PRIMARY KEY,
  slug       TEXT NOT NULL UNIQUE,
  label      TEXT NOT NULL,
  icon       TEXT,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT true
);

-- ─── COMMUNES ─────────────────────────────────────────────────────────────────

CREATE TABLE communes (
  id   SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  lat  DOUBLE PRECISION NOT NULL,
  lng  DOUBLE PRECISION NOT NULL,
  geom GEOMETRY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lng, lat), 4326)) STORED
);

CREATE INDEX idx_communes_geom ON communes USING GIST (geom);

-- ─── PLACES ───────────────────────────────────────────────────────────────────

CREATE TABLE places (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug               TEXT NOT NULL UNIQUE,
  name               TEXT NOT NULL,
  normalized_name    TEXT NOT NULL,
  category_id        INTEGER REFERENCES place_categories(id),
  short_description  TEXT,
  editorial_summary  TEXT,

  -- Politique chien
  dog_policy         dog_policy NOT NULL DEFAULT 'unknown',
  dog_conditions_text TEXT,

  -- Confiance
  confidence_score   SMALLINT NOT NULL DEFAULT 0 CHECK (confidence_score BETWEEN 0 AND 100),
  confidence_level   confidence_level NOT NULL DEFAULT 'low',
  confidence_detail  JSONB,   -- détail admin des signaux

  -- Statut éditorial
  verification_status verification_status NOT NULL DEFAULT 'draft',
  last_verified_at   TIMESTAMPTZ,
  next_review_at     TIMESTAMPTZ,
  is_featured        BOOLEAN NOT NULL DEFAULT false,

  -- Localisation
  address_text       TEXT,
  commune_id         INTEGER REFERENCES communes(id),
  postal_code        TEXT,
  country_code       CHAR(2) NOT NULL DEFAULT 'RE',
  lat                DOUBLE PRECISION,
  lng                DOUBLE PRECISION,
  geom               GEOMETRY(Point, 4326),

  -- Contact
  website_url        TEXT,
  phone              TEXT,
  email_public       TEXT,
  opening_hours_text TEXT,
  price_level        SMALLINT CHECK (price_level BETWEEN 1 AND 4),

  -- Relations
  source_primary_id  UUID,   -- FK ajoutée après création de place_sources

  -- Timestamps
  published_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER places_updated_at
  BEFORE UPDATE ON places
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Index
CREATE INDEX idx_places_slug            ON places (slug);
CREATE INDEX idx_places_normalized_name ON places USING GIN (normalized_name gin_trgm_ops);
CREATE INDEX idx_places_dog_policy      ON places (dog_policy);
CREATE INDEX idx_places_status          ON places (verification_status);
CREATE INDEX idx_places_next_review     ON places (next_review_at) WHERE next_review_at IS NOT NULL;
CREATE INDEX idx_places_commune         ON places (commune_id);
CREATE INDEX idx_places_category        ON places (category_id);
CREATE INDEX idx_places_geom            ON places USING GIST (geom);
CREATE INDEX idx_places_fts             ON places USING GIN (
  to_tsvector('french', coalesce(name, '') || ' ' || coalesce(short_description, '') || ' ' || coalesce(editorial_summary, ''))
);

-- ─── PLACE_SOURCES ────────────────────────────────────────────────────────────

CREATE TABLE place_sources (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id                UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  source_type             source_type NOT NULL,
  source_url              TEXT,
  source_label            TEXT,
  collected_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_or_seen_at    TIMESTAMPTZ,
  raw_excerpt             TEXT,
  structured_payload_json JSONB,

  -- Revendication de cette source
  claim_dog_policy        dog_policy,
  claim_conditions_text   TEXT,
  claim_confidence        SMALLINT CHECK (claim_confidence BETWEEN 0 AND 100),

  -- Flags
  is_primary              BOOLEAN NOT NULL DEFAULT false,
  is_conflicting          BOOLEAN NOT NULL DEFAULT false,
  review_status           TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'accepted', 'rejected')),
  reviewed_by             UUID REFERENCES users(id),
  reviewed_at             TIMESTAMPTZ
);

CREATE INDEX idx_place_sources_place_id ON place_sources (place_id);
CREATE INDEX idx_place_sources_type     ON place_sources (source_type);

-- FK retardée
ALTER TABLE places ADD CONSTRAINT fk_source_primary
  FOREIGN KEY (source_primary_id) REFERENCES place_sources(id) DEFERRABLE INITIALLY DEFERRED;

-- ─── SUBMISSIONS ──────────────────────────────────────────────────────────────

CREATE TABLE submissions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type                    submission_type NOT NULL,
  related_place_id        UUID REFERENCES places(id),
  submitted_name          TEXT,
  submitted_category      TEXT,
  submitted_commune       TEXT,
  submitted_url           TEXT,
  submitted_dog_policy    dog_policy,
  submitted_conditions_text TEXT,
  submitted_message       TEXT,
  submitter_email         TEXT,
  attachment_url          TEXT,
  status                  submission_status NOT NULL DEFAULT 'received',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  handled_at              TIMESTAMPTZ,
  handled_by              UUID REFERENCES users(id)
);

CREATE INDEX idx_submissions_status     ON submissions (status);
CREATE INDEX idx_submissions_created_at ON submissions (created_at DESC);

-- ─── MEDIA_ASSETS ─────────────────────────────────────────────────────────────

CREATE TABLE media_assets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id        UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  asset_type      TEXT NOT NULL DEFAULT 'image' CHECK (asset_type IN ('image', 'video', 'document')),
  url             TEXT NOT NULL,
  alt_text        TEXT,
  source_type     source_type,
  copyright_note  TEXT,
  is_cover        BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_media_assets_place_id ON media_assets (place_id);

-- ─── VERIFICATION_EVENTS ──────────────────────────────────────────────────────

CREATE TABLE verification_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id            UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  verified_by         UUID REFERENCES users(id),
  verification_method TEXT,
  previous_dog_policy dog_policy,
  new_dog_policy      dog_policy NOT NULL,
  notes               TEXT,
  verified_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_verification_events_place_id ON verification_events (place_id);

-- ─── DUPLICATES_QUEUE ─────────────────────────────────────────────────────────

CREATE TABLE duplicates_queue (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id_a       UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  place_id_b       UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  similarity_score NUMERIC(4,2) NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed_duplicate', 'not_duplicate', 'merged')),
  resolved_by      UUID REFERENCES users(id),
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_pair CHECK (place_id_a < place_id_b),
  UNIQUE (place_id_a, place_id_b)
);

CREATE INDEX idx_duplicates_status ON duplicates_queue (status);

-- ─── AUDIT_LOGS ───────────────────────────────────────────────────────────────

CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  entity_type TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  action      TEXT NOT NULL,
  before_json JSONB,
  after_json  JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_entity     ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);

-- ─── ADMIN SESSIONS ───────────────────────────────────────────────────────────

CREATE TABLE admin_sessions (
  id         TEXT PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_sessions_user_id ON admin_sessions (user_id);
