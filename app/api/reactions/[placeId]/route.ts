import { NextRequest, NextResponse } from 'next/server'
import { getReactionCounts, addReaction, removeReaction } from '@/lib/db/queries'
import type { ReactionType } from '@/lib/db/queries'

const VALID_TYPES = new Set<ReactionType>(['utile', 'merci', 'jadore', 'oups'])

function isValidReactionType(v: unknown): v is ReactionType {
  return typeof v === 'string' && VALID_TYPES.has(v as ReactionType)
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const { placeId } = await params
  try {
    const counts = await getReactionCounts(placeId)
    return NextResponse.json(counts)
  } catch {
    return NextResponse.json({ utile: 0, merci: 0, jadore: 0, oups: 0 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const { placeId } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !isValidReactionType((body as Record<string, unknown>).type) ||
    typeof (body as Record<string, unknown>).anonHash !== 'string' ||
    ((body as Record<string, unknown>).action !== 'add' && (body as Record<string, unknown>).action !== 'remove')
  ) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { type, anonHash, action } = body as { type: ReactionType; anonHash: string; action: 'add' | 'remove' }

  // Truncate anonHash to prevent abuse
  const safeHash = String(anonHash).slice(0, 64)

  try {
    if (action === 'add') {
      await addReaction(placeId, safeHash, type)
    } else {
      await removeReaction(placeId, safeHash, type)
    }
    const counts = await getReactionCounts(placeId)
    return NextResponse.json(counts)
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
