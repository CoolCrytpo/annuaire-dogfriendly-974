import pool from './client'
import type {
  Place,
  PlaceSource,
  Commune,
  PlaceCategory,
  Submission,
  DuplicateQueueItem,
  PaginatedResult,
  PlaceSearchParams,
} from '@/lib/types'

// ─── Places ───────────────────────────────────────────────────────────────────

export async function getPublishedPlaces(params: PlaceSearchParams = {}): Promise<PaginatedResult<Place>> {
  const { q, dog_policy, category_slug, commune_slug, page = 1, per_page = 20 } = params
  const offset = (page - 1) * per_page
  const conditions: string[] = ["p.verification_status = 'published'"]
  const values: unknown[] = []
  let i = 1

  if (q) {
    conditions.push(`(
      p.normalized_name ILIKE $${i} OR
      to_tsvector('french', coalesce(p.name,'') || ' ' || coalesce(p.short_description,'')) @@ plainto_tsquery('french', $${i+1})
    )`)
    values.push(`%${q.toLowerCase()}%`, q)
    i += 2
  }
  if (dog_policy) {
    conditions.push(`p.dog_policy = $${i}`)
    values.push(dog_policy)
    i++
  }
  if (category_slug) {
    conditions.push(`pc.slug = $${i}`)
    values.push(category_slug)
    i++
  }
  if (commune_slug) {
    conditions.push(`cm.slug = $${i}`)
    values.push(commune_slug)
    i++
  }

  const where = conditions.join(' AND ')

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM places p
     LEFT JOIN place_categories pc ON p.category_id = pc.id
     LEFT JOIN communes cm ON p.commune_id = cm.id
     WHERE ${where}`,
    values
  )

  const result = await pool.query(
    `SELECT p.*,
       row_to_json(pc.*) AS category,
       row_to_json(cm.*) AS commune
     FROM places p
     LEFT JOIN place_categories pc ON p.category_id = pc.id
     LEFT JOIN communes cm ON p.commune_id = cm.id
     WHERE ${where}
     ORDER BY p.is_featured DESC, p.confidence_score DESC, p.name ASC
     LIMIT $${i} OFFSET $${i+1}`,
    [...values, per_page, offset]
  )

  return {
    items: result.rows,
    total: parseInt(countResult.rows[0].count),
    page,
    per_page,
  }
}

export async function getPlaceBySlug(slug: string): Promise<Place | null> {
  const result = await pool.query(
    `SELECT p.*,
       row_to_json(pc.*) AS category,
       row_to_json(cm.*) AS commune,
       row_to_json(ps.*) AS source_primary
     FROM places p
     LEFT JOIN place_categories pc ON p.category_id = pc.id
     LEFT JOIN communes cm ON p.commune_id = cm.id
     LEFT JOIN place_sources ps ON p.source_primary_id = ps.id
     WHERE p.slug = $1 AND p.verification_status = 'published'`,
    [slug]
  )
  return result.rows[0] ?? null
}

export async function getPlaceById(id: string): Promise<Place | null> {
  const result = await pool.query(
    `SELECT p.*,
       row_to_json(pc.*) AS category,
       row_to_json(cm.*) AS commune,
       row_to_json(ps.*) AS source_primary
     FROM places p
     LEFT JOIN place_categories pc ON p.category_id = pc.id
     LEFT JOIN communes cm ON p.commune_id = cm.id
     LEFT JOIN place_sources ps ON p.source_primary_id = ps.id
     WHERE p.id = $1`,
    [id]
  )
  return result.rows[0] ?? null
}

export async function getAdminPlaces(params: {
  q?: string
  status?: string
  page?: number
  per_page?: number
}): Promise<PaginatedResult<Place>> {
  const { q, status, page = 1, per_page = 30 } = params
  const offset = (page - 1) * per_page
  const conditions: string[] = []
  const values: unknown[] = []
  let i = 1

  if (q) {
    conditions.push(`(p.normalized_name ILIKE $${i} OR p.name ILIKE $${i})`)
    values.push(`%${q}%`)
    i++
  }
  if (status) {
    conditions.push(`p.verification_status = $${i}`)
    values.push(status)
    i++
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM places p ${where}`,
    values
  )

  const result = await pool.query(
    `SELECT p.*,
       row_to_json(pc.*) AS category,
       row_to_json(cm.*) AS commune
     FROM places p
     LEFT JOIN place_categories pc ON p.category_id = pc.id
     LEFT JOIN communes cm ON p.commune_id = cm.id
     ${where}
     ORDER BY p.updated_at DESC
     LIMIT $${i} OFFSET $${i+1}`,
    [...values, per_page, offset]
  )

  return {
    items: result.rows,
    total: parseInt(countResult.rows[0].count),
    page,
    per_page,
  }
}

