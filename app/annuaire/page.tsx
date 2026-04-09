import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getPublishedPlaces, getAllCategories, getAllCommunes } from '@/lib/db/queries'
import { SearchFilters } from '@/components/public/SearchFilters'
import { AnnuaireView } from '@/components/public/AnnuaireView'
import type { PlaceSearchParams } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Annuaire dog-friendly — La Réunion',
  description: 'Tous les lieux qui acceptent les chiens à La Réunion : restaurants, plages, hôtels, commerces. Données vérifiées.',
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

export default async function AnnuairePage({ searchParams }: PageProps) {
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

  let result = { items: [] as Awaited<ReturnType<typeof getPublishedPlaces>>['items'], total: 0, page: 1, per_page: 24 }
  let categories: Awaited<ReturnType<typeof getAllCategories>> = []
  let communes: Awaited<ReturnType<typeof getAllCommunes>> = []

  try {
    ;[result, categories, communes] = await Promise.all([
      getPublishedPlaces(params),
      getAllCategories(),
      getAllCommunes(),
    ])
  } catch { /* DB non configurée */ }

  const totalPages = Math.ceil(result.total / result.per_page)

  // Reconstruct search params string for pagination links
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
        >
          <SearchFilters categories={categories} communes={communes} />
        </AnnuaireView>
      </Suspense>
    </div>
  )
}
