export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // accents
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
}

export function toNormalizedName(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function formatDate(date: string | null): string {
  if (!date) return 'Date inconnue'
  return new Intl.DateTimeFormat('fr-RE', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date))
}

export function formatDateShort(date: string | null): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('fr-RE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date))
}
