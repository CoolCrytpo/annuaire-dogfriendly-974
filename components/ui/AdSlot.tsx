import { getActiveAdSlot } from '@/lib/db/queries'

interface Props {
  slotKey: string
  className?: string
}

export async function AdSlot({ slotKey, className }: Props) {
  const slot = await getActiveAdSlot(slotKey)
  if (!slot) return null

  return (
    <div
      className={className}
      style={{
        borderRadius: '1rem',
        overflow: 'hidden',
        border: '1.5px solid rgba(249,115,22,0.1)',
        boxShadow: '0 2px 8px rgba(249,115,22,0.06)',
      }}
    >
      {slot.link_url ? (
        <a
          href={slot.link_url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          aria-label={slot.label ?? 'Publicité partenaire'}
        >
          {slot.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={slot.image_url}
              alt={slot.label ?? ''}
              style={{ width: '100%', display: 'block' }}
            />
          ) : (
            <div
              className="px-4 py-3 text-sm font-bold text-center"
              style={{ background: '#fff7ed', color: '#f97316', fontFamily: 'Nunito, sans-serif' }}
            >
              {slot.label ?? 'Partenaire'}
            </div>
          )}
        </a>
      ) : slot.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={slot.image_url}
          alt={slot.label ?? ''}
          style={{ width: '100%', display: 'block' }}
        />
      ) : null}

      <p
        className="text-center py-0.5 text-xs"
        style={{ background: '#f8fafc', color: '#d6d3d1', fontFamily: 'Nunito, sans-serif' }}
        aria-hidden
      >
        Annonce
      </p>
    </div>
  )
}
