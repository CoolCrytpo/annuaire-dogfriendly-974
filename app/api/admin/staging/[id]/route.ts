import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db/client'
import { getSession } from '@/lib/auth/session'

async function checkAuth() {
  if (process.env.NODE_ENV !== 'production') return true
  const user = await getSession()
  return !!user
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const body = await req.json() as Record<string, unknown>
    const allowed = ['status', 'admin_notes', 'dog_policy', 'category', 'commune']
    const sets: string[] = []
    const values: unknown[] = []

    for (const key of allowed) {
      if (key in body) {
        values.push(body[key])
        sets.push(`${key} = $${values.length}`)
      }
    }
    if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

    values.push(id)
    await pool.query(
      `UPDATE import_sources SET ${sets.join(', ')}, updated_at = now() WHERE id = $${values.length}`,
      values
    )
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    await pool.query(`DELETE FROM import_sources WHERE id = $1`, [id])
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
