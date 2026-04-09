/**
 * Job : Détection de doublons potentiels
 * Stratégie : similarité trigram (pg_trgm) sur le nom normalisé + proximité géographique
 *
 * Usage : npx tsx jobs/detect-duplicates.ts
 */

import pool from '../lib/db/client'

const SIMILARITY_THRESHOLD = 0.6
const DISTANCE_KM = 0.5

async function detectDuplicates() {
  console.log('[detect-duplicates] Démarrage…')

  // Paires candidates par nom similaire + même commune
  const nameResult = await pool.query(`
    SELECT a.id AS id_a, b.id AS id_b,
           similarity(a.normalized_name, b.normalized_name) AS sim
    FROM places a
    JOIN places b ON a.id < b.id
    WHERE a.verification_status NOT IN ('archived')
      AND b.verification_status NOT IN ('archived')
      AND similarity(a.normalized_name, b.normalized_name) >= $1
      AND (
        a.commune_id = b.commune_id
        OR a.commune_id IS NULL
        OR b.commune_id IS NULL
      )
  `, [SIMILARITY_THRESHOLD])

  // Paires candidates par proximité géographique (< 500m)
  const geoResult = await pool.query(`
    SELECT a.id AS id_a, b.id AS id_b,
           similarity(a.normalized_name, b.normalized_name) AS sim
    FROM places a
    JOIN places b ON a.id < b.id
    WHERE a.verification_status NOT IN ('archived')
      AND b.verification_status NOT IN ('archived')
      AND a.geom IS NOT NULL AND b.geom IS NOT NULL
      AND ST_DWithin(a.geom::geography, b.geom::geography, $1 * 1000)
      AND similarity(a.normalized_name, b.normalized_name) >= 0.4
  `, [DISTANCE_KM])

  const all = [...nameResult.rows, ...geoResult.rows] as Array<{ id_a: string; id_b: string; sim: number }>

  // Déduplication des paires
  const seen = new Set<string>()
  const unique = all.filter((r) => {
    const key = `${r.id_a}-${r.id_b}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  let inserted = 0
  for (const pair of unique) {
    try {
      await pool.query(
        `INSERT INTO duplicates_queue (place_id_a, place_id_b, similarity_score)
         VALUES ($1, $2, $3)
         ON CONFLICT (place_id_a, place_id_b) DO NOTHING`,
        [pair.id_a, pair.id_b, pair.sim]
      )
      inserted++
    } catch { /* doublon déjà enregistré */ }
  }

  console.log(`[detect-duplicates] ${inserted} paire(s) insérée(s) dans duplicates_queue`)
  await pool.end()
}

detectDuplicates().catch((err) => {
  console.error('[detect-duplicates] Erreur :', err)
  process.exit(1)
})
