import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db/client'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await req.json() as Record<string, unknown>
    const fields: string[] = []
    const values: unknown[] = []
    let i = 1

    for (const key of ['label', 'icon', 'sort_order', 'is_active']) {
      if (key in body) {
        fields.push(`${key} = $${i}`)
        values.push(body[key])
        i++
      }
    }
    if (fields.length === 0) return NextResponse.json({ error: 'No fields' }, { status: 400 })
    values.push(id)
    await pool.query(`UPDATE place_categories SET ${fields.join(', ')} WHERE id = $${i}`, values)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
