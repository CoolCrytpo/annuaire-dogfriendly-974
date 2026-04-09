import { NextResponse } from 'next/server'
import pool from '@/lib/db/client'

export async function GET() {
  try {
    const r = await pool.query('SELECT * FROM ad_slots ORDER BY position ASC, created_at ASC')
    return NextResponse.json({ slots: r.rows })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
