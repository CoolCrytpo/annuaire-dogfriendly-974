import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getPublishedPlaces, getAllCategories, getAllCommunes } from '@/lib/db/queries'
import { PlaceCard } from '@/components/public/PlaceCard'
import { SearchFilters } from '@/components/public/SearchFilters'
import type { PlaceSearchParams } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Annuaire dog-friendly — La Réunion',
  description: 'Trouvez tous les lieux qui acceptent les chiens à La Réunion : restaurants, plages, hôtels, commerces et plus.',
}

interface PageProps {
  searchParams: Promise<{ q?: string; dog_policy?: string; category_slug?: string; commune_slug?: string; page?: string }>
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

  let result: Awaited<ReturnType<typeof getPublishedPlaces>> = { items: [], total: 0, page: 1, per_page: 24 }
  let categories: Awaited<ReturnType<typeof getAllCategories>> = []
  let communes: Awaited<ReturnType<typeof getAllCommunes>> = []

  try {
    ;[result, categories, communes] = await Promise.all([
      getPublishedPlaces(params),
      getAllCategories(),
      getAllCommunes(),
    ])
  } catch {
    // DB non configurée
  }

  const totalPages = Math.ceil(result.total / result.per_page)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Annuaire dog-friendly</h1>
        <p className="text-gray-500 text-sm">La Réunion · {result.total} lieu{result.total > 1 ? 'x' : ''} répertorié{result.total > 1 ? 's' : ''}</p>
      </div>

      <Suspense>
        <div className="mb-6">
          <SearchFilters categories={categories} communes={communes} />
        </div>
      </Suspense>

      {result.items.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-4">🐾</p>
          <p className="font-medium">Aucun lieu trouvé</p>
          <p className="text-sm mt-1">Essayez d&apos;ajuster vos filtres ou{' '}
            <a href="/proposer" className="text-green-700 underline">proposez un lieu</a>.
          </p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.items.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                const sp2 = new URLSearchParams()
                if (sp.q) sp2.set('q', sp.q)
                if (sp.dog_policy) sp2.set('dog_policy', sp.dog_policy)
                if (sp.category_slug) sp2.set('category_slug', sp.category_slug)
                if (sp.commune_slug) sp2.set('commune_slug', sp.commune_slug)
                sp2.set('page', String(p))
                return (
                  <a
                    key={p}
                    href={`/annuaire?${sp2.toString()}`}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                      p === page
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {p}
                  </a>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
