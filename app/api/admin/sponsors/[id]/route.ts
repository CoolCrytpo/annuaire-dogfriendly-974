import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db/client'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await req.json() as Record<string, unknown>
    const fields: string[] = []
    const values: unknown[] = []
    let i = 1

    const allowed = ['name', 'logo_url', 'website_url', 'tagline', 'is_active', 'display_order', 'starts_at', 'ends_at']
    for (const key of allowed) {
      if (key in body) {
        fields.push(`${key} = $${i}`)
        values.push(body[key])
        i++
      }
    }
    if (fields.length === 0) return NextResponse.json({ error: 'No fields' }, { status: 400 })

    fields.push(`updated_at = now()`)
    values.push(id)

    await pool.query(
      `UPDATE sponsors SET ${fields.join(', ')} WHERE id = $${i}`,
      values
    )
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    await pool.query('DELETE FROM sponsors WHERE id = $1', [id])
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
