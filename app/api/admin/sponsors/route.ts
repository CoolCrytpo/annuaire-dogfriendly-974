import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db/client'

export async function GET() {
  try {
    const r = await pool.query('SELECT * FROM sponsors ORDER BY display_order ASC, created_at ASC')
    return NextResponse.json({ sponsors: r.rows })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, logo_url, website_url, tagline, display_order } = await req.json()
    const r = await pool.query(
      `INSERT INTO sponsors (name, logo_url, website_url, tagline, display_order)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, logo_url ?? null, website_url ?? null, tagline ?? null, display_order ?? 0]
    )
    return NextResponse.json(r.rows[0])
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
