import type { ConfidenceLevel } from '@/lib/types'
import { CONFIDENCE_LEVEL_LABELS } from '@/lib/types'

const STYLES: Record<ConfidenceLevel, string> = {
  high:   'bg-blue-100 text-blue-800',
  medium: 'bg-slate-100 text-slate-700',
  low:    'bg-orange-50 text-orange-700',
}

interface Props {
  level: ConfidenceLevel
  date?: string | null
  showDate?: boolean
}

export function ConfidenceBadge({ level, date, showDate = true }: Props) {
  const label = CONFIDENCE_LEVEL_LABELS[level]
  const formatted = date
    ? new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric' }).format(new Date(date))
    : null

  return (
    <span className={`inline-flex items-center gap-1.5 rounded text-xs font-medium px-2 py-0.5 ${STYLES[level]}`}>
      <span>{label}</span>
      {showDate && formatted && (
        <span className="opacity-70">· {formatted}</span>
      )}
    </span>
  )
}
