import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth/session'

const NAV = [
  { href: '/admin', label: 'Tableau de bord', icon: '📊' },
  { href: '/admin/places', label: 'Fiches lieux', icon: '📍' },
  { href: '/admin/submissions', label: 'Contributions', icon: '📬' },
  { href: '/admin/sources', label: 'Sources', icon: '🔗' },
  { href: '/admin/duplicates', label: 'Doublons', icon: '🔀' },
  { href: '/admin/rechecks', label: 'À revérifier', icon: '🔄' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let user = null
  try {
    user = await getSession()
  } catch {
    // DB non configurée en dev — on laisse passer
  }

  if (user === null && process.env.NODE_ENV === 'production') {
    redirect('/admin/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-gray-900 text-white flex flex-col">
        <div className="px-4 py-4 border-b border-gray-700">
          <Link href="/admin" className="flex items-center gap-2 text-sm font-bold">
            <span>🐾</span> Admin DF974
          </Link>
          {user && <p className="text-xs text-gray-400 mt-1 truncate">{user.email}</p>}
        </div>
        <nav className="flex-1 py-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <span className="text-base" aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-gray-700">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-200">
            ← Voir le site public
          </Link>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
