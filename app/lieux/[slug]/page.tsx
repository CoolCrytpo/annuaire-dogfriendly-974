import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPlaceBySlug, getPlaceSources } from '@/lib/db/queries'
import { DogPolicyBadge } from '@/components/ui/DogPolicyBadge'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import { SubmissionForm } from '@/components/public/SubmissionForm'
import { formatDate } from '@/lib/utils/slug'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  try {
    const place = await getPlaceBySlug(slug)
    if (!place) return {}
    return {
      title: `${place.name} — ${place.commune?.name ?? 'La Réunion'}`,
      description: place.short_description ?? `Politique chien et informations pour ${place.name} à La Réunion.`,
    }
  } catch {
    return {}
  }
}

export default async function PlacePage({ params }: PageProps) {
  const { slug } = await params

  let place = null
  let sources: Awaited<ReturnType<typeof getPlaceSources>> = []
  try {
    place = await getPlaceBySlug(slug)
    if (place) {
      sources = await getPlaceSources(place.id)
    }
  } catch {
    // DB non configurée
  }

  if (!place) return notFound()

  const primarySource = sources.find((s) => s.is_primary)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/annuaire" className="hover:text-green-700">Annuaire</Link>
        <span>/</span>
        {place.commune && (
          <>
            <Link href={`/communes/${place.commune.slug}`} className="hover:text-green-700">
              {place.commune.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-900 font-medium truncate">{place.name}</span>
      </nav>

      {/* Header fiche */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl" aria-hidden="true">{place.category?.icon}</span>
              <span className="text-sm text-gray-500">{place.category?.label}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{place.name}</h1>
            {place.commune && (
              <p className="text-gray-500 mt-1">{place.address_text ?? place.commune.name}</p>
            )}
          </div>
          <DogPolicyBadge policy={place.dog_policy} size="lg" />
        </div>
      </div>

      {/* Politique chien */}
      <div className={`rounded-xl p-5 mb-6 border ${
        place.dog_policy === 'allowed' ? 'bg-green-50 border-green-200' :
        place.dog_policy === 'conditional' ? 'bg-amber-50 border-amber-200' :
        place.dog_policy === 'disallowed' ? 'bg-red-50 border-red-200' :
        'bg-gray-50 border-gray-200'
      }`}>
        {place.dog_policy === 'unknown' ? (
          <p className="text-gray-600 text-sm">
            La politique d&apos;accueil des chiens n&apos;est pas encore confirmée pour ce lieu.
            <Link href="#corriger" className="ml-1 underline text-gray-700">Vous la connaissez ?</Link>
          </p>
        ) : (
          <>
            <p className="font-semibold text-gray-900 mb-1">
              {place.dog_policy === 'allowed' && 'Les chiens sont acceptés'}
              {place.dog_policy === 'conditional' && 'Les chiens sont acceptés sous conditions'}
              {place.dog_policy === 'disallowed' && 'Les chiens ne sont pas acceptés'}
            </p>
            {place.dog_conditions_text && (
              <p className="text-sm text-gray-700">{place.dog_conditions_text}</p>
            )}
          </>
        )}
      </div>

      {/* Description */}
      {(place.short_description || place.editorial_summary) && (
        <div className="mb-6 prose prose-sm prose-gray max-w-none">
          {place.editorial_summary
            ? <p className="text-gray-700 leading-relaxed">{place.editorial_summary}</p>
            : <p className="text-gray-600">{place.short_description}</p>
          }
        </div>
      )}

      {/* Infos pratiques */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 mb-6 space-y-3">
        <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Informations pratiques</h2>
        {place.address_text && (
          <div className="flex gap-2 text-sm">
            <span className="text-gray-400 w-5 flex-shrink-0">📍</span>
            <span className="text-gray-700">{place.address_text}</span>
          </div>
        )}
        {place.phone && (
          <div className="flex gap-2 text-sm">
            <span className="text-gray-400 w-5 flex-shrink-0">📞</span>
            <a href={`tel:${place.phone}`} className="text-green-700 hover:underline">{place.phone}</a>
          </div>
        )}
        {place.website_url && (
          <div className="flex gap-2 text-sm">
            <span className="text-gray-400 w-5 flex-shrink-0">🌐</span>
            <a href={place.website_url} target="_blank" rel="noopener noreferrer" className="text-green-700 hover:underline truncate">
              {new URL(place.website_url).hostname}
            </a>
          </div>
        )}
        {place.opening_hours_text && (
          <div className="flex gap-2 text-sm">
            <span className="text-gray-400 w-5 flex-shrink-0">🕐</span>
            <span className="text-gray-700">{place.opening_hours_text}</span>
          </div>
        )}
      </div>

      {/* Niveau de confiance et source */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide mb-3">Fiabilité de l&apos;information</h2>
        <div className="flex items-center gap-3 mb-2">
          <ConfidenceBadge level={place.confidence_level} date={place.last_verified_at} showDate />
        </div>
        {place.last_verified_at && (
          <p className="text-xs text-gray-500 mb-2">
            Vérifié le {formatDate(place.last_verified_at)}
          </p>
        )}
        {primarySource && (
          <div className="text-xs text-gray-500 border-t border-gray-100 pt-2 mt-2">
            <span className="font-medium">Source :</span>{' '}
            {primarySource.source_url ? (
              <a
                href={primarySource.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-700 hover:underline"
              >
                {primarySource.source_label ?? primarySource.source_url}
              </a>
            ) : (
              primarySource.source_label ?? primarySource.source_type
            )}
            {primarySource.published_or_seen_at && (
              <span className="ml-1 text-gray-400">({formatDate(primarySource.published_or_seen_at)})</span>
            )}
          </div>
        )}
        <Link href="/methodologie" className="text-xs text-gray-400 hover:text-gray-600 mt-2 inline-block underline">
          Comment nous évaluons la fiabilité →
        </Link>
      </div>

      {/* Formulaire de correction */}
      <div id="corriger" className="border-t border-gray-200 pt-8 mt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Une information inexacte ?</h2>
        <p className="text-sm text-gray-600 mb-5">
          Signalez-le, notre équipe mettra à jour la fiche après vérification.
        </p>
        <SubmissionForm type="correction" relatedPlaceId={place.id} relatedPlaceName={place.name} />
      </div>
    </div>
  )
}
