import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { deleteSession } from '@/lib/auth/session'

export async function POST() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('admin_session')?.value
  if (sessionId) {
    try {
      await deleteSession(sessionId)
    } catch { /* ignore */ }
    cookieStore.set('admin_session', '', { maxAge: 0, path: '/' })
  }
  return NextResponse.json({ ok: true })
}
