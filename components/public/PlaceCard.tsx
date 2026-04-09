import Link from 'next/link'
import type { Place } from '@/lib/types'
import { DogPolicyBadge } from '@/components/ui/DogPolicyBadge'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'

interface Props {
  place: Place
}

export function PlaceCard({ place }: Props) {
  const categoryIcon = place.category?.icon ?? '📌'
  const communeName = place.commune?.name ?? ''

  return (
    <Link
      href={`/lieux/${place.slug}`}
      className="group block bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-150 overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg" aria-hidden="true">{categoryIcon}</span>
              <span className="text-xs text-gray-500 truncate">{place.category?.label}</span>
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors truncate">
              {place.name}
            </h3>
            {communeName && (
              <p className="text-sm text-gray-500 mt-0.5">{communeName}</p>
            )}
          </div>
          <DogPolicyBadge policy={place.dog_policy} size="sm" />
        </div>

        {place.short_description && (
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{place.short_description}</p>
        )}

        {place.dog_conditions_text && place.dog_policy === 'conditional' && (
          <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mt-2">
            {place.dog_conditions_text}
          </p>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <ConfidenceBadge level={place.confidence_level} date={place.last_verified_at} />
          <span className="text-xs text-gray-400 group-hover:text-green-600 transition-colors">
            Voir la fiche →
          </span>
        </div>
      </div>
    </Link>
  )
}
