import type { DogPolicy } from '@/lib/types'
import { DOG_POLICY_LABELS } from '@/lib/types'

const STYLES: Record<DogPolicy, string> = {
  allowed:     'bg-green-100 text-green-800 border-green-200',
  conditional: 'bg-amber-100 text-amber-800 border-amber-200',
  disallowed:  'bg-red-100 text-red-800 border-red-200',
  unknown:     'bg-gray-100 text-gray-600 border-gray-200',
}

const ICONS: Record<DogPolicy, string> = {
  allowed:     '✅',
  conditional: '⚠️',
  disallowed:  '🚫',
  unknown:     '❓',
}

interface Props {
  policy: DogPolicy
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

export function DogPolicyBadge({ policy, size = 'md', showIcon = true }: Props) {
  const sizes = { sm: 'text-xs px-2 py-0.5', md: 'text-sm px-3 py-1', lg: 'text-base px-4 py-1.5' }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${STYLES[policy]} ${sizes[size]}`}>
      {showIcon && <span aria-hidden="true">{ICONS[policy]}</span>}
      {DOG_POLICY_LABELS[policy]}
    </span>
  )
}
