'use client'

import { useEffect, useRef } from 'react'
import type { Place } from '@/lib/types'

interface MapPlace {
  id: string
  slug: string
  name: string
  lat: number | null
  lng: number | null
  dog_policy: string
  category?: { icon?: string | null; label?: string | null } | null
}

interface Props {
  places: MapPlace[]
  center?: [number, number]
  zoom?: number
  selectedSlug?: string
}

const POLICY_COLORS: Record<string, string> = {
  allowed: '#16a34a',
  conditional: '#d97706',
  disallowed: '#dc2626',
  unknown: '#6b7280',
}

export function MapView({ places, center = [55.45, -21.1], zoom = 10, selectedSlug }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let map: any = null

    async function initMap() {
      if (!mapRef.current) return
      const maplibregl = (await import('maplibre-gl')).default
      await import('maplibre-gl/dist/maplibre-gl.css')

      map = new maplibregl.Map({
        container: mapRef.current,
        style: 'https://demotiles.maplibre.org/style.json',
        center: center,
        zoom: zoom,
      })

      map.addControl(new maplibregl.NavigationControl())

      map.on('load', () => {
        places.forEach((place) => {
          if (!place.lat || !place.lng) return

          const el = document.createElement('div')
          const color = POLICY_COLORS[place.dog_policy] ?? '#6b7280'
          el.innerHTML = `
            <div style="
              width:32px;height:32px;border-radius:50%;background:${color};
              border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);
              display:flex;align-items:center;justify-content:center;
              font-size:14px;cursor:pointer;
              ${selectedSlug === place.slug ? 'ring:3px solid #1d4ed8;transform:scale(1.2);' : ''}
            ">
              ${place.category?.icon ?? '📌'}
            </div>
          `
          el.style.width = '32px'
          el.style.height = '32px'

          const popup = new maplibregl.Popup({ offset: 20, closeButton: false }).setHTML(`
            <div style="font-family:sans-serif;max-width:180px;">
              <strong style="display:block;margin-bottom:4px;">${place.name}</strong>
              <a href="/lieux/${place.slug}" style="color:#16a34a;font-size:12px;">Voir la fiche →</a>
            </div>
          `)

          new maplibregl.Marker({ element: el })
            .setLngLat([place.lng, place.lat])
            .setPopup(popup)
            .addTo(map!)
        })
      })

      mapInstanceRef.current = map
    }

    void initMap()

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      map?.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={mapRef}
      className="w-full h-full rounded-xl overflow-hidden"
      aria-label="Carte des lieux dog-friendly à La Réunion"
    />
  )
}
