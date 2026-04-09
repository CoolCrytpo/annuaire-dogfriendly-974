import { getAllCategories, getAllCommunes } from '@/lib/db/queries'
import { PlaceEditor } from '@/components/admin/PlaceEditor'

export default async function NewPlacePage() {
  let categories: Awaited<ReturnType<typeof getAllCategories>> = []
  let communes: Awaited<ReturnType<typeof getAllCommunes>> = []
  try {
    ;[categories, communes] = await Promise.all([getAllCategories(), getAllCommunes()])
  } catch { /* DB non configurée */ }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Nouvelle fiche lieu</h1>
      <PlaceEditor categories={categories} communes={communes} />
    </div>
  )
}
