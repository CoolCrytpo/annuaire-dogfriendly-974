import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db/client'

export async function GET() {
  try {
    const r = await pool.query('SELECT * FROM place_categories ORDER BY sort_order ASC, id ASC')
    return NextResponse.json({ categories: r.rows })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { slug, label, icon, sort_order } = await req.json()
    if (!slug || !label) return NextResponse.json({ error: 'slug and label required' }, { status: 400 })
    const r = await pool.query(
      `INSERT INTO place_categories (slug, label, icon, sort_order) VALUES ($1,$2,$3,$4) RETURNING *`,
      [slug, label, icon ?? null, sort_order ?? 0]
    )
    return NextResponse.json(r.rows[0])
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
