'use client';

import Link from 'next/link';
import { 
  Sparkles, CheckCircle2, Clock, MapPin, 
  ShieldCheck, ArrowLeft, ChevronRight, MessageSquare, 
  Award, HeartPulse, Compass, Users
} from "lucide-react";

export default function DruzstvoCPage() {
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
                <Sparkles size={14} /> Plavecká přípravka
              </div>
              
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[1.05]">
                Přípravka <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400">
                  Družstvo C
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-slate-500 font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Výuka 3 základních stylů – znak, prsa, kraul. V tomto družstvu se z dětí stávají skuteční plavci se správnou technikou dýchání a radostí z pohybu.
              </p>

              <div className="pt-4 flex flex-wrap gap-4 justify-center lg:justify-start text-xs font-black uppercase tracking-wider text-slate-500">
                <span className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100">
                  <Award className="text-blue-500" size={18} /> Základy 3 stylů
                </span>
                <span className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100">
                  <Users className="text-emerald-500" size={18} /> Malé skupinky
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
                    7.500 <span className="text-2xl font-bold text-slate-400">Kč</span>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mt-2">
                    Za školní rok
                  </div>
                </div>

                <div className="space-y-3 pt-6 border-t border-slate-100 text-left text-xs font-medium text-slate-600">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={16} />
                    <span>Trénink 2× týdně podle zvolené dvojice dnů</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={16} />
                    <span>Individuální dohled kvalifikovaných trenérů</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={16} />
                    <span>Kapacita skupin je z důvodu kvality omezená</span>
                  </div>
                </div>

                <a 
                  href="https://klub.pkznojmo.cz/registration" 
                  className="mt-8 w-full block py-4 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-colors shadow-lg shadow-slate-900/10"
                >
                  Přihlásit se do Céček
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
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Pozornost každému dítěti</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              Trénujeme v malých skupinkách, kde má trenér o každém dítěti neustálý přehled. Individuální přístup nám umožňuje hlídat bezpečnost i správnou techniku všech plavců.
            </p>
          </div>

          <div className="bg-emerald-50/50 border-2 border-emerald-100 p-8 rounded-[2.5rem] relative group hover:-translate-y-1 transition-transform">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm text-emerald-500">
              <HeartPulse size={28} />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Zdravý vývoj</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              Plavání je nejlepší prevencí vadného držení těla a přirozeně posiluje imunitu dětí. Pravidelný pohyb ve vodě navíc buduje jejich kondici a zdravé návyky do života.
            </p>
          </div>

          <div className="bg-cyan-50/50 border-2 border-cyan-100 p-8 rounded-[2.5rem] relative group hover:-translate-y-1 transition-transform">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm text-cyan-500">
              <Compass size={28} />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Od koupání k plavání</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              Už žádné pouhé „hraní si“ ve vodě. V dětech probouzíme sportovního ducha. Vedeme je k tomu, aby v bazénu hledaly radost z vlastního zlepšení a objevování svého talentu.
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
                Tréninkové kombinace
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight mt-3">
                Jak trénujeme?
              </h2>
              <p className="text-slate-500 text-sm mt-2 max-w-xl">
                Vyberte si kombinaci 2 dnů v týdnu podle pokročilosti vašeho dítěte. Všechny tréninky Družstva C probíhají na Bazénu Louka.
              </p>
            </div>
            
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shrink-0">
              <MapPin size={16} className="text-blue-500" /> Místo: Bazén Louka
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* C POKROČILÍ */}
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                    Vyšší úroveň
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mt-1">
                    C – Pokročilí
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-400">2× týdně</span>
              </div>

              <div className="space-y-4">
                {/* Po + St */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-black text-sm uppercase text-slate-900 block">Pondělí + Středa</span>
                    <span className="text-[11px] font-semibold text-slate-400">Pravidelná dvojice dnů</span>
                  </div>
                  <div className="flex flex-col gap-1 text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg border border-slate-200">
                      <Clock size={13} className="text-blue-500" /> Po: 17:30 – 18:30
                    </span>
                    <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg border border-slate-200">
                      <Clock size={13} className="text-blue-500" /> St: 16:30 – 17:30
                    </span>
                  </div>
                </div>

                {/* Út + Čt */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-black text-sm uppercase text-slate-900 block">Úterý + Čtvrtek</span>
                    <span className="text-[11px] font-semibold text-slate-400">Pravidelná dvojice dnů</span>
                  </div>
                  <div className="flex flex-col gap-1 text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg border border-slate-200">
                      <Clock size={13} className="text-blue-500" /> Út: 17:30 – 18:30
                    </span>
                    <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg border border-slate-200">
                      <Clock size={13} className="text-blue-500" /> Čt: 17:30 – 18:30
                    </span>
                  </div>
                </div>

                {/* St + Pá */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-black text-sm uppercase text-slate-900 block">Středa + Pátek</span>
                    <span className="text-[11px] font-semibold text-slate-400">Pravidelná dvojice dnů</span>
                  </div>
                  <div className="flex flex-col gap-1 text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg border border-slate-200">
                      <Clock size={13} className="text-blue-500" /> St: 16:30 – 17:30
                    </span>
                    <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg border border-slate-200">
                      <Clock size={13} className="text-blue-500" /> Pá: 16:30 – 17:30
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* C ZAČÁTEČNÍCI */}
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                    Základní výuka
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mt-1">
                    C – Začátečníci
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-400">2× týdně</span>
              </div>

              <div className="space-y-4">
                {/* Po + Čt */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-black text-sm uppercase text-slate-900 block">Pondělí + Čtvrtek</span>
                    <span className="text-[11px] font-semibold text-slate-400">Pravidelná dvojice dnů</span>
                  </div>
                  <div className="flex flex-col gap-1 text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg border border-slate-200">
                      <Clock size={13} className="text-emerald-500" /> Po: 17:30 – 18:30
                    </span>
                    <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg border border-slate-200">
                      <Clock size={13} className="text-emerald-500" /> Čt: 17:30 – 18:30
                    </span>
                  </div>
                </div>

                {/* Út + Pá */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-black text-sm uppercase text-slate-900 block">Úterý + Pátek</span>
                    <span className="text-[11px] font-semibold text-slate-400">Pravidelná dvojice dnů</span>
                  </div>
                  <div className="flex flex-col gap-1 text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg border border-slate-200">
                      <Clock size={13} className="text-emerald-500" /> Út: 17:30 – 18:30
                    </span>
                    <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg border border-slate-200">
                      <Clock size={13} className="text-emerald-500" /> Pá: 16:30 – 17:30
                    </span>
                  </div>
                </div>

                {/* St + Pá */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-black text-sm uppercase text-slate-900 block">Středa + Pátek</span>
                    <span className="text-[11px] font-semibold text-slate-400">Pravidelná dvojice dnů</span>
                  </div>
                  <div className="flex flex-col gap-1 text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg border border-slate-200">
                      <Clock size={13} className="text-emerald-500" /> St: 17:30 – 18:30
                    </span>
                    <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg border border-slate-200">
                      <Clock size={13} className="text-emerald-500" /> Pá: 15:30 – 16:30
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* NOTICE BANNER */}
          <div className="mt-8 p-6 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <ShieldCheck size={24} />
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              <strong>Kapacita jednotlivých termínů je omezená</strong> pro zachování maximální kvality a bezpečnosti výuky. Doporučujeme včasnou rezervaci v  registračního systému EOS.
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
                Připojte se k <span className="text-blue-500">Céčku!</span>
              </h2>
              <p className="text-slate-400 text-base font-medium italic leading-relaxed max-w-lg mx-auto lg:mx-0">
                Od prostého „čachtání“ se u nás děti posunou k základní technice tří plaveckých způsobů – kraulu, znaku i prsou.
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