# Data Model — Annuaire Dog Friendly 974

## Design principles
- modèle relationnel simple
- historique conservé
- typage explicite
- géodonnées requêtables
- flexibilité contrôlée via `jsonb`

## Main enums

### DogPolicy
- `allowed`
- `conditional`
- `disallowed`
- `unknown`

### VerificationStatus
- `draft`
- `pending_review`
- `published`
- `needs_recheck`
- `conflict`
- `archived`

### SourceType
- `manual`
- `official_website`
- `google_places`
- `osm`
- `user_submission`
- `phone_call`
- `onsite_check`
- `partner_feed`
- `social_page`
- `booking_site`

### SubmissionType
- `new_place`
- `correction`

### SubmissionStatus
- `received`
- `triaged`
- `accepted`
- `rejected`
- `merged`

## Tables

### places
- `id`
- `slug`
- `name`
- `normalized_name`
- `category_id`
- `short_description`
- `editorial_summary`
- `dog_policy`
- `dog_conditions_text`
- `confidence_score`
- `confidence_level`
- `verification_status`
- `last_verified_at`
- `next_review_at`
- `is_featured`
- `address_text`
- `commune_id`
- `postal_code`
- `country_code`
- `lat`
- `lng`
- `geom`
- `website_url`
- `phone`
- `email_public`
- `opening_hours_text`
- `price_level`
- `source_primary_id`
- `published_at`
- `created_at`
- `updated_at`

### place_categories
- `id`
- `slug`
- `label`
- `icon`
- `sort_order`
- `is_active`

### communes
- `id`
- `slug`
- `name`
- `lat`
- `lng`
- `geom`

### place_sources
- `id`
- `place_id`
- `source_type`
- `source_url`
- `source_label`
- `collected_at`
- `published_or_seen_at`
- `raw_excerpt`
- `structured_payload_json`
- `claim_dog_policy`
- `claim_conditions_text`
- `claim_confidence`
- `is_primary`
- `is_conflicting`
- `review_status`
- `reviewed_by`
- `reviewed_at`

### submissions
- `id`
- `type`
- `related_place_id`
- `submitted_name`
- `submitted_category`
- `submitted_commune`
- `submitted_url`
- `submitted_dog_policy`
- `submitted_conditions_text`
- `submitted_message`
- `submitter_email`
- `attachment_url`
- `status`
- `created_at`
- `handled_at`
- `handled_by`

### media_assets
- `id`
- `place_id`
- `asset_type`
- `url`
- `alt_text`
- `source_type`
- `copyright_note`
- `is_cover`
- `created_at`

### verification_events
- `id`
- `place_id`
- `verified_by`
- `verification_method`
- `previous_dog_policy`
- `new_dog_policy`
- `notes`
- `verified_at`

### duplicates_queue
- `id`
- `place_id_a`
- `place_id_b`
- `similarity_score`
- `status`
- `resolved_by`
- `resolved_at`

### audit_logs
- `id`
- `user_id`
- `entity_type`
- `entity_id`
- `action`
- `before_json`
- `after_json`
- `created_at`

### users
- `id`
- `email`
- `name`
- `role`
- `created_at`

## Suggested indexes
- slug unique
- normalized_name index
- dog_policy index
- verification_status index
- next_review_at index
- full text GIN index
- geom GiST index
- jsonb GIN index where useful

## Data integrity rules
- `dog_policy` obligatoire
- toute fiche publiée doit avoir `last_verified_at`
- toute fiche publiée doit avoir `source_primary_id`
- toute source doit être typée
- toute fusion de doublons doit laisser une trace
