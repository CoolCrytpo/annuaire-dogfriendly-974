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
    `UPDATE places SET verification_status = 'draft' WHERE id = $1`,
    [id]
  )
  await logAudit({ user_id: user.id, entity_type: 'place', entity_id: id, action: 'unpublish' })
  return NextResponse.json({ ok: true })
}
