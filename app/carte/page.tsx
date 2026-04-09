import type { Metadata } from 'next'
import { getMapPlaces } from '@/lib/db/queries'
import { MapView } from '@/components/public/MapView'

export const metadata: Metadata = {
  title: 'Carte des lieux dog-friendly — La Réunion',
  description: 'Carte interactive de tous les lieux qui acceptent les chiens à La Réunion.',
}

export default async function CartePage() {
  let places: Awaited<ReturnType<typeof getMapPlaces>> = []
  try {
    places = await getMapPlaces()
  } catch {
    // DB non configurée
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0">
        <div>
          <h1 className="font-bold text-gray-900">Carte</h1>
          <p className="text-xs text-gray-500">{places.length} lieu{places.length > 1 ? 'x' : ''} sur la carte</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-600 inline-block"></span>Acceptés</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>Conditions</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>Interdits</span>
        </div>
      </div>
      <div className="flex-1 p-2">
        <MapView places={places} />
      </div>
    </div>
  )
}
