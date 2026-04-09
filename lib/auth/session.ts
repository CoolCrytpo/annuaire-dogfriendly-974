import { cookies } from 'next/headers'
import pool from '@/lib/db/client'
import type { AdminUser } from '@/lib/types'

const SESSION_COOKIE = 'admin_session'
const SESSION_DURATION_HOURS = 24

export async function getSession(): Promise<AdminUser | null> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value
  if (!sessionId) return null

  const result = await pool.query(
    `SELECT u.id, u.email, u.name, u.role, u.created_at
     FROM admin_sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.id = $1 AND s.expires_at > now()`,
    [sessionId]
  )
  return result.rows[0] ?? null
}

export async function createSession(userId: string): Promise<string> {
  const sessionId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 3600 * 1000)
  await pool.query(
    'INSERT INTO admin_sessions (id, user_id, expires_at) VALUES ($1, $2, $3)',
    [sessionId, userId, expiresAt]
  )
  return sessionId
}

export async function deleteSession(sessionId: string): Promise<void> {
  await pool.query('DELETE FROM admin_sessions WHERE id = $1', [sessionId])
}

export function setSessionCookie(sessionId: string): void {
  // Appelé depuis une Server Action ou route handler
  void cookies().then((c) =>
    c.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_HOURS * 3600,
      path: '/',
    })
  )
}

export function clearSessionCookie(): void {
  void cookies().then((c) =>
    c.set(SESSION_COOKIE, '', { maxAge: 0, path: '/' })
  )
}
