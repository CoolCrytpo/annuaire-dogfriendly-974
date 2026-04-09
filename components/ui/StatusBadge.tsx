import type { VerificationStatus } from '@/lib/types'

const LABELS: Record<VerificationStatus, string> = {
  draft:          'Brouillon',
  pending_review: 'En attente',
  published:      'Publié',
  needs_recheck:  'À revérifier',
  conflict:       'Conflit',
  archived:       'Archivé',
}

const STYLES: Record<VerificationStatus, string> = {
  draft:          'bg-gray-100 text-gray-600',
  pending_review: 'bg-yellow-100 text-yellow-800',
  published:      'bg-green-100 text-green-800',
  needs_recheck:  'bg-orange-100 text-orange-800',
  conflict:       'bg-red-100 text-red-800',
  archived:       'bg-slate-100 text-slate-500',
}

export function StatusBadge({ status }: { status: VerificationStatus }) {
  return (
    <span className={`inline-block rounded text-xs font-medium px-2 py-0.5 ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  )
}
