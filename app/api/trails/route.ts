import { NextRequest, NextResponse } from 'next/server'
import { getPublishedTrails, getAllCommunes } from '@/lib/db/queries'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const page = Math.max(1, parseInt(sp.get('page') ?? '1'))

  try {
    const trailParams = {
      q: sp.get('q') ?? undefined,
      dog_policy: (sp.get('dog_policy') || undefined) as import('@/lib/types').DogPolicy | undefined,
      commune_slug: sp.get('commune_slug') ?? undefined,
      difficulty: sp.get('difficulty') ?? undefined,
      page,
      per_page: 24,
    }
    const [result, communes] = await Promise.all([
      getPublishedTrails(trailParams),
      getAllCommunes(),
    ])
    return NextResponse.json({ ...result, communes })
  } catch {
    return NextResponse.json({ items: [], total: 0, page: 1, per_page: 24, communes: [] })
  }
}
