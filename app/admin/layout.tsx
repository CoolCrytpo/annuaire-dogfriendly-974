import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth/session'

const NAV_SECTIONS = [
  {
    label: 'Contenu',
    items: [
      { href: '/admin', label: 'Tableau de bord', icon: '📊', exact: true },
      { href: '/admin/places', label: 'Fiches lieux', icon: '📍' },
      { href: '/admin/submissions', label: 'Contributions', icon: '📬', badge: true },
      { href: '/admin/duplicates', label: 'Doublons', icon: '🔀' },
      { href: '/admin/rechecks', label: 'À revérifier', icon: '🔄' },
      { href: '/admin/sources', label: 'Sources', icon: '🔗' },
    ],
  },
  {
    label: 'Import',
    items: [
      { href: '/admin/import', label: 'Importer des lieux', icon: '📥' },
    ],
  },
  {
    label: 'Paramétrage',
    items: [
      { href: '/admin/categories', label: 'Catégories', icon: '🗂️' },
      { href: '/admin/sponsors', label: 'Sponsors & pubs', icon: '📣' },
      { href: '/admin/settings', label: 'Paramètres site', icon: '⚙️' },
    ],
  },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let user = null
  try {
    user = await getSession()
  } catch { /* DB non configurée */ }

  if (user === null && process.env.NODE_ENV === 'production') {
    redirect('/admin/login')
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#f5f4f2' }}>
      {/* Sidebar */}
      <aside
        className="w-60 flex-shrink-0 flex flex-col"
        style={{ background: '#1c1917', color: '#a8a29e' }}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b" style={{ borderColor: '#292524' }}>
          <Link href="/admin" className="flex items-center gap-2.5 mb-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)' }}
            >
              🐾
            </div>
            <div>
              <p className="text-white text-sm leading-none" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800 }}>
                Dog Friendly 974
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#57534e' }}>Back-office</p>
            </div>
          </Link>
          {user && (
            <div
              className="flex items-center gap-2 px-2.5 py-2 rounded-xl"
              style={{ background: '#292524' }}
            >
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center text-xs text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}
              >
                {user.name[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-white font-semibold truncate">{user.name}</p>
                <p className="text-xs truncate" style={{ color: '#57534e' }}>{user.role}</p>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mb-4">
              <p
                className="px-5 mb-1.5 text-xs font-bold uppercase tracking-widest"
                style={{ color: '#44403c', fontFamily: 'Nunito, sans-serif' }}
              >
                {section.label}
              </p>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 px-5 py-2.5 text-sm transition-all hover:text-white"
                  style={{ color: '#78716c', fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}
                >
                  <span className="text-base w-5 flex-shrink-0 text-center" aria-hidden>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer links */}
        <div className="px-5 py-4 border-t space-y-2" style={{ borderColor: '#292524' }}>
          <Link
            href="/"
            className="flex items-center gap-2 text-xs transition-colors hover:text-orange-400"
            style={{ color: '#57534e' }}
          >
            <span>↗️</span> Voir le site public
          </Link>
          <form action="/api/admin/auth/logout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-2 text-xs transition-colors hover:text-red-400 w-full text-left"
              style={{ color: '#57534e' }}
            >
              <span>🚪</span> Déconnexion
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-5xl">{children}</div>
      </div>
    </div>
  )
}
