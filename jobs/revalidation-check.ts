/**
 * Job : Revalidation périodique des fiches publiées
 * Marque les fiches dont next_review_at est dépassé comme needs_recheck
 * et recalcule le scoring de confiance (fraîcheur)
 *
 * Usage : npx tsx jobs/revalidation-check.ts
 * Recommandé : cron quotidien
 */

import pool from '../lib/db/client'
import { getPlaceSources } from '../lib/db/queries'
import { computeConfidence, computeFinalScore, scoreToLevel } from '../lib/scoring/confidence'

async function revalidationCheck() {
  console.log('[revalidation-check] Démarrage…')

  // 1. Marquer les fiches en retard
  const overdue = await pool.query(`
    UPDATE places
    SET verification_status = 'needs_recheck'
    WHERE verification_status = 'published'
      AND next_review_at IS NOT NULL
      AND next_review_at < now()
    RETURNING id, name
  `)
  console.log(`[revalidation-check] ${overdue.rowCount} fiche(s) marquée(s) needs_recheck`)

  // 2. Recalculer le scoring de toutes les fiches publiées (impact fraîcheur)
  const published = await pool.query(
    `SELECT id, last_verified_at FROM places WHERE verification_status = 'published'`
  )

  let updated = 0
  for (const row of published.rows as Array<{ id: string; last_verified_at: string | null }>) {
    try {
      const sources = await getPlaceSources(row.id)
      const lastVerified = row.last_verified_at ? new Date(row.last_verified_at) : null
      const detail = computeConfidence(sources, lastVerified)
      const score = computeFinalScore(detail)
      const level = scoreToLevel(score)

      await pool.query(
        `UPDATE places SET confidence_score = $1, confidence_level = $2, confidence_detail = $3 WHERE id = $4`,
        [score, level, JSON.stringify(detail), row.id]
      )
      updated++
    } catch (err) {
      console.error(`[revalidation-check] Erreur pour place ${row.id}:`, err)
    }
  }

  console.log(`[revalidation-check] ${updated} score(s) recalculé(s)`)
  await pool.end()
}

revalidationCheck().catch((err) => {
  console.error('[revalidation-check] Erreur :', err)
  process.exit(1)
})
