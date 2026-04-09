import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCommuneBySlug, getPlacesByCommune } from '@/lib/db/queries'
import { PlaceCard } from '@/components/public/PlaceCard'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  try {
    const commune = await getCommuneBySlug(slug)
    if (!commune) return {}
    return {
      title: `Lieux dog-friendly à ${commune.name}`,
      description: `Tous les restaurants, plages et commerces dog-friendly à ${commune.name}, La Réunion.`,
    }
  } catch { return {} }
}

export default async function CommunePage({ params }: PageProps) {
  const { slug } = await params
  let commune = null
  let places: Awaited<ReturnType<typeof getPlacesByCommune>> = []

  try {
    commune = await getCommuneBySlug(slug)
    if (commune) places = await getPlacesByCommune(slug)
  } catch { /* DB non configurée */ }

  if (!commune) return notFound()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Lieux dog-friendly à {commune.name}
      </h1>
      <p className="text-gray-500 text-sm mb-8">{places.length} lieu{places.length > 1 ? 'x' : ''} répertorié{places.length > 1 ? 's' : ''}</p>

      {places.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-4">🐾</p>
          <p>Aucun lieu répertorié pour cette commune pour l&apos;instant.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {places.map((place) => <PlaceCard key={place.id} place={place} />)}
        </div>
      )}
    </div>
  )
}
