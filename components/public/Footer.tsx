import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
          <div>
            <p className="font-semibold text-gray-800 mb-2 flex items-center gap-1">
              <span>🐾</span> Dog Friendly 974
            </p>
            <p className="text-gray-500 text-xs leading-relaxed">
              Annuaire éditorial des lieux accueillant les chiens à La Réunion.
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-2">Explorer</p>
            <ul className="space-y-1 text-gray-500">
              <li><Link href="/annuaire" className="hover:text-green-700">Annuaire</Link></li>
              <li><Link href="/carte" className="hover:text-green-700">Carte</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-2">Contribuer</p>
            <ul className="space-y-1 text-gray-500">
              <li><Link href="/proposer" className="hover:text-green-700">Proposer un lieu</Link></li>
              <li><Link href="/contact" className="hover:text-green-700">Contact</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-2">À propos</p>
            <ul className="space-y-1 text-gray-500">
              <li><Link href="/methodologie" className="hover:text-green-700">Méthodologie</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-8 pt-6 text-xs text-gray-400 text-center">
          © {new Date().getFullYear()} Dog Friendly 974 · Données vérifiées manuellement · La Réunion
        </div>
      </div>
    </footer>
  )
}
