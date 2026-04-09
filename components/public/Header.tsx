import Link from 'next/link'

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-gray-900 hover:text-green-700 transition-colors">
          <span className="text-2xl" aria-hidden="true">🐾</span>
          <span className="hidden sm:inline">Dog Friendly 974</span>
          <span className="sm:hidden">DF 974</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link href="/annuaire" className="px-3 py-1.5 rounded-lg text-gray-600 hover:text-green-700 hover:bg-green-50 transition-colors">
            Annuaire
          </Link>
          <Link href="/carte" className="px-3 py-1.5 rounded-lg text-gray-600 hover:text-green-700 hover:bg-green-50 transition-colors">
            Carte
          </Link>
          <Link
            href="/proposer"
            className="ml-2 px-3 py-1.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
          >
            Proposer un lieu
          </Link>
        </nav>
      </div>
    </header>
  )
}
