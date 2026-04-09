import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db/client'
import { getSession } from '@/lib/auth/session'

export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM site_settings ORDER BY key ASC')
    return NextResponse.json(result.rows)
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { key, value } = await req.json() as { key: string; value: string }
    if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })

    await pool.query(
      `UPDATE site_settings SET value = $1, updated_at = now() WHERE key = $2`,
      [value, key]
    )
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
