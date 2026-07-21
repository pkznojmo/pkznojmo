'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ShoppingBag } from 'lucide-react';

const navLinks = [
  { name: 'Domů', href: '/' },
  { name: 'Články', href: '/clanky' },
  { name: 'Družstva', href: '/druzstva' },
  { name: 'Klubové rekordy', href: '/rekordy' },
  { name: 'Profily plavců', href: '/plavci' },
  { name: 'Sponzoři', href: '/sponzori' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-900 tracking-tight">
          <span className="text-2xl">🏊‍♂️</span>
          <span>PK ZNOJMO</span> {/* Zde si uprav název / vlož <Image /> */}
        </Link>

        {/* DESKTOP MENU */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-700">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-blue-600 transition-colors py-1"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* E-SHOP BUTTON & MOBILE MENU TOGGLE */}
        <div className="flex items-center gap-4">
          <Link
            href="/eshop"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-blue-700 active:scale-95 shadow-md shadow-blue-500/20"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>E-SHOP</span>
          </Link>

          {/* Mobilní tlačítko hamburgeru */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden focus:outline-none"
            aria-label="Otevřít menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* MOBILNÍ ROZBALOVACÍ MENU */}
      {isOpen && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <div className="space-y-1 px-4 pt-3 pb-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block rounded-lg px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}