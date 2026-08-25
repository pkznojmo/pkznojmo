'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ShoppingBag, User, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

const navLinks = [
  { name: 'Domů', href: '/' },
  { name: 'Články', href: '/clanky' },
  { name: 'Družstva', href: '/druzstva' },
  { name: 'Klubové rekordy', href: '/klubove-rekordy' },
  { name: 'Profily plavců', href: '/profily-plavcu' },
  { name: 'Sponzoři', href: '/sponzori' },
  { name: 'Kontakty', href: '/kontakty' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    // Funkce pro načtení uživatele a jeho profilu z DB
    const fetchUserData = async (currentUser: SupabaseUser | null) => {
      setUser(currentUser);

      if (!currentUser) {
        setDisplayName('');
        return;
      }

      // 1. Zkusíme nejdřív vytáhnout jméno z tabulky profiles (kde máte first_name a last_name)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', currentUser.id)
        .single();

      if (!error && profile && (profile.first_name || profile.last_name)) {
        const full = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
        setDisplayName(full);
        return;
      }

      // 2. Fallback na user_metadata (pokud profil v DB ještě neexistuje)
      const meta = currentUser.user_metadata;
      if (meta?.full_name) {
        setDisplayName(meta.full_name);
        return;
      }
      if (meta?.first_name || meta?.last_name) {
        setDisplayName(`${meta.first_name || ''} ${meta.last_name || ''}`.trim());
        return;
      }

      // 3. Poslední záchrana – část e-mailu před zavináčem
      setDisplayName(currentUser.email?.split('@')[0] || 'Uživatel');
    };

    // Počáteční načtení
    supabase.auth.getUser().then(({ data: { user } }) => {
      fetchUserData(user);
    });

    // Poslouchání na změny auth stavu
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchUserData(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-20">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3 font-bold text-xl text-blue-900 tracking-tight">
          <Image
            src="/logo.png"
            alt="PK Znojmo Logo"
            width={1024}
            height={1024}
            className="h-18 w-auto object-contain"
            priority
          />
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

        {/* E-SHOP BUTTON, PROFILE & MOBILE MENU TOGGLE */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/eshop"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-bold text-white transition-all hover:bg-blue-700 active:scale-95 shadow-md shadow-blue-500/20"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">E-SHOP</span>
          </Link>

          {/* PŘIHLÁŠENÍ / PROFIL */}
          {user ? (
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 pl-3 rounded-xl">
              <Link 
                href="/dashboard" 
                className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors"
              >
                <User className="h-4 w-4 text-blue-600" />
                <span className="max-w-[140px] truncate">{displayName}</span>
              </Link>
              <button
                onClick={handleSignOut}
                title="Odhlásit se"
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-slate-200 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/prihlaseni"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-100 hover:text-blue-600 active:scale-95"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Přihlásit</span>
            </Link>
          )}

          {/* MOBILNÍ HAMBURGER */}
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
        <div className="border-t border-slate-100 bg-white lg:hidden">
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

      {/* WAVE EFEKT NA SPODU NAVBARU */}
      <div className="absolute bottom-[-15px] left-0 w-full overflow-hidden leading-[0] pointer-events-none z-10">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="relative block w-full h-[16px] fill-slate-50"
        >
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
        </svg>
      </div>
    </header>
  );
}