'use client';

import Link from 'next/link';
import { 
  Sparkles, CheckCircle2, Clock, MapPin, 
  ArrowLeft, ChevronRight, MessageSquare, 
  Trophy, Dumbbell, Zap, Users, Info, Flame
} from "lucide-react";

export default function DruzstvoBPage() {
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
                <Sparkles size={14} /> Zdokonalovací plavci
              </div>
              
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[1.05]">
                Zdokonalovací plavci <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400">
                  Družstvo B
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-slate-500 font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Plynulý přechod k závodnímu plavání. Budujeme pevné základy techniky a kondice v přátelském, ale výkonnostním prostředí.
              </p>

              <div className="pt-4 flex flex-wrap gap-4 justify-center lg:justify-start text-xs font-black uppercase tracking-wider text-slate-500">
                <span className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100">
                  <Flame className="text-blue-500" size={18} /> B1 / B2
                </span>
                <span className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100">
                  <Dumbbell className="text-emerald-500" size={18} /> 3–5× voda + 1–2× sucho / týden
                </span>
              </div>
            </div>

            {/* HERO PRICING CARD */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-[3rem] border-2 border-slate-100 shadow-2xl shadow-blue-100/50 relative overflow-hidden text-center">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full blur-2xl -z-10 opacity-70" />
                
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                  Členský příspěvek
                </span>

                <div className="my-6">
                  <div className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight">
                    8.000 <span className="text-2xl font-bold text-slate-400">Kč</span>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mt-2">
                    Za školní rok
                  </div>
                </div>

                <div className="space-y-3 pt-6 border-t border-slate-100 text-left text-xs font-medium text-slate-600">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={16} />
                    <span>Zdokonalovací příprava na náročnější závody</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={16} />
                    <span>Důraz na techniku všech stylů, vytrvalost a obrátky</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={16} />
                    <span>Propojení tréninku na vodě se suchou přípravou</span>
                  </div>
                </div>

                <a 
                  href="#zapis" 
                  className="mt-8 w-full block py-4 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-colors shadow-lg shadow-slate-900/10"
                >
                  Registrace do týmu
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. THREE PILLARS / HLAVNÍ BENEFITY */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-blue-50/50 border-2 border-blue-100 p-8 rounded-[2.5rem] relative group hover:-translate-y-1 transition-transform">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm text-blue-500">
              <Users size={28} />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Pozornost každému plavci</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              Trénujeme v efektivních skupinách, kde má trenér detailní přehled o technice každého svěřence. Individuální opravy chyb jsou klíčem k rychlému zlepšení.
            </p>
          </div>

          <div className="bg-emerald-50/50 border-2 border-emerald-100 p-8 rounded-[2.5rem] relative group hover:-translate-y-1 transition-transform">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm text-emerald-500">
              <Dumbbell size={28} />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Všestrannost a kondice</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              Trénink propojujeme se suchou přípravou pro rozvoj síly a zdravé držení těla. Díky aerobní zátěži a pilování detailů, jako jsou obrátky či motýlek, budujeme u dětí komplexní plaveckou odolnost i dovednosti.
            </p>
          </div>

          <div className="bg-cyan-50/50 border-2 border-cyan-100 p-8 rounded-[2.5rem] relative group hover:-translate-y-1 transition-transform">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm text-cyan-500">
              <Trophy size={28} />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Cesta k úspěchu</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              V Béčku už neplaveme jen pro radost, ale učíme děti disciplíně a sportovnímu duchu. Vedeme je k překonávání vlastních limitů a radosti z pokroků.
            </p>
          </div>

        </div>
      </section>

      {/* 3. ROZVRH TRÉNINKŮ */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <div className="bg-slate-50 rounded-[3rem] p-8 sm:p-12 border border-slate-200">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                Tréninkový plán & Základní časy
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight mt-3">
                Jak trénujeme?
              </h2>
            </div>
            
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shrink-0">
              <MapPin size={16} className="text-blue-500" /> Všechny tréninky: Bazén Louka
            </div>
          </div>

          {/* WEEKLY SCHEDULE GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            
            {/* PONDĚLÍ */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="font-black uppercase text-sm text-slate-900">Pondělí</span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Louka</span>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 bg-blue-50/60 border border-blue-100 rounded-xl">
                    <span className="text-[10px] font-black uppercase text-blue-600 block mb-0.5">Bazén</span>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Clock size={12} className="text-blue-500" /> 14:30 – 15:30
                    </span>
                  </div>
                  <div className="p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                    <span className="text-[10px] font-black uppercase text-emerald-600 block mb-0.5">Suchá příprava</span>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Clock size={12} className="text-emerald-500" /> 15:30 – 16:30
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-4 block">Bazén + Sucho</span>
            </div>

            {/* ÚTERÝ */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="font-black uppercase text-sm text-slate-900">Úterý</span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Louka</span>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 bg-blue-50/60 border border-blue-100 rounded-xl">
                    <span className="text-[10px] font-black uppercase text-blue-600 block mb-0.5">Bazén</span>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Clock size={12} className="text-blue-500" /> 14:30 – 15:30
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-6 block">Pouze bazén</span>
            </div>

            {/* STŘEDA */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="font-black uppercase text-sm text-slate-900">Středa</span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Louka</span>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 bg-blue-50/60 border border-blue-100 rounded-xl">
                    <span className="text-[10px] font-black uppercase text-blue-600 block mb-0.5">Bazén</span>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Clock size={12} className="text-blue-500" /> 14:30 – 15:30
                    </span>
                  </div>
                  <div className="p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                    <span className="text-[10px] font-black uppercase text-emerald-600 block mb-0.5">Suchá příprava</span>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Clock size={12} className="text-emerald-500" /> 15:30 – 16:30
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-4 block">Bazén + Sucho</span>
            </div>

            {/* ČTVRTEK */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="font-black uppercase text-sm text-slate-900">Čtvrtek</span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Louka</span>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 bg-blue-50/60 border border-blue-100 rounded-xl">
                    <span className="text-[10px] font-black uppercase text-blue-600 block mb-0.5">Bazén</span>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Clock size={12} className="text-blue-500" /> 14:30 – 15:30
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-6 block">Pouze bazén</span>
            </div>

            {/* PÁTEK */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="font-black uppercase text-sm text-slate-900">Pátek</span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Louka</span>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 bg-blue-50/60 border border-blue-100 rounded-xl">
                    <span className="text-[10px] font-black uppercase text-blue-600 block mb-0.5">Bazén</span>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Clock size={12} className="text-blue-500" /> 14:30 – 15:30
                    </span>
                  </div>
                  <div className="p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                    <span className="text-[10px] font-black uppercase text-emerald-600 block mb-0.5">Suchá příprava</span>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Clock size={12} className="text-emerald-500" /> 15:30 – 16:30
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-4 block">Bazén + Sucho</span>
            </div>

          </div>

          {/* NOTICE BANNER */}
          <div className="mt-8 p-6 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <Info size={24} />
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              <strong>Rozdělení plavců do skupin B1 a B2</strong> je plně v kompetenci trenérů na základě výkonnosti, věku a docházky. Suchá příprava probíhá v tělocvičně nebo v přilehlých prostorech bazénu.
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
                Registrace do týmu
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight uppercase italic tracking-tighter">
                Připojte se k <span className="text-blue-500">Béčku!</span>
              </h2>
              <p className="text-slate-400 text-base font-medium italic leading-relaxed max-w-lg mx-auto lg:mx-0">
                Přejděte od základů k opodstatněné sportovní technice a systematickému tréninku.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-end">
              <Link 
                href="https://klub.pkznojmo.cz/registration" 
                className="px-8 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-blue-600/20 text-center flex items-center justify-center gap-3 group"
              >
                <span>Registrace do týmu</span>
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