import type { Metadata } from 'next'
import { getAllCategories, getAllCommunes } from '@/lib/db/queries'
import { SubmissionForm } from '@/components/public/SubmissionForm'

export const metadata: Metadata = {
  title: 'Proposer un lieu dog-friendly',
  description: 'Vous connaissez un lieu qui accepte les chiens à La Réunion ? Proposez-le, notre équipe le vérifiera.',
}

export default async function ProposerPage() {
  let categories: Awaited<ReturnType<typeof getAllCategories>> = []
  let communes: Awaited<ReturnType<typeof getAllCommunes>> = []
  try {
    ;[categories, communes] = await Promise.all([getAllCategories(), getAllCommunes()])
  } catch { /* DB non configurée */ }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Proposer un lieu dog-friendly</h1>
        <p className="text-gray-600 text-sm leading-relaxed">
          Notre équipe examine chaque proposition avant de la publier. Merci de fournir le maximum
          d&apos;informations pour accélérer le traitement.
        </p>
      </div>
      <SubmissionForm type="new_place" categories={categories} communes={communes} />
    </div>
  )
}
