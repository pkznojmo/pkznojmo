'use client';

import Link from 'next/link';
import { 
  Trophy, GraduationCap, Baby, Waves, Users, User, 
  ArrowRight, ArrowLeft, MoveDownLeft, MoveDownRight, 
  CheckCircle2, Zap, Info, ChevronRight, Phone, MessageSquare,
  HeartHandshake, Dumbbell, Flame
} from "lucide-react";

interface CardProps {
  id: string;
  name: string;
  target: string;
  Icon: any;
  colorClass: string;
  desc: string;
  badge?: string;
}

function Card({ id, name, target, Icon, colorClass, desc, badge }: CardProps) {
  return (
    <Link
      href={id === 'a' ? '/druzstvo/a' : `/druzstvo/${id}`}
      className={`flex-1 bg-white p-7 sm:p-8 rounded-[2.5rem] border-2 shadow-sm ${colorClass} transition-all duration-500 hover:shadow-2xl hover:shadow-blue-100 hover:-translate-y-2 flex flex-col items-center text-center relative z-10 group h-full justify-between`}
    >
      <div>
        {badge && (
          <span className="absolute top-4 right-4 text-[9px] font-black uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-full text-slate-600 border border-slate-200">
            {badge}
          </span>
        )}
        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm">
          <Icon size={30} strokeWidth={1.75} />
        </div>
        <h3 className="text-xl font-extrabold text-slate-900 mb-1 leading-tight tracking-tight">{name}</h3>
        <p className="text-[10px] font-black uppercase tracking-[0.15em] mb-4 opacity-70 italic">
          {target}
        </p>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
          {desc}
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 w-full flex items-center justify-center gap-1 text-[11px] font-black uppercase tracking-wider text-slate-400 group-hover:text-blue-600 transition-colors">
        <span>Detail družstva</span>
        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}

export default function TeamsPage() {
  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      rose: "border-rose-200 hover:border-rose-500 text-rose-500",
      green: "border-emerald-200 hover:border-emerald-500 text-emerald-600",
      cyan: "border-cyan-200 hover:border-cyan-500 text-cyan-600",
      sky: "border-sky-200 hover:border-sky-500 text-sky-600",
      blue: "border-blue-200 hover:border-blue-500 text-blue-600",
      orange: "border-orange-200 hover:border-orange-500 text-orange-600",
      amber: "border-amber-200 hover:border-amber-500 text-amber-600",
      purple: "border-purple-200 hover:border-purple-500 text-purple-600",
      slate: "border-slate-200 hover:border-slate-500 text-slate-600",
      teal: "border-teal-200 hover:border-teal-500 text-teal-600"
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="bg-white font-sans text-slate-800 pb-20 overflow-x-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative py-20 lg:py-24 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-50/70 via-transparent to-transparent -z-10" />
        <div className="max-w-7xl mx-auto px-6 text-center lg:text-left">
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tighter leading-[1.05]">
            Naše <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400">
              Plavecké družstva
            </span>
          </h1>
          <p className="max-w-2xl text-lg sm:text-xl text-slate-500 leading-relaxed font-normal mx-auto lg:mx-0">
            Máme systém, který dává smysl. Od prvních temp v přípravce až po 
            vrcholové závodní plavání pod vedením profesionálů.
          </p>
        </div>
      </section>

      {/* 2. SCHÉMA METODIKY A NAVAZOVÁNÍ */}
      <section className="py-8 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-black uppercase tracking-widest mb-3 border border-blue-100">
            Metodická návaznost
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight mb-4">
            Cesta plavce klubem
          </h2>
          <div className="flex flex-wrap justify-center gap-6 text-slate-500 text-sm font-medium">
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500" /> Postupný rozvoj</span>
            <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-blue-500" /> Výkonnostní i kondiční větve</span>
          </div>
        </div>

        {/* 1. HLAVNÍ ZÁKLADNÍ VĚTVE (PŘÍPRAVKY -> ZÁVODNÍ) */}
        <div className="mb-12">
          <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 text-center lg:text-left">
            1. Základní výuka & Závodní linie
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 items-stretch">
            
            <div className="flex">
              <Card 
                id="d" name="D s rodiči" target="Základní kurzy" Icon={HeartHandshake} colorClass={getColorClasses('rose')}
                desc="Trenér + děti + rodiče ve vodě. Pro nejmenší od 3 let."
                badge="3+ let"
              />
            </div>

            <div className="flex">
              <Card 
                id="d" name="Družstvo D" target="Základní kurzy" Icon={Baby} colorClass={getColorClasses('green')}
                desc="Trenér + děti ve vodě. První samostatné krůčky bez rodičů."
                badge="Od 4 let"
              />
            </div>

            <div className="flex">
              <Card 
                id="c" name="Družstvo C" target="Přípravka" Icon={GraduationCap} colorClass={getColorClasses('sky')}
                desc="Výuka 3 základních stylů - znak, prsa, kraul a správná technika."
              />
            </div>

            <div className="flex">
              <Card 
                id="b" name="Družstvo B" target="Zdokonalovací" Icon={Flame} colorClass={getColorClasses('blue')}
                desc="Malí závodníci, zdokonalování techniky, obrtek a vytrvalosti."
              />
            </div>

            <div className="flex">
              <Card 
                id="a" name="Družstvo A" target="Závodní" Icon={Trophy} colorClass={getColorClasses('orange')}
                desc="Vrcholový závodní tým. Dvoufázové tréninky a příprava na MČR."
                badge="MČR"
              />
            </div>

          </div>
        </div>

        {/* 2. ALTERNATIVNÍ & KONDIČNÍ STRUKTURA */}
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 text-center lg:text-left">
            2. Kondiční větve & Dospělí (Bez tlaku na závody)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            
            <div className="flex">
              <Card 
                id="i" name="Individuální" target="Pro všechny" Icon={User} colorClass={getColorClasses('slate')}
                desc="Osobní přístup 1 na 1 zaměřený na vaše konkrétní cesty a cíle."
              />
            </div>

            <div className="flex">
              <Card 
                id="h" name="Družstvo H" target="Hobbíci & Dospělí" Icon={Users} colorClass={getColorClasses('teal')}
                desc="Lekce pro dospělé, kteří se chtějí hýbat a zlepšit techniku."
              />
            </div>

            <div className="flex">
              <Card 
                id="k" name="Družstvo AK" target="Kondiční k A" Icon={Zap} colorClass={getColorClasses('purple')}
                desc="Výkonnostně jako družstvo A, ale bez závodního vytížení."
              />
            </div>
            
            <div className="flex">
              <Card 
                id="k" name="Družstvo BK" target="Kondiční k B" Icon={Dumbbell} colorClass={getColorClasses('amber')}
                desc="Výkonnostně jako Družstvo B, ale bez ambice a povinnosti závodit."
              />
            </div>




          </div>
        </div>

      </section>

      {/* 3. JAK SE K NÁM PŘIDAT? (STYLIZOVANÝ SLATE-900 BANNER) */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <div className="bg-slate-900 rounded-[3.5rem] sm:rounded-[4rem] p-8 sm:p-14 lg:p-20 relative overflow-hidden shadow-2xl border-b-8 border-blue-600">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* LEVÁ STRANA: JASNÝ POSTUP */}
            <div className="space-y-10">
              <div className="space-y-4">
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-none uppercase italic tracking-tighter">
                  Jak se k nám <span className="text-blue-500">přidat?</span>
                </h2>
                <p className="text-slate-400 text-base sm:text-lg font-medium italic leading-relaxed">
                  Zařazení do skupin probíhá na základě vašich zkušeností a osobní domluvy s trenérem.
                </p>
              </div>

              <div className="space-y-8 text-white">
                {[
                  { 
                    t: "Konzultace s trenérem", 
                    d: "Po telefonu vyhodnotíme dosavadní dovednosti plavce a doporučíme vhodnou skupinu.", 
                    icon: <Phone className="text-blue-500" /> 
                  },
                  { 
                    t: "První zkušební trénink", 
                    d: "Domluvíme si termín, kdy si plavec trénink nezávazně vyzkouší přímo v bazénu.", 
                    icon: <Waves className="text-blue-500" /> 
                  },
                  { 
                    t: "Finální zařazení", 
                    d: "Na základě zkušebního tréninku potvrdíme zařazení do odpovídajícího družstva.", 
                    icon: <CheckCircle2 className="text-blue-500" /> 
                  }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-5 sm:gap-6 group">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/5 border border-white/10 flex-shrink-0 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-500 transition-all duration-500 shadow-inner">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-lg sm:text-xl font-black text-white uppercase italic tracking-tight mb-1">{item.t}</h4>
                      <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-medium">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PRAVÁ STRANA: KONTAKTNÍ KARTA */}
            <div className="space-y-8">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] relative shadow-inner">
                <div className="flex items-center gap-3 text-blue-400 mb-6">
                  <MessageSquare className="w-6 h-6" />
                  <span className="font-black uppercase text-[10px] tracking-[0.3em]">Konzultace</span>
                </div>
                
                <p className="text-xl sm:text-2xl font-light text-blue-50 leading-relaxed italic mb-8">
                  "Nejefektivnější cesta k pokroku začíná výběrem <span className="text-white font-bold underline decoration-blue-500 uppercase">správné party</span> a odpovídající úrovně."
                </p>
                
                <div className="pt-8 border-t border-white/10">
                  <Link href="/kontakty" className="inline-flex items-center gap-4 text-white group">
                    <span className="bg-blue-600 p-3.5 rounded-xl group-hover:scale-110 transition-transform shadow-lg shadow-blue-600/30">
                      <ChevronRight className="w-5 h-5" />
                    </span>
                    <div className="text-left">
                      <span className="block font-black uppercase text-xs tracking-widest">Máte dotaz k zařazení?</span>
                      <span className="text-slate-400 text-xs sm:text-sm font-bold italic group-hover:text-blue-400 transition-colors uppercase">Kontaktovat trenéra →</span>
                    </div>
                  </Link>
                </div>
              </div>

              <div className="flex items-center gap-4 px-4 opacity-70">
                <Info className="text-blue-500 shrink-0" size={20} />
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest italic leading-tight">
                  Zkušební trénink je nezávazný a slouží k ověření plavecké úrovně.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}