import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCategoryBySlug, getPlacesByCategory } from '@/lib/db/queries'
import { PlaceCard } from '@/components/public/PlaceCard'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  try {
    const cat = await getCategoryBySlug(slug)
    if (!cat) return {}
    return {
      title: `${cat.label} dog-friendly à La Réunion`,
      description: `Tous les ${cat.label.toLowerCase()} qui acceptent les chiens à La Réunion.`,
    }
  } catch { return {} }
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params
  let category = null
  let places: Awaited<ReturnType<typeof getPlacesByCategory>> = []

  try {
    category = await getCategoryBySlug(slug)
    if (category) places = await getPlacesByCategory(slug)
  } catch { /* DB non configurée */ }

  if (!category) return notFound()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-1">
        <span className="text-3xl" aria-hidden="true">{category.icon}</span>
        <h1 className="text-2xl font-bold text-gray-900">{category.label} dog-friendly</h1>
      </div>
      <p className="text-gray-500 text-sm mb-8 ml-10">{places.length} lieu{places.length > 1 ? 'x' : ''} · La Réunion</p>

      {places.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-4">🐾</p>
          <p>Aucun lieu répertorié dans cette catégorie pour l&apos;instant.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {places.map((place) => <PlaceCard key={place.id} place={place} />)}
        </div>
      )}
    </div>
  )
}
