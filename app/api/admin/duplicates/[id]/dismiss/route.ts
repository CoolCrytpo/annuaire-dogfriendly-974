import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db/client'
import { getSession } from '@/lib/auth/session'
import { logAudit } from '@/lib/audit'

interface Params { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  await pool.query(
    `UPDATE duplicates_queue SET status = 'not_duplicate', resolved_by = $1, resolved_at = now() WHERE id = $2`,
    [user.id, id]
  )
  await logAudit({ user_id: user.id, entity_type: 'duplicate', entity_id: id, action: 'dismiss' })
  return NextResponse.redirect(new URL('/admin/duplicates', request.url))
}
