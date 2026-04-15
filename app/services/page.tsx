import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getPublishedServices, getServiceCategories, getAllCommunes } from '@/lib/db/queries'
import { SearchFilters } from '@/components/public/SearchFilters'
import { AnnuaireView } from '@/components/public/AnnuaireView'
import type { PlaceSearchParams } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Services pour chiens — La Réunion',
  description: 'Vétérinaires, toiletteurs, pensions, éducateurs canins et professionnels dog-friendly à La Réunion.',
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

export default async function ServicesPage({ searchParams }: PageProps) {
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

  let result = { items: [] as Awaited<ReturnType<typeof getPublishedServices>>['items'], total: 0, page: 1, per_page: 24 }
  let categories: Awaited<ReturnType<typeof getServiceCategories>> = []
  let communes: Awaited<ReturnType<typeof getAllCommunes>> = []

  try {
    ;[result, categories, communes] = await Promise.all([
      getPublishedServices(params),
      getServiceCategories(),
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
          title="Services pour chiens"
          subtitle="🐕‍🦺 Vétérinaires, toiletteurs, éducateurs et professionnels à La Réunion"
          basePath="/services"
        >
          <SearchFilters categories={categories} communes={communes} basePath="/services" />
        </AnnuaireView>
      </Suspense>
    </div>
  )
}
