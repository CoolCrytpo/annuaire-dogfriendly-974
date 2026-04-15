'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const NAV = [
  { href: '/lieux', label: 'Lieux' },
  { href: '/spots', label: 'Spots' },
  { href: '/balades', label: 'Balades' },
  { href: '/services', label: 'Services' },
]

const NAV_SECONDARY = [
  { href: '/carte', label: 'Carte' },
  { href: '/methodologie', label: 'Notre méthode' },
]

export function Header() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-md border-b"
      style={{
        background: 'rgba(255,251,247,0.92)',
        borderColor: 'rgba(249,115,22,0.12)',
        boxShadow: '0 1px 12px rgba(249,115,22,0.08)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)' }}
          >
            🐾
          </div>
          <div className="hidden sm:block">
            <span
              className="font-display text-lg leading-none block"
              style={{
                background: 'linear-gradient(135deg, #f97316, #f59e0b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Dog Friendly
            </span>
            <span className="text-xs font-bold text-stone-400 tracking-widest leading-none">974 · LA RÉUNION</span>
          </div>
          <div className="sm:hidden">
            <span
              className="font-display text-base leading-none"
              style={{
                background: 'linear-gradient(135deg, #f97316, #f59e0b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              DF974
            </span>
          </div>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3.5 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                color: pathname.startsWith(item.href) ? '#f97316' : '#57534e',
                background: pathname.startsWith(item.href) ? '#fff7ed' : 'transparent',
                fontFamily: 'Nunito, sans-serif',
              }}
            >
              {item.label}
            </Link>
          ))}
          <span className="mx-1 text-stone-200">|</span>
          {NAV_SECONDARY.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 rounded-full text-xs font-semibold transition-all"
              style={{
                color: pathname === item.href ? '#f97316' : '#a8a29e',
                background: pathname === item.href ? '#fff7ed' : 'transparent',
                fontFamily: 'Nunito, sans-serif',
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* CTA + burger */}
        <div className="flex items-center gap-2">
          <Link href="/proposer" className="btn-primary text-sm py-2 px-4 hidden sm:inline-flex">
            + Proposer un lieu
          </Link>
          {/* Burger mobile */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-colors"
            style={{ background: menuOpen ? '#fff7ed' : 'transparent', color: '#f97316' }}
            aria-label="Menu"
          >
            <span
              className="block h-0.5 w-5 rounded-full transition-all"
              style={{
                background: '#f97316',
                transform: menuOpen ? 'rotate(45deg) translateY(6px)' : 'none',
              }}
            />
            <span
              className="block h-0.5 w-5 rounded-full transition-all"
              style={{
                background: '#f97316',
                opacity: menuOpen ? 0 : 1,
              }}
            />
            <span
              className="block h-0.5 w-5 rounded-full transition-all"
              style={{
                background: '#f97316',
                transform: menuOpen ? 'rotate(-45deg) translateY(-6px)' : 'none',
              }}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden border-t px-4 py-4 flex flex-col gap-2"
          style={{ borderColor: 'rgba(249,115,22,0.12)', background: 'rgba(255,251,247,0.98)' }}
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
              style={{
                color: pathname.startsWith(item.href) ? '#f97316' : '#44403c',
                background: pathname.startsWith(item.href) ? '#fff7ed' : 'transparent',
                fontFamily: 'Nunito, sans-serif',
              }}
            >
              {item.label}
            </Link>
          ))}
          <div className="border-t my-1" style={{ borderColor: 'rgba(249,115,22,0.08)' }} />
          {NAV_SECONDARY.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors"
              style={{
                color: pathname === item.href ? '#f97316' : '#78716c',
                background: pathname === item.href ? '#fff7ed' : 'transparent',
                fontFamily: 'Nunito, sans-serif',
              }}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/proposer"
            onClick={() => setMenuOpen(false)}
            className="btn-primary justify-center mt-1"
          >
            + Proposer un lieu
          </Link>
        </div>
      )}
    </header>
  )
}
