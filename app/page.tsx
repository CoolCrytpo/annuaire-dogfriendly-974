import Link from 'next/link'
import { getAllCategories } from '@/lib/db/queries'

export default async function HomePage() {
  let categories: Awaited<ReturnType<typeof getAllCategories>> = []
  try {
    categories = await getAllCategories()
  } catch {
    // DB non configurée en dev
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-green-50 to-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-4xl mb-4" aria-hidden="true">🐾</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            Les lieux dog-friendly<br />à La Réunion
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
            Restaurants, plages, hôtels, commerces — trouvez où emmener votre chien en toute confiance.
            Données vérifiées et sourcées par notre équipe.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/annuaire"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Consulter l&apos;annuaire
            </Link>
            <Link
              href="/carte"
              className="bg-white hover:bg-gray-50 text-gray-700 font-semibold px-6 py-3 rounded-xl border border-gray-300 transition-colors"
            >
              Voir la carte
            </Link>
          </div>
        </div>
      </section>

      {/* Catégories */}
      {categories.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Parcourir par catégorie</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {categories.slice(0, 10).map((cat) => (
              <Link
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 hover:bg-green-50 hover:border-green-200 border border-gray-200 transition-colors text-center"
              >
                <span className="text-2xl" aria-hidden="true">{cat.icon}</span>
                <span className="text-xs font-medium text-gray-700 leading-tight">{cat.label}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Comment ça marche */}
      <section className="bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-8 text-center">Comment ça marche ?</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: '🔍',
                title: 'Données vérifiées',
                desc: "Chaque fiche est vérifiée par notre équipe à partir de sources officielles, sites web et contacts directs.",
              },
              {
                icon: '📅',
                title: 'Datées et sourcées',
                desc: "Toute information affiche sa source et sa date de vérification. L'incertitude est toujours visible.",
              },
              {
                icon: '🐾',
                title: 'Contribuez',
                desc: "Vous connaissez un lieu dog-friendly ? Proposez-le. Notre équipe le vérifie avant publication.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-3xl mb-3" aria-hidden="true">{item.icon}</p>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA contribution */}
      <section className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-3">
          Vous connaissez un lieu dog-friendly ?
        </h2>
        <p className="text-gray-600 mb-6">
          Aidez la communauté en proposant un lieu ou en corrigeant une information.
        </p>
        <Link
          href="/proposer"
          className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Proposer un lieu
        </Link>
      </section>
    </div>
  )
}
