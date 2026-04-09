import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db/client'
import { getSession } from '@/lib/auth/session'
import { logAudit } from '@/lib/audit'

interface Params { params: Promise<{ id: string }> }

export async function POST(_request: NextRequest, { params }: Params) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  await pool.query(
    `UPDATE submissions SET status = 'accepted', handled_at = now(), handled_by = $1 WHERE id = $2`,
    [user.id, id]
  )
  await logAudit({ user_id: user.id, entity_type: 'submission', entity_id: id, action: 'accept' })
  return NextResponse.redirect(new URL('/admin/submissions', _request.url))
}
