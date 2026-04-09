import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Méthodologie',
  description: 'Comment nous vérifions et notons la fiabilité des informations sur Dog Friendly 974.',
}

export default function MethodologiePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Méthodologie</h1>

      <div className="prose prose-sm prose-gray max-w-none space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-gray-900">Notre principe fondateur</h2>
          <p>
            Dog Friendly 974 est un <strong>annuaire éditorial augmenté par la data</strong>, pas un robot qui devine.
            Aucune information n&apos;est publiée automatiquement. Toute fiche est examinée et validée par notre équipe.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">Politique chien</h2>
          <p>Chaque lieu reçoit l&apos;un de ces statuts :</p>
          <ul className="mt-2 space-y-2">
            <li className="flex items-start gap-2"><span>✅</span><div><strong>Chiens acceptés</strong> — accueil explicitement confirmé.</div></li>
            <li className="flex items-start gap-2"><span>⚠️</span><div><strong>Sous conditions</strong> — acceptés avec restrictions (zone, laisse, taille…).</div></li>
            <li className="flex items-start gap-2"><span>🚫</span><div><strong>Chiens interdits</strong> — refus explicitement confirmé.</div></li>
            <li className="flex items-start gap-2"><span>❓</span><div><strong>Non renseigné</strong> — aucune source explicite trouvée. Ne pas déduire.</div></li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">Sources acceptées</h2>
          <p>Par ordre de priorité :</p>
          <ol className="mt-2 space-y-1 list-decimal list-inside">
            <li>Source officielle explicite et récente (site de l&apos;établissement, mairie)</li>
            <li>Confirmation directe récente (appel, contact)</li>
            <li>Vérification terrain récente</li>
            <li>Source structurée crédible (partenaire, annuaire spécialisé)</li>
            <li>Avis cohérents sur plusieurs plateformes</li>
          </ol>
          <p className="mt-3 text-amber-700 bg-amber-50 rounded px-3 py-2 text-sm">
            Les données Google Places et OpenStreetMap ne sont utilisées que comme indices de découverte,
            jamais comme sources de vérité.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">Niveau de fiabilité</h2>
          <p>Chaque fiche affiche un niveau public :</p>
          <ul className="mt-2 space-y-2">
            <li><strong className="text-blue-800">Fiable</strong> — source officielle récente, données cohérentes.</li>
            <li><strong className="text-slate-700">Indicatif</strong> — données probables mais à confirmer.</li>
            <li><strong className="text-orange-700">À confirmer</strong> — information déclarative ou ancienne.</li>
          </ul>
          <p className="mt-3 text-sm text-gray-600">
            La fraîcheur des données est prise en compte : une information de plus d&apos;un an voit son niveau diminuer automatiquement.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">Revalidation périodique</h2>
          <p>
            Les fiches publiées sont repassées en revue régulièrement. Toute contradiction détectée
            entre sources déclenche une vérification manuelle.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">Contributions publiques</h2>
          <p>
            Les propositions et corrections envoyées par les visiteurs alimentent notre file de travail.
            Elles sont triées, vérifiées et traitées par notre équipe avant toute mise à jour de l&apos;annuaire.
          </p>
        </section>
      </div>
    </div>
  )
}