export async function getPlaceSources(place_id: string): Promise<PlaceSource[]> {
  const result = await pool.query(
    `SELECT * FROM place_sources WHERE place_id = $1 ORDER BY is_primary DESC, collected_at DESC`,
    [place_id]
  )
  return result.rows
}

export async function getPlacesByCommune(commune_slug: string): Promise<Place[]> {
  const result = await pool.query(
    `SELECT p.*, row_to_json(pc.*) AS category, row_to_json(cm.*) AS commune
     FROM places p
     LEFT JOIN place_categories pc ON p.category_id = pc.id
     LEFT JOIN communes cm ON p.commune_id = cm.id
     WHERE cm.slug = $1 AND p.verification_status = 'published'
     ORDER BY p.confidence_score DESC, p.name ASC`,
    [commune_slug]
  )
  return result.rows
}

export async function getPlacesByCategory(category_slug: string): Promise<Place[]> {
  const result = await pool.query(
    `SELECT p.*, row_to_json(pc.*) AS category, row_to_json(cm.*) AS commune
     FROM places p
     LEFT JOIN place_categories pc ON p.category_id = pc.id
     LEFT JOIN communes cm ON p.commune_id = cm.id
     WHERE pc.slug = $1 AND p.verification_status = 'published'
     ORDER BY p.confidence_score DESC, p.name ASC`,
    [category_slug]
  )
  return result.rows
}

export async function getMapPlaces(): Promise<Pick<Place, 'id' | 'slug' | 'name' | 'lat' | 'lng' | 'dog_policy' | 'category'>[]> {
  const result = await pool.query(
    `SELECT p.id, p.slug, p.name, p.lat, p.lng, p.dog_policy,
       row_to_json(pc.*) AS category
     FROM places p
     LEFT JOIN place_categories pc ON p.category_id = pc.id
     WHERE p.verification_status = 'published' AND p.lat IS NOT NULL AND p.lng IS NOT NULL`
  )
  return result.rows
}

// ─── Communes & Categories ────────────────────────────────────────────────────

export async function getAllCommunes(): Promise<Commune[]> {
  const result = await pool.query('SELECT * FROM communes ORDER BY name ASC')
  return result.rows
}

export async function getCommuneBySlug(slug: string): Promise<Commune | null> {
  const result = await pool.query('SELECT * FROM communes WHERE slug = $1', [slug])
  return result.rows[0] ?? null
}

export async function getAllCategories(): Promise<PlaceCategory[]> {
  const result = await pool.query(
    'SELECT * FROM place_categories WHERE is_active = true ORDER BY sort_order ASC'
  )
  return result.rows
}

export async function getCategoryBySlug(slug: string): Promise<PlaceCategory | null> {
  const result = await pool.query(
    'SELECT * FROM place_categories WHERE slug = $1 AND is_active = true',
    [slug]
  )
  return result.rows[0] ?? null
}

// ─── Submissions ──────────────────────────────────────────────────────────────

