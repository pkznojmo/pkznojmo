'use client';

import Link from 'next/link';
import { 
  Sparkles, CheckCircle2, Clock, MapPin, 
  ArrowLeft, ChevronRight, MessageSquare, 
  HeartHandshake, Calendar, Info, Waves
} from "lucide-react";

export default function DruzstvoHPage() {
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
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-black uppercase tracking-widest">
                <Sparkles size={14} /> Relaxace & Kondice
              </div>
              
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[1.05]">
                Plavání pro dospělé <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400">
                  Družstvo H
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-slate-500 font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Kondiční plavání pro dospělé a hobíky. Vylaďte si techniku pod dohledem trenéra a vypněte po náročném dni.
              </p>

              <div className="pt-4 flex flex-wrap gap-4 justify-center lg:justify-start text-xs font-black uppercase tracking-wider text-slate-500">
                <span className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100">
                  <Calendar className="text-blue-500" size={18} /> Celý školní rok (1× týdně)
                </span>
                <span className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100">
                  <HeartHandshake className="text-emerald-500" size={18} /> Vstup v ceně & dohled trenéra
                </span>
              </div>
            </div>

            {/* HERO PRICING CARD */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-[3rem] border-2 border-slate-100 shadow-2xl shadow-blue-100/50 relative overflow-hidden text-center">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full blur-2xl -z-10 opacity-70" />
                
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                  Kurzovné (celý školní rok)
                </span>

                <div className="my-6">
                  <div className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight">
                    8.000 <span className="text-2xl font-bold text-slate-400">Kč</span>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mt-2">
                    1× týdně / celý školní rok
                  </div>
                </div>

                <div className="space-y-3 pt-6 border-t border-slate-100 text-left text-xs font-medium text-slate-600">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={16} />
                    <span>Pravidelný trénink 60 min týdně s trenérem</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={16} />
                    <span>Vstup na bazén je kompletně v ceně</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={16} />
                    <span>Garantované místo na celý školní rok</span>
                  </div>
                </div>

                <a 
                  href="#zapis" 
                  className="mt-8 w-full block py-4 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-colors shadow-lg shadow-slate-900/10"
                >
                  Registrace do kurzu
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. PARAMETRY KURZU / BENEFITY */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          <div className="bg-blue-50/50 border-2 border-blue-100 p-8 rounded-[2.5rem] relative group hover:-translate-y-1 transition-transform">
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-500 font-black text-xl">
                1×
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-white px-3 py-1 rounded-full border border-blue-100">
                Garantované místo
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Týdně po celý školní rok</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-normal mb-4">
              Předplacený kurz, který vám zajistí pravidelný pohyb a rezervovanou dráhu od září do června.
            </p>
            <div className="flex flex-wrap gap-2 pt-4 border-t border-blue-100/60 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500" /> Vstup v ceně</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500" /> Oprava techniky</span>
            </div>
          </div>

          <div className="bg-emerald-50/50 border-2 border-emerald-100 p-8 rounded-[2.5rem] relative group hover:-translate-y-1 transition-transform">
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-emerald-500 font-black text-2xl">
                60′
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-white px-3 py-1 rounded-full border border-emerald-100">
                Pod vedením trenéra
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Minut tréninku</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-normal mb-4">
              Intenzivní hodina zaměřená na techniku stylů, vytrvalost a správné dýchání.
            </p>
            <div className="flex flex-wrap gap-2 pt-4 border-t border-emerald-100/60 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500" /> Vstup v ceně</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500" /> Oprava techniky</span>
            </div>
          </div>

        </div>
      </section>

      {/* 3. VÝBĚR TERMÍNU & ROZPIS LEKCÍ */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <div className="bg-slate-50 rounded-[3rem] p-8 sm:p-12 border border-slate-200">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                Výběr termínu
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight mt-3">
                Rozpis lekcí pro Družstvo H
              </h2>
              <p className="text-slate-500 text-sm mt-2 max-w-xl">
                Zvolte si jeden pevný den pro svůj kurz. Všechny lekce probíhají na Bazénu Louka a jsou vhodné pro všechny úrovně pokročilosti.
              </p>
            </div>
            
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shrink-0">
              <MapPin size={16} className="text-blue-500" /> Místo: Bazén Louka
            </div>
          </div>

          {/* DAYS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* PONDĚLÍ */}
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                      Skupina H1
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mt-1">
                      Pondělí
                    </h3>
                  </div>
                  <Clock className="text-blue-500" size={20} />
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Čas tréninku</span>
                    <span className="text-lg font-black text-slate-900">17:30 – 18:30</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Lokalita & Náplň</span>
                    <p className="text-xs text-slate-600 font-medium">Bazén Louka — Vhodné pro všechny úrovně pokročilosti</p>
                  </div>
                </div>
              </div>
            </div>

            {/* STŘEDA */}
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                      Skupina H2
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mt-1">
                      Středa
                    </h3>
                  </div>
                  <Clock className="text-blue-500" size={20} />
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Čas tréninku</span>
                    <span className="text-lg font-black text-slate-900">16:30 – 17:30</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Lokalita & Náplň</span>
                    <p className="text-xs text-slate-600 font-medium">Bazén Louka — Vhodné pro všechny úrovně pokročilosti</p>
                  </div>
                </div>
              </div>
            </div>

            {/* PÁTEK */}
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                      Skupina H3
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mt-1">
                      Pátek
                    </h3>
                  </div>
                  <Clock className="text-blue-500" size={20} />
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Čas tréninku</span>
                    <span className="text-lg font-black text-slate-900">17:00 – 18:00</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Lokalita & Náplň</span>
                    <p className="text-xs text-slate-600 font-medium">Bazén Louka — Vhodné pro všechny úrovně pokročilosti</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* TERMS AND REPLACEMENT POLICY BANNER */}
          <div className="mt-8 p-6 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <Info size={24} />
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              <strong>Kurz probíhá po celý školní rok.</strong> V případě nemoci je možné si lekci po dohodě s trenérem nahradit v druhém termínu, pokud to kapacita dráhy dovolí. Lekce se čerpají v rámci daného školního roku.
            </p>
          </div>

        </div>
      </section>

      {/* 4. CALL TO ACTION (SLATE BANNER) */}
      <section id="zapis" className="py-12 max-w-7xl mx-auto px-6">
        <div className="bg-slate-900 rounded-[3.5rem] p-8 sm:p-14 lg:p-16 relative overflow-hidden shadow-2xl border-b-8 border-blue-600">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6 text-center lg:text-left">
              <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-blue-400 text-xs font-black uppercase tracking-widest">
                Kurz pro dospělé
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight uppercase italic tracking-tighter">
                Začněte plavat <span className="text-blue-500">správně!</span>
              </h2>
              <p className="text-slate-400 text-base font-medium italic leading-relaxed max-w-lg mx-auto lg:mx-0">
                Kapacita drah pro dospělé je omezená pro zajištění maximálního komfortu. Rezervujte si své místo včas.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-end">
              <Link 
                href="https://klub.pkznojmo.cz/registration" 
                className="px-8 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-blue-600/20 text-center flex items-center justify-center gap-3 group"
              >
                <span>Registrace do kurzu</span>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                href="/kontakty" 
                className="px-8 py-5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all text-center flex items-center justify-center gap-3 border border-white/10"
              >
                <MessageSquare size={16} />
                <span>Chci se nejdřív zeptat</span>
              </Link>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}