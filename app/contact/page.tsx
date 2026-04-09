import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contactez l\'équipe Dog Friendly 974.',
}

export default function ContactPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Contact</h1>
      <p className="text-gray-600 mb-8">
        Une question, une suggestion ou une information à nous transmettre ?
      </p>

      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <p className="font-medium text-green-900 mb-1">Proposer ou corriger un lieu</p>
          <p className="text-sm text-green-800 mb-3">
            Utilisez le formulaire dédié, c&apos;est le chemin le plus rapide pour notre équipe.
          </p>
          <Link
            href="/proposer"
            className="inline-block text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Proposer un lieu
          </Link>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
          <p className="font-medium text-gray-900 mb-1">Autre demande</p>
          <p className="text-sm text-gray-600">
            Envoyez-nous un e-mail à{' '}
            <a
              href="mailto:contact@dogfriendly974.re"
              className="text-green-700 underline"
            >
              contact@dogfriendly974.re
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
