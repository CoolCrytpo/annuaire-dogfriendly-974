// Types métier centraux — Annuaire Dog Friendly 974

export type DogPolicy = 'allowed' | 'conditional' | 'disallowed' | 'unknown'

export type VerificationStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'needs_recheck'
  | 'conflict'
  | 'archived'

export type SourceType =
  | 'manual'
  | 'official_website'
  | 'google_places'
  | 'osm'
  | 'user_submission'
  | 'phone_call'
  | 'onsite_check'
  | 'partner_feed'
  | 'social_page'
  | 'booking_site'

export type SubmissionType = 'new_place' | 'correction'

export type SubmissionStatus = 'received' | 'triaged' | 'accepted' | 'rejected' | 'merged'

export type ConfidenceLevel = 'high' | 'medium' | 'low'

export type UserRole = 'admin' | 'editor'

// ─── Entités ──────────────────────────────────────────────────────────────────

export interface PlaceCategory {
  id: number
  slug: string
  label: string
  icon: string | null
  sort_order: number
  is_active: boolean
}

export interface Commune {
  id: number
  slug: string
  name: string
  lat: number
  lng: number
}

export interface Place {
  id: string
  slug: string
  name: string
  normalized_name: string
  category_id: number | null
  category?: PlaceCategory
  short_description: string | null
  editorial_summary: string | null

  dog_policy: DogPolicy
  dog_conditions_text: string | null

  confidence_score: number
  confidence_level: ConfidenceLevel
  confidence_detail?: ConfidenceDetail | null

  verification_status: VerificationStatus
  last_verified_at: string | null
  next_review_at: string | null
  is_featured: boolean

  address_text: string | null
  commune_id: number | null
  commune?: Commune
  postal_code: string | null
  country_code: string
  lat: number | null
  lng: number | null

  website_url: string | null
  phone: string | null
  email_public: string | null
  opening_hours_text: string | null
  price_level: number | null

  source_primary_id: string | null
  source_primary?: PlaceSource

  published_at: string | null
  created_at: string
  updated_at: string
}

export interface PlaceSource {
  id: string
  place_id: string
  source_type: SourceType
  source_url: string | null
  source_label: string | null
  collected_at: string
  published_or_seen_at: string | null
  raw_excerpt: string | null
  structured_payload_json: unknown | null

  claim_dog_policy: DogPolicy | null
  claim_conditions_text: string | null
  claim_confidence: number | null

  is_primary: boolean
  is_conflicting: boolean
  review_status: 'pending' | 'accepted' | 'rejected'
  reviewed_by: string | null
  reviewed_at: string | null
}

export interface Submission {
  id: string
  type: SubmissionType
  related_place_id: string | null
  submitted_name: string | null
  submitted_category: string | null
  submitted_commune: string | null
  submitted_url: string | null
  submitted_dog_policy: DogPolicy | null
  submitted_conditions_text: string | null
  submitted_message: string | null
  submitter_email: string | null
  attachment_url: string | null
  status: SubmissionStatus
  created_at: string
  handled_at: string | null
  handled_by: string | null
}

export interface MediaAsset {
  id: string
  place_id: string
  asset_type: 'image' | 'video' | 'document'
  url: string
  alt_text: string | null
  source_type: SourceType | null
  copyright_note: string | null
  is_cover: boolean
  created_at: string
}

export interface VerificationEvent {
  id: string
  place_id: string
  verified_by: string | null
  verification_method: string | null
  previous_dog_policy: DogPolicy | null
  new_dog_policy: DogPolicy
  notes: string | null
  verified_at: string
}

export interface DuplicateQueueItem {
  id: string
  place_id_a: string
  place_id_b: string
  place_a?: Place
  place_b?: Place
  similarity_score: number
  status: 'pending' | 'confirmed_duplicate' | 'not_duplicate' | 'merged'
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string | null
  entity_type: string
  entity_id: string
  action: string
  before_json: unknown | null
  after_json: unknown | null
  created_at: string
}

export interface AdminUser {
  id: string
  email: string
  name: string
  role: UserRole
  created_at: string
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

export interface ConfidenceSignal {
  label: string
  delta: number
}

export interface ConfidenceDetail {
  raw_score: number
  signals: ConfidenceSignal[]
  freshness_multiplier: number
}

// ─── API responses ────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  per_page: number
}

export interface ApiError {
  error: string
  details?: unknown
}

// ─── Search/Filter params ─────────────────────────────────────────────────────

export interface PlaceSearchParams {
  q?: string
  dog_policy?: DogPolicy
  category_slug?: string
  commune_slug?: string
  lat?: number
  lng?: number
  radius_km?: number
  page?: number
  per_page?: number
}

// ─── Labels publics ───────────────────────────────────────────────────────────

export const DOG_POLICY_LABELS: Record<DogPolicy, string> = {
  allowed: 'Chiens acceptés',
  conditional: 'Sous conditions',
  disallowed: 'Chiens interdits',
  unknown: 'Non renseigné',
}

export const DOG_POLICY_COLORS: Record<DogPolicy, string> = {
  allowed: 'green',
  conditional: 'amber',
  disallowed: 'red',
  unknown: 'gray',
}

export const CONFIDENCE_LEVEL_LABELS: Record<ConfidenceLevel, string> = {
  high: 'Fiable',
  medium: 'Indicatif',
  low: 'À confirmer',
}
