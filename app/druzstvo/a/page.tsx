'use client';

import Link from 'next/link';
import { ArrowLeft, Construction } from "lucide-react";

export default function DruzstvoAPage() {
  return (
    <div className="bg-white font-sans text-slate-800 pb-20 overflow-x-hidden min-h-screen flex flex-col justify-between">
      <div>
        {/* NAVIGATION / BACK LINK */}
        <div className="max-w-7xl mx-auto px-6 pt-8">
          <Link 
            href="/druzstva" 
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={16} /> Zpět na přehled družstev
          </Link>
        </div>

        {/* UNDER DEVELOPMENT HERO */}
        <section className="relative py-16 lg:py-24 overflow-hidden">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
            
            {/* Development Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-black uppercase tracking-widest shadow-sm">
              <Construction size={16} /> Stránka je právě ve vývoji
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tighter leading-tight">
              Závodní plavání <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400">
                Družstvo A
              </span>
            </h1>

            <p className="text-lg text-slate-500 font-normal max-w-xl mx-auto">
              Tato sekce se připravuje. Kompletní informace a harmonogram tréninků zde brzy doplníme.
            </p>

            {/* PRICING CARD */}
            <div className="max-w-md mx-auto bg-white p-8 sm:p-10 rounded-[3rem] border-2 border-slate-100 shadow-2xl shadow-blue-100/50 relative overflow-hidden text-center mt-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full blur-2xl -z-10 opacity-70" />
              
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                Členský příspěvek
              </span>

              <div className="my-6">
                <div className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight">
                  9.500 <span className="text-2xl font-bold text-slate-400">Kč</span>
                </div>
                <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mt-2">
                  Za školní rok (Družstvo A)
                </div>
              </div>

              <Link 
                href="https://klub.pkznojmo.cz/registration" 
                className="mt-8 w-full block py-4 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-colors shadow-lg shadow-slate-900/10"
              >
                Mám zájem o družstvo A
              </Link>
            </div>

          </div>
        </section>
      </div>
    </div>
  );
}