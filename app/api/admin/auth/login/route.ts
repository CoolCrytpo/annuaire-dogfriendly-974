import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import pool from '@/lib/db/client'
import { createSession } from '@/lib/auth/session'
import { adminLoginSchema } from '@/lib/validation/schemas'
import { createHash } from 'crypto'

function hashPassword(password: string): string {
  // SHA-256 simple pour MVP — remplacer par bcrypt en production
  return createHash('sha256').update(password).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as unknown
    const parsed = adminLoginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    const { email, password } = parsed.data
    const result = await pool.query(
      'SELECT id, password_hash FROM users WHERE email = $1',
      [email]
    )

    const user = result.rows[0]
    if (!user || user.password_hash !== hashPassword(password)) {
      return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 })
    }

    const sessionId = await createSession(user.id as string)
    const cookieStore = await cookies()
    cookieStore.set('admin_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 3600,
      path: '/',
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/admin/auth/login]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
