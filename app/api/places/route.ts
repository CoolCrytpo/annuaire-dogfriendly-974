import { NextRequest, NextResponse } from 'next/server'
import { getPublishedPlaces, getMapPlaces } from '@/lib/db/queries'
import type { PlaceSearchParams } from '@/lib/types'

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const format = sp.get('format')

  if (format === 'map') {
    const places = await getMapPlaces()
    return NextResponse.json(places)
  }

  const params: PlaceSearchParams = {
    q: sp.get('q') ?? undefined,
    dog_policy: (sp.get('dog_policy') as PlaceSearchParams['dog_policy']) ?? undefined,
    category_slug: sp.get('category_slug') ?? undefined,
    commune_slug: sp.get('commune_slug') ?? undefined,
    page: sp.get('page') ? parseInt(sp.get('page')!) : 1,
    per_page: sp.get('per_page') ? Math.min(50, parseInt(sp.get('per_page')!)) : 20,
  }

  try {
    const result = await getPublishedPlaces(params)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[GET /api/places]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
