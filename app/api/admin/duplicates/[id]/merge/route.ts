import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db/client'
import { getSession } from '@/lib/auth/session'
import { logAudit } from '@/lib/audit'

interface Params { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const body = await request.formData()
  const keepId = body.get('keep') as string

  if (!keepId) {
    return NextResponse.json({ error: 'Paramètre keep requis' }, { status: 400 })
  }

  // Récupérer la paire
  const dupResult = await pool.query(
    'SELECT * FROM duplicates_queue WHERE id = $1', [id]
  )
  const dup = dupResult.rows[0]
  if (!dup) return NextResponse.json({ error: 'Paire non trouvée' }, { status: 404 })

  const archiveId = keepId === dup.place_id_a ? dup.place_id_b : dup.place_id_a

  // Transférer les sources et soumissions vers le lieu canonique
  await pool.query('UPDATE place_sources SET place_id = $1 WHERE place_id = $2', [keepId, archiveId])
  await pool.query('UPDATE submissions SET related_place_id = $1 WHERE related_place_id = $2', [keepId, archiveId])

  // Archiver le doublon
  await pool.query(
    `UPDATE places SET verification_status = 'archived' WHERE id = $1`,
    [archiveId]
  )

  // Résoudre la paire
  await pool.query(
    `UPDATE duplicates_queue SET status = 'merged', resolved_by = $1, resolved_at = now() WHERE id = $2`,
    [user.id, id]
  )

  await logAudit({
    user_id: user.id,
    entity_type: 'duplicate',
    entity_id: id,
    action: 'merge',
    after: { kept: keepId, archived: archiveId },
  })

  return NextResponse.redirect(new URL('/admin/duplicates', request.url))
}
