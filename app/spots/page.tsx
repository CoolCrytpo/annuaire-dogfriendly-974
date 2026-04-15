import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getPublishedSpots, getSpotCategories, getAllCommunes } from '@/lib/db/queries'
import { SearchFilters } from '@/components/public/SearchFilters'
import { AnnuaireView } from '@/components/public/AnnuaireView'
import type { PlaceSearchParams } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Spots dog-friendly — La Réunion',
  description: 'Plages, parcs et espaces publics dog-friendly à La Réunion. Données vérifiées et géolocalisées.',
}

interface PageProps {
  searchParams: Promise<{
    q?: string
    dog_policy?: string
    category_slug?: string
    commune_slug?: string
    page?: string
  }>
}

export default async function SpotsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page ?? '1'))
  const params: PlaceSearchParams = {
    q: sp.q,
    dog_policy: sp.dog_policy as PlaceSearchParams['dog_policy'],
    category_slug: sp.category_slug,
    commune_slug: sp.commune_slug,
    page,
    per_page: 24,
  }

  let result = { items: [] as Awaited<ReturnType<typeof getPublishedSpots>>['items'], total: 0, page: 1, per_page: 24 }
  let categories: Awaited<ReturnType<typeof getSpotCategories>> = []
  let communes: Awaited<ReturnType<typeof getAllCommunes>> = []

  try {
    ;[result, categories, communes] = await Promise.all([
      getPublishedSpots(params),
      getSpotCategories(),
      getAllCommunes(),
    ])
  } catch { /* DB non configurée */ }

  const totalPages = Math.ceil(result.total / result.per_page)

  const spStr = new URLSearchParams()
  if (sp.q) spStr.set('q', sp.q)
  if (sp.dog_policy) spStr.set('dog_policy', sp.dog_policy)
  if (sp.category_slug) spStr.set('category_slug', sp.category_slug)
  if (sp.commune_slug) spStr.set('commune_slug', sp.commune_slug)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Suspense>
        <AnnuaireView
          places={result.items}
          total={result.total}
          totalPages={totalPages}
          currentPage={page}
          searchParamsStr={spStr.toString()}
          categories={categories}
          communes={communes}
          title="Spots dog-friendly"
          subtitle="🏖️ Plages, parcs et espaces publics à La Réunion"
          basePath="/spots"
        >
          <SearchFilters categories={categories} communes={communes} basePath="/spots" />
        </AnnuaireView>
      </Suspense>
    </div>
  )
}
