import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import pool from '@/lib/db/client'
import { logAudit } from '@/lib/audit'

const VALID_ACTIONS = ['publish', 'unpublish', 'archive', 'needs_recheck'] as const
type BulkAction = typeof VALID_ACTIONS[number]

const ACTION_STATUS: Record<BulkAction, string> = {
  publish:        'published',
  unpublish:      'draft',
  archive:        'archived',
  needs_recheck:  'needs_recheck',
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { ids, action } = body as { ids: unknown; action: unknown }

  if (!Array.isArray(ids) || ids.length === 0 || !VALID_ACTIONS.includes(action as BulkAction)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const safeIds = (ids as unknown[]).filter((id) => typeof id === 'string').slice(0, 200) as string[]
  const newStatus = ACTION_STATUS[action as BulkAction]
  const now = new Date().toISOString()

  const result = await pool.query(
    `UPDATE places
     SET verification_status = $1, updated_at = $2
       ${action === 'publish' ? ', published_at = COALESCE(published_at, $2)' : ''}
     WHERE id = ANY($3::uuid[])
     RETURNING id`,
    [newStatus, now, safeIds]
  )

  try {
    await logAudit({
      user_id: user.id,
      action: `bulk_${action}`,
      entity_type: 'place',
      entity_id: safeIds[0] ?? 'bulk',
      after: { ids: safeIds, count: result.rowCount },
    })
  } catch { /* audit log optionnel */ }

  return NextResponse.json({ updated: result.rowCount })
}
