-- Migration 006 : table import_sources compatible import CSV direct Supabase
-- Colonnes alignées exactement avec le format CSV d'export du scraper

CREATE TABLE IF NOT EXISTS import_sources (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id      TEXT,
  source_type      TEXT NOT NULL DEFAULT 'manual',
  source_page_type TEXT,
  name             TEXT NOT NULL,
  category         TEXT,
  subcategory      TEXT,
  commune          TEXT,
  address          TEXT,
  postal_code      TEXT,
  lat              DOUBLE PRECISION,
  lng              DOUBLE PRECISION,
  phone            TEXT,
  email            TEXT,
  website          TEXT,
  dog_policy       TEXT NOT NULL DEFAULT 'unknown',
  dog_policy_detail TEXT,
  dog_size_rule    TEXT,
  inside_allowed   TEXT,
  terrace_only     TEXT,
  leash_required   TEXT,
  extra_fee        TEXT,
  proof_excerpt    TEXT,
  confidence_score INTEGER NOT NULL DEFAULT 30,
  status           TEXT NOT NULL DEFAULT 'to_review',
  admin_notes      TEXT,
  source_url       TEXT,
  source_domain    TEXT,
  import_batch_id  TEXT,
  dedupe_key       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_import_sources_status      ON import_sources (status);
CREATE INDEX IF NOT EXISTS idx_import_sources_dedupe_key  ON import_sources (dedupe_key);
CREATE INDEX IF NOT EXISTS idx_import_sources_commune     ON import_sources (commune);
CREATE INDEX IF NOT EXISTS idx_import_sources_category    ON import_sources (category);
