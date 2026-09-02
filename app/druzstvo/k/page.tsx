'use client';

import Link from 'next/link';
import { 
  Sparkles, CheckCircle2, Clock, MapPin, 
  ArrowLeft, ChevronRight, MessageSquare, 
  Heart, Shield, Info, Dumbbell, Waves, Users
} from "lucide-react";

export default function DruzstvoKPage() {
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
                <Sparkles size={14} /> Kondiční plavání
              </div>
              
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[1.05]">
                Kondiční plavání <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400">
                  Družstvo AK/BK
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-slate-500 font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Pro plavce, kteří chtějí zůstat v kondici a v partě bez tlaku na výkon. Ideální volba pro studenty a pracující.
              </p>

              <div className="pt-4 flex flex-wrap gap-4 justify-center lg:justify-start text-xs font-black uppercase tracking-wider text-slate-500">
                <span className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100">
                  <Waves className="text-blue-500" size={18} /> AK (Pokročilí) & BK (Středně pokročilí)
                </span>
                <span className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100">
                  <Heart className="text-emerald-500" size={18} /> Bez stresu a tlaku na medaile
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
                    <span>Udržení skvělé fyzické kondice v profi drahách</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={16} />
                    <span>Tréninky bez povinné suché přípravy</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={16} />
                    <span>Možnost dobrovolné účasti na závodních akcích</span>
                  </div>
                </div>

                <a 
                  href="https://klub.pkznojmo.cz/registration" 
                  className="mt-8 w-full block py-4 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-colors shadow-lg shadow-slate-900/10"
                >
                  Registrace do Kondičky
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. SUB-GROUPS OVERVIEW (AK & BK) */}
      <section className="py-12 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Skupiny družstva K
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight mt-3">
            Rozdělení na AK a BK
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* AK CARD */}
          <div className="bg-white border-2 border-slate-100 p-8 rounded-[2.5rem] shadow-xl shadow-slate-100 relative flex flex-col justify-between hover:border-blue-200 transition-all">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                    Pokročilí
                  </span>
                  <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight mt-2">
                    AK
                  </h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kondiční plavci A</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Waves size={24} />
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed font-normal mb-6">
                Určeno pro ex-plavce skupin A1–A3. Zaměřeno na zachování vysoké plavecké vytrvalosti a správné techniky.
              </p>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 mb-6 text-xs font-bold text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Tréninky:</span>
                  <span>Úterý & Čtvrtek (17:30 – 18:30)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Místo:</span>
                  <span>Bazén Louka</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
              <span className="text-[10px] font-black uppercase bg-blue-50 text-blue-600 px-3 py-1 rounded-full">Ex-A1 až A4</span>
              <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-600 px-3 py-1 rounded-full">Vysoká kondice</span>
            </div>
          </div>

          {/* BK CARD */}
          <div className="bg-white border-2 border-slate-100 p-8 rounded-[2.5rem] shadow-xl shadow-slate-100 relative flex flex-col justify-between hover:border-blue-200 transition-all">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                    Středně pokročilí
                  </span>
                  <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight mt-2">
                    BK
                  </h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kondiční plavci B</p>
                </div>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Users size={24} />
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed font-normal mb-6">
                Určeno pro ex-plavce skupin B1–B2. Zaměřeno na zdokonalování techniky a udržovací kondiční trénink.
              </p>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 mb-6 text-xs font-bold text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Tréninky:</span>
                  <span>Úterý & Čtvrtek (17:30 – 18:30)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Místo:</span>
                  <span>Bazén Louka</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
              <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full">Ex-B1 až B2</span>
              <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-600 px-3 py-1 rounded-full">Kondice & Technika</span>
            </div>
          </div>

        </div>
      </section>

      {/* 3. HARMONOGRAM TRÉNINKŮ */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <div className="bg-slate-50 rounded-[3rem] p-8 sm:p-12 border border-slate-200">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                Tréninkový rozvrh
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight mt-3">
                Harmonogram tréninků AK & BK
              </h2>
            </div>
            
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shrink-0">
              <MapPin size={16} className="text-blue-500" /> Místo: Bazén Louka
            </div>
          </div>

          {/* SCHEDULE CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            
            {/* ÚTERÝ */}
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                    Pravidelný termín
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mt-1">
                    Úterý
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-400">AK i BK</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-black text-sm uppercase text-slate-900 block">AK & BK Společně</span>
                  <span className="text-[11px] font-semibold text-slate-400">Bazén Louka</span>
                </div>
                <span className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-blue-600">
                  <Clock size={14} /> 17:30 – 18:30
                </span>
              </div>
            </div>

            {/* ČTVRTEK */}
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                    Pravidelný termín
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mt-1">
                    Čtvrtek
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-400">AK i BK</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-black text-sm uppercase text-slate-900 block">AK & BK Společně</span>
                  <span className="text-[11px] font-semibold text-slate-400">Bazén Louka</span>
                </div>
                <span className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-blue-600">
                  <Clock size={14} /> 17:30 – 18:30
                </span>
              </div>
            </div>

          </div>

          {/* ADDITIONAL INFORMATION BANNER */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="p-6 bg-white rounded-2xl border border-slate-200 flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                <Info size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">Startovné na závodech</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Účast na závodech je zcela dobrovolná. Klub provádí administraci přihlášek, ale startovné si plavec hradí individuálně.
                </p>
              </div>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                <Dumbbell size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">Bez suché přípravy</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Kondiční sekce K se zaměřuje výhradně na plavání ve vodě. Cvičení v tělocvičně není součástí tohoto programu.
                </p>
              </div>
            </div>

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
                Kondiční sekce
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight uppercase italic tracking-tighter">
                Zůstaň v kondici s <span className="text-blue-500">Káčkem!</span>
              </h2>
              <p className="text-slate-400 text-base font-medium italic leading-relaxed max-w-lg mx-auto lg:mx-0">
                Užij si plavání v profi drahách bez tlaku na medaile. Ideální volba pro studenty a pracující.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-end">
              <Link 
                href="https://klub.pkznojmo.cz/registration" 
                className="px-8 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-blue-600/20 text-center flex items-center justify-center gap-3 group"
              >
                <span>Registrace do Kondičky</span>
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