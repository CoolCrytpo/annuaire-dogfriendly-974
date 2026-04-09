import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db/client'
import { getSession } from '@/lib/auth/session'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV === 'production') {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const r = await pool.query(
      `UPDATE place_candidates SET review_status = 'rejected', reviewed_at = now()
       WHERE id = $1 RETURNING import_batch_id`,
      [id]
    )
    if (!r.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await pool.query(
      `UPDATE import_batches
       SET rejected_count = rejected_count + 1, pending_count = GREATEST(0, pending_count - 1)
       WHERE id = $1`,
      [r.rows[0].import_batch_id]
    )

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
