import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Award, 
  Sparkles, 
  Handshake, 
  ArrowRight, 
  Mail, 
  Building2, 
  ExternalLink,
  Crown,
  Medal,
  HeartHandshake
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Naši Partneři & Sponzoři | PK Znojmo',
  description: 'Podpořte rozvoj plavání ve Znojmě. Poznejte naše významné partnery a objevte možnosti vzájemné spolupráce.',
  openGraph: {
    title: 'Naši Partneři & Sponzoři | PK Znojmo',
    description: 'Podpořte rozvoj plavání ve Znojmě. Poznejte naše významné partnery a objevte možnosti vzájemné spolupráce.',
    type: 'website',
  },
};

// Typ pro sponzora
interface Sponsor {
  name: string;
  logoUrl?: string;
  websiteUrl?: string;
  description?: string;
}

// Místo pro vaše reálná data (lze v budoucnu napojit např. na Supabase nebo CMS)
const GOLD_SPONSORS: Sponsor[] = [
  // { name: 'Generální Partner', logoUrl: '/sponsors/gold-1.svg', websiteUrl: 'https://example.com' },
];

const SILVER_SPONSORS: Sponsor[] = [
  // { name: 'Stříbrný Partner 1', logoUrl: '/sponsors/silver-1.svg', websiteUrl: 'https://example.com' },
];

const BRONZE_SPONSORS: Sponsor[] = [
  // { name: 'Bronzový Partner 1', logoUrl: '/sponsors/bronze-1.svg', websiteUrl: 'https://example.com' },
];

const OTHER_PARTNERS: Sponsor[] = [
  // { name: 'Město Znojmo', logoUrl: '/sponsors/znojmo.svg', websiteUrl: 'https://www.muznojmo.cz' },
  // { name: 'NSA', logoUrl: '/sponsors/nsa.svg', websiteUrl: 'https://agenturasport.cz' },
];