export async function createSubmission(data: {
  type: string
  related_place_id?: string
  submitted_name?: string
  submitted_category?: string
  submitted_commune?: string
  submitted_url?: string
  submitted_dog_policy?: string
  submitted_conditions_text?: string
  submitted_message?: string
  submitter_email?: string
}): Promise<Submission> {
  const result = await pool.query(
    `INSERT INTO submissions (
       type, related_place_id, submitted_name, submitted_category, submitted_commune,
       submitted_url, submitted_dog_policy, submitted_conditions_text,
       submitted_message, submitter_email
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [
      data.type, data.related_place_id ?? null, data.submitted_name ?? null,
      data.submitted_category ?? null, data.submitted_commune ?? null,
      data.submitted_url ?? null, data.submitted_dog_policy ?? null,
      data.submitted_conditions_text ?? null, data.submitted_message ?? null,
      data.submitter_email ?? null,
    ]
  )
  return result.rows[0]
}

export async function getSubmissions(params: {
  status?: string
  page?: number
  per_page?: number
}): Promise<PaginatedResult<Submission>> {
  const { status, page = 1, per_page = 30 } = params
  const offset = (page - 1) * per_page
  const conditions: string[] = []
  const values: unknown[] = []
  let i = 1

  if (status) {
    conditions.push(`status = $${i}`)
    values.push(status)
    i++
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const countResult = await pool.query(`SELECT COUNT(*) FROM submissions ${where}`, values)
  const result = await pool.query(
    `SELECT * FROM submissions ${where} ORDER BY created_at DESC LIMIT $${i} OFFSET $${i+1}`,
    [...values, per_page, offset]
  )

  return {
    items: result.rows,
    total: parseInt(countResult.rows[0].count),
    page,
    per_page,
  }
}

// ─── Duplicates ───────────────────────────────────────────────────────────────

export async function getPendingDuplicates(): Promise<DuplicateQueueItem[]> {
  const result = await pool.query(
    `SELECT dq.*,
       row_to_json(pa.*) AS place_a,
       row_to_json(pb.*) AS place_b
     FROM duplicates_queue dq
     JOIN places pa ON dq.place_id_a = pa.id
     JOIN places pb ON dq.place_id_b = pb.id
     WHERE dq.status = 'pending'
     ORDER BY dq.similarity_score DESC`
  )
  return result.rows
}

// ─── Rechecks ─────────────────────────────────────────────────────────────────

export async function getPlacesNeedingRecheck(): Promise<Place[]> {
  const result = await pool.query(
    `SELECT p.*, row_to_json(pc.*) AS category, row_to_json(cm.*) AS commune
     FROM places p
     LEFT JOIN place_categories pc ON p.category_id = pc.id
     LEFT JOIN communes cm ON p.commune_id = cm.id
     WHERE p.verification_status = 'published'
       AND (p.next_review_at <= now() OR p.verification_status = 'needs_recheck')
     ORDER BY p.next_review_at ASC NULLS LAST
     LIMIT 50`
  )
  return result.rows
}

// ─── Stats admin ──────────────────────────────────────────────────────────────

export async function getAdminStats() {
  const result = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE verification_status = 'published') AS published,
      COUNT(*) FILTER (WHERE verification_status = 'draft') AS draft,
      COUNT(*) FILTER (WHERE verification_status = 'pending_review') AS pending_review,
      COUNT(*) FILTER (WHERE verification_status = 'needs_recheck') AS needs_recheck,
      COUNT(*) FILTER (WHERE verification_status = 'conflict') AS conflict
    FROM places
  `)

  const subResult = await pool.query(`
    SELECT COUNT(*) FILTER (WHERE status = 'received') AS pending_submissions
    FROM submissions
  `)

  const dupResult = await pool.query(`
    SELECT COUNT(*) AS pending_duplicates FROM duplicates_queue WHERE status = 'pending'
  `)

  return {
    ...result.rows[0],
    ...subResult.rows[0],
    ...dupResult.rows[0],
  }
}
