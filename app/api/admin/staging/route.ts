import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db/client'
import { getSession } from '@/lib/auth/session'

export const maxDuration = 30

async function checkAuth() {
  if (process.env.NODE_ENV !== 'production') return true
  const user = await getSession()
  return !!user
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const q = sp.get('q') ?? ''
  const status = sp.get('status') ?? ''
  const category = sp.get('category') ?? ''
  const page = Math.max(1, parseInt(sp.get('page') ?? '1'))
  const per_page = 50

  const conditions: string[] = []
  const params: unknown[] = []

  if (q) {
    params.push(`%${q}%`)
    conditions.push(`(name ILIKE $${params.length} OR commune ILIKE $${params.length})`)
  }
  if (status) {
    params.push(status)
    conditions.push(`status = $${params.length}`)
  }
  if (category) {
    params.push(category)
    conditions.push(`category = $${params.length}`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  try {
    const countRes = await pool.query(`SELECT COUNT(*) FROM import_sources ${where}`, params)
    const total = parseInt(countRes.rows[0].count)

    params.push(per_page, (page - 1) * per_page)
    const dataRes = await pool.query(
      `SELECT id, name, category, commune, dog_policy, confidence_score, status, source_domain, source_url, admin_notes, dedupe_key, created_at
       FROM import_sources ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    )

    return NextResponse.json({ items: dataRes.rows, total, page, per_page })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { ids } = await req.json() as { ids: string[] }
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No ids' }, { status: 400 })
    }
    const res = await pool.query(`DELETE FROM import_sources WHERE id = ANY($1)`, [ids])
    return NextResponse.json({ deleted: res.rowCount })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