export default function SponzoriPage() {
  return (
    <div 
      className="min-h-screen bg-white pb-20 overflow-x-hidden"
      style={{
        backgroundImage: `
          radial-gradient(circle at 80% 10%, rgba(186, 230, 253, 0.45) 0%, transparent 45%),
          radial-gradient(circle at 10% 25%, rgba(191, 219, 254, 0.35) 0%, transparent 40%),
          radial-gradient(circle at 90% 65%, rgba(204, 251, 241, 0.3) 0%, transparent 50%)
        `
      }}
    >
      {/* 1. HERO SECTION */}
      <section className="relative pt-16 pb-12 z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-blue-700 shadow-sm border border-blue-100 mb-6 hover:scale-105 transition-transform cursor-default">
            <Handshake className="h-4 w-4 text-cyan-500" />
            <span>Spolupráce & Podpora</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tight max-w-4xl leading-[1.1]">
            Naši <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500">Partneři</span>
          </h1>

          <p className="mt-5 text-base sm:text-xl text-slate-600 max-w-2xl font-normal leading-relaxed">
            Děkujeme všem společnostem, institucím a jednotlivcům, kteří pomáhají rozvíjet plavecký sport ve Znojmě a podporují naši mládež na cestě za úspěchy.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT SECTION */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full relative z-20 space-y-16">

        {/* 2. ZLATÍ SPONZOŘI */}
        <section className="bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent rounded-3xl p-6 sm:p-10 border border-amber-200/60 shadow-xl shadow-amber-500/5">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/30">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Zlatí sponzoři</h2>
              <p className="text-xs sm:text-sm font-semibold text-amber-700">Hlavní partneři Plaveckého klubu Znojmo</p>
            </div>
          </div>

          {GOLD_SPONSORS.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {GOLD_SPONSORS.map((sponsor, idx) => (
                <a
                  key={idx}
                  href={sponsor.websiteUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white rounded-2xl p-8 border border-amber-200/80 shadow-md hover:shadow-xl hover:border-amber-400 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center text-center h-48 relative overflow-hidden"
                >
                  {sponsor.logoUrl ? (
                    <Image
                      src={sponsor.logoUrl}
                      alt={sponsor.name}
                      width={200}
                      height={80}
                      className="max-h-24 w-auto object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                    />
                  ) : (
                    <span className="text-xl font-bold text-slate-800 group-hover:text-amber-600 transition-colors">
                      {sponsor.name}
                    </span>
                  )}
                  <ExternalLink className="absolute top-4 right-4 h-4 w-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
                </a>
              ))}
            </div>
          ) : (
            /* Placeholder když ještě není obsazeno */
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 border border-dashed border-amber-300 text-center flex flex-col items-center justify-center max-w-xl mx-auto py-10">
              <Sparkles className="h-8 w-8 text-amber-500 mb-3 animate-pulse" />
              <h3 className="text-lg font-bold text-slate-900">Staňte se naším Zlatým partnerem</h3>
              <p className="text-sm text-slate-600 mt-1 mb-5">
                Získejte prémiovou viditelnost na všech klubových akcích, dresech i webových stránkách.
              </p>
              <a
                href="#kontakt"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-amber-600 transition-all active:scale-95"
              >
                Mám zájem o generální partnerství
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          )}
        </section>

        {/* 3. STŘÍBRNÍ SPONZOŘI */}
        <section className="bg-gradient-to-b from-slate-200/50 via-slate-100/30 to-transparent rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl shadow-slate-900/5">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-slate-400 text-white rounded-2xl shadow-lg shadow-slate-400/30">
              <Medal className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Stříbrní sponzoři</h2>
              <p className="text-xs sm:text-sm font-semibold text-slate-500">Významní podporovatelé klubových aktivit</p>
            </div>
          </div>

          {SILVER_SPONSORS.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {SILVER_SPONSORS.map((sponsor, idx) => (
                <a
                  key={idx}
                  href={sponsor.websiteUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center text-center h-36"
                >
                  {sponsor.logoUrl ? (
                    <Image
                      src={sponsor.logoUrl}
                      alt={sponsor.name}
                      width={160}
                      height={60}
                      className="max-h-16 w-auto object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                    />
                  ) : (
                    <span className="text-base font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                      {sponsor.name}
                    </span>
                  )}
                </a>
              ))}
            </div>
          ) : (
            <div className="bg-white/60 rounded-2xl p-6 border border-dashed border-slate-300 text-center py-8">
              <p className="text-sm font-medium text-slate-500">
                Místa pro stříbrné partnery jsou aktuálně otevřená pro nové zájemce.
              </p>
            </div>
          )}
        </section>

        {/* 4. BRONZOVÍ SPONZOŘI */}
        <section className="bg-gradient-to-b from-amber-700/10 via-amber-700/5 to-transparent rounded-3xl p-6 sm:p-10 border border-amber-900/10 shadow-xl shadow-amber-900/5">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-amber-700 text-white rounded-2xl shadow-lg shadow-amber-700/30">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Bronzoví sponzoři</h2>
              <p className="text-xs sm:text-sm font-semibold text-amber-900/70">Partnerské firmy a podporovatelé</p>
            </div>
          </div>

          {BRONZE_SPONSORS.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {BRONZE_SPONSORS.map((sponsor, idx) => (
                <a
                  key={idx}
                  href={sponsor.websiteUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white rounded-2xl p-4 border border-amber-900/10 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center text-center h-28"
                >
                  {sponsor.logoUrl ? (
                    <Image
                      src={sponsor.logoUrl}
                      alt={sponsor.name}
                      width={120}
                      height={45}
                      className="max-h-12 w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-slate-700">
                      {sponsor.name}
                    </span>
                  )}
                </a>
              ))}
            </div>
          ) : (
            <div className="bg-white/60 rounded-2xl p-6 border border-dashed border-amber-900/20 text-center py-6">
              <p className="text-xs sm:text-sm font-medium text-slate-500">
                Chcete se stát bronzovým partnerem? Kontaktujte nás pro více informací.
              </p>
            </div>
          )}
        </section>

        {/* 5. DALŠÍ PARTNEŘI & PROGRAMY */}
        <section className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-10 border border-sky-100 shadow-xl shadow-blue-900/5">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Další partneři & Programy</h2>
              <p className="text-xs sm:text-sm font-semibold text-slate-500">Instituce, dotační programy a oficiální podpora</p>
            </div>
          </div>

          {OTHER_PARTNERS.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {OTHER_PARTNERS.map((sponsor, idx) => (
                <a
                  key={idx}
                  href={sponsor.websiteUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-slate-50 rounded-2xl p-4 border border-slate-200 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all duration-300 flex items-center justify-center text-center h-24"
                >
                  {sponsor.logoUrl ? (
                    <Image
                      src={sponsor.logoUrl}
                      alt={sponsor.name}
                      width={100}
                      height={40}
                      className="max-h-10 w-auto object-contain opacity-70 group-hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <span className="text-xs font-bold text-slate-600 group-hover:text-blue-600 transition-colors">
                      {sponsor.name}
                    </span>
                  )}
                </a>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 opacity-50">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                  <span className="text-xs font-bold text-slate-400">Partner / Grant</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 6. CTA SEKCE: STAŇTE SE SOUČÁSTÍ NÁŠHO TÝMU */}
        <section id="kontakt" className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-sky-600 to-cyan-600 p-8 sm:p-14 text-white shadow-2xl shadow-blue-500/20">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-8">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 backdrop-blur-md px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white mb-4">
                <HeartHandshake className="h-4 w-4" />
                Spolupráce s PK Znojmo
              </span>

              <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Staňte se součástí nášho týmu
              </h2>

              <p className="mt-4 text-sky-100 text-base sm:text-xl leading-relaxed max-w-2xl font-normal">
                Podpořte rozvoj plavání ve Znojmě. Máme připravené různé formy spolupráce od lokální podpory až po generální partnerství.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="mailto:info@pkznojmo.cz?subject=Z%C3%A1jem%20o%20partnerstv%C3%AD%20PK%20Znojmo"
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-white px-8 py-4 font-extrabold text-blue-900 hover:bg-sky-50 transition-all active:scale-95 shadow-lg shadow-black/10 text-base"
                >
                  <Mail className="h-5 w-5 text-blue-600" />
                  Napište nám
                  <ArrowRight className="h-5 w-5 ml-1 text-blue-600" />
                </a>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3 border-t lg:border-t-0 lg:border-l border-white/20 pt-6 lg:pt-0 lg:pl-8">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <h4 className="font-bold text-sm text-white">Proč nás podpořit?</h4>
                <ul className="mt-2 text-xs text-sky-100 space-y-1.5">
                  <li>• Prezentace značky na závodech v ČR i v zahraničí</li>
                  <li>• Zviditelnění na klubovém webu a sociálních sítích</li>
                  <li>• Podpora zdravého pohybu dětí a mládeže ve Znojmě</li>
                </ul>
              </div>
            </div>

          </div>

          {/* Vizuální pozadí icony */}
          <div className="absolute right-[-30px] bottom-[-40px] opacity-10 text-[260px] font-black select-none pointer-events-none hidden sm:block">
            🏊‍♂️
          </div>
        </section>

      </div>
    </div>
  );
}