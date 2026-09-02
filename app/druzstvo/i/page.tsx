'use client';

import Link from 'next/link';
import { 
  Sparkles, ArrowLeft, ChevronRight, Mail, Phone,
  UserCheck, Target, Zap, Crown, Calendar, Banknote, Ticket,
  GraduationCap, Award, CheckCircle2
} from "lucide-react";

export default function IndividualniLekcePage() {
  return (
    <div className="bg-white font-sans text-slate-800 pb-20 overflow-x-hidden">
      
      {/* NAVIGATION / BACK LINK */}
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <Link 
          href="/druzstva" 
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={16} /> Zpět na přehled družstev
        </Link>
      </div>

      {/* 1. HERO SECTION */}
      <section className="relative py-12 lg:py-16 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-50/70 via-transparent to-transparent -z-10" />
        
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* HERO TEXT */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200/60 text-amber-600 text-xs font-black uppercase tracking-widest">
                <Crown size={14} /> Premium Service
              </div>
              
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[1.05]">
                Individuální <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400">
                  Lekce
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-slate-500 font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Někdy skupina nestačí. Nabízíme exkluzivní přístup pro ty, kteří vyžadují maximální rychlost v pokroku a flexibilitu.
              </p>

              <div className="pt-4 flex flex-wrap gap-4 justify-center lg:justify-start text-xs font-black uppercase tracking-wider text-slate-500">
                <span className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100">
                  <UserCheck className="text-blue-500" size={18} /> 100% pozornost trenéra
                </span>
                <span className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100">
                  <Zap className="text-amber-500" size={18} /> Časová flexibilita
                </span>
              </div>
            </div>

            {/* HERO CARD / VIP BANNER */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md bg-slate-900 text-white p-8 sm:p-10 rounded-[3rem] shadow-2xl relative overflow-hidden border-b-8 border-amber-400">
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
                
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
                  Exkluzivní péče
                </span>

                <div className="my-6 space-y-2">
                  <h3 className="text-3xl font-black uppercase tracking-tight">Osobní trenér</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    Individuální přístup na míru vašim fyzickým možnostem a sportovním cílům.
                  </p>
                </div>

                <div className="space-y-3 pt-6 border-t border-slate-800 text-xs font-medium text-slate-300">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-amber-400 shrink-0" size={16} />
                    <span>Detailní rozbor a oprava plavecké techniky</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-amber-400 shrink-0" size={16} />
                    <span>Příprava na konkrétní fyzické zkoušky či závody</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-amber-400 shrink-0" size={16} />
                    <span>Termíny přizpůsobené vašemu programu</span>
                  </div>
                </div>

                <a 
                  href="#kontakt" 
                  className="mt-8 w-full block py-4 bg-amber-400 hover:bg-amber-300 text-slate-900 text-center rounded-2xl font-black uppercase text-xs tracking-widest transition-colors shadow-lg shadow-amber-400/10"
                >
                  Mám zájem o individuál
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. ZAMĚŘENÍ INDIVIDUÁLNÍCH LEKCÍ */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Pro koho jsou lekce určeny
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight mt-3">
            S čím vám nejčastěji pomáháme
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* CARD 1: PŘÍPRAVA NA ZKOUŠKY */}
          <div className="bg-white border-2 border-slate-100 p-8 rounded-[2.5rem] shadow-xl shadow-slate-100 relative flex flex-col justify-between hover:border-blue-200 transition-all">
            <div>
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                  Cílený dril
                </span>
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                  <GraduationCap size={24} />
                </div>
              </div>

              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">
                Příprava na zkoušky
              </h3>

              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Pomůžeme vám splnit limity pro přijímačky na VŠ, k policii nebo do armády. Efektivně a bez stresu.
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Časově efektivní příprava
            </div>
          </div>

          {/* CARD 2: TRIATLON & IRONMAN */}
          <div className="bg-white border-2 border-slate-100 p-8 rounded-[2.5rem] shadow-xl shadow-slate-100 relative flex flex-col justify-between hover:border-blue-200 transition-all">
            <div>
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                  Výkon
                </span>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Award size={24} />
                </div>
              </div>

              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">
                Triatlon & Ironman
              </h3>

              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Zefektivníme váš kraulový záběr pro otevřenou vodu. Méně úsilí, vyšší rychlost, lepší čas.
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Optimalizace záběru & dýchání
            </div>
          </div>

          {/* CARD 3: MAXIMÁLNÍ PROGRES */}
          <div className="bg-white border-2 border-slate-100 p-8 rounded-[2.5rem] shadow-xl shadow-slate-100 relative flex flex-col justify-between hover:border-blue-200 transition-all">
            <div>
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md">
                  VIP přístup
                </span>
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Target size={24} />
                </div>
              </div>

              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">
                Maximální progres
              </h3>

              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Pro ty, kteří chtějí 100% pozornost trenéra. Odstraníme zlozvyky, které vás roky brzdí.
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Odstranění technických chyb
            </div>
          </div>

        </div>
      </section>

      {/* 3. PRAVIDLA SPOLUPRÁCE */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <div className="bg-slate-50 rounded-[3rem] p-8 sm:p-12 border border-slate-200">
          
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Pravidla spolupráce
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight mt-3">
              Jak to funguje?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* RULE 1 */}
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <Calendar size={22} />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-2">Individuální domluva</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Termíny lekcí se ladí přímo s vybraným trenérem podle vašich časových možností.
                </p>
              </div>
            </div>

            {/* RULE 2 */}
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
                  <Banknote size={22} />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-2">Vlastní sazba</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Cena lekce je v kompetenci trenéra (liší se dle kvalifikace a délky tréninku).
                </p>
              </div>
            </div>

            {/* RULE 3 */}
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                  <Ticket size={22} />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-2">Vstup na bazén</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Klient si hradí vstup na bazén samostatně.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4. CALL TO ACTION & CONTACT */}
      <section id="kontakt" className="py-12 max-w-7xl mx-auto px-6">
        <div className="bg-slate-900 rounded-[3.5rem] p-8 sm:p-14 lg:p-16 relative overflow-hidden shadow-2xl border-b-8 border-amber-400">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-amber-400 text-xs font-black uppercase tracking-widest">
                Máte zájem o individuál?
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight uppercase italic tracking-tighter">
                Napište nám své <span className="text-amber-400">požadavky</span>
              </h2>
              <p className="text-slate-400 text-base font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                Uveďte váš cíl, preferovaný čas a úroveň plavce. Propojíme vás s nejvhodnějším expertem z našeho týmu.
              </p>
            </div>

            <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6">
              <div className="flex items-center gap-4 text-white">
                <div className="w-12 h-12 bg-amber-400/10 border border-amber-400/20 text-amber-400 rounded-2xl flex items-center justify-center shrink-0">
                  <Mail size={22} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">E-mail</span>
                  <a href="mailto:info@pkznojmo.cz" className="text-lg font-extrabold hover:text-amber-400 transition-colors">
                    info@pkznojmo.cz
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4 text-white pt-4 border-t border-white/10">
                <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center shrink-0">
                  <Phone size={22} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Telefon</span>
                  <a href="tel:+420777535302" className="text-lg font-extrabold hover:text-blue-400 transition-colors">
                    +420 777 535 302
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}