import { MapPin, Phone, Mail, Building2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative bg-white text-slate-700 pt-6">
      {/* WAVE EFEKT NA HORE INTERFACU FOOTERU */}
      <div className="absolute top-[-15px] left-0 w-full overflow-hidden leading-[0] pointer-events-none rotate-180 z-10">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="relative block w-full h-[16px] fill-slate-50"
        >
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
        </svg>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          
          {/* SLOUPEC 1: Název a rejstřík */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏊‍♂️</span>
              <h3 className="font-bold text-lg text-blue-900">
                Plavecký klub Znojmo z.s.
              </h3>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Zapsaný ve spolkovém rejstříku Krajského soudu v Brně, oddíl L, vložka 23204.
            </p>
          </div>

          {/* SLOUPEC 2: Sídlo a IČ */}
          <div className="flex flex-col gap-3 text-sm">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
              Sídlo & Identifikace
            </h4>
            <div className="flex items-start gap-2.5 text-slate-600">
              <MapPin className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <span>Marušky Kudeříkové 622/8, ZNOJMO</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600">
              <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
              <span>IČ: 06441254</span>
            </div>
          </div>

          {/* SLOUPEC 3: Kontakty */}
          <div className="flex flex-col gap-3 text-sm">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
              Kontakt
            </h4>
            <div className="flex flex-col gap-2">
              <a
                href="tel:+420777535302"
                className="inline-flex items-center gap-2.5 text-slate-600 hover:text-blue-600 transition-colors"
              >
                <Phone className="h-4 w-4 text-blue-600 shrink-0" />
                <span>777 535 302</span>
              </a>
              <a
                href="tel:+420724506433"
                className="inline-flex items-center gap-2.5 text-slate-600 hover:text-blue-600 transition-colors"
              >
                <Phone className="h-4 w-4 text-blue-600 shrink-0" />
                <span>724 506 433</span>
              </a>
              <a
                href="mailto:info@pkznojmo.cz"
                className="inline-flex items-center gap-2.5 text-slate-600 hover:text-blue-600 transition-colors"
              >
                <Mail className="h-4 w-4 text-blue-600 shrink-0" />
                <span>info@pkznojmo.cz</span>
              </a>
            </div>
          </div>

        </div>

        {/* SPODNÍ ŘÁDEK */}
        <div className="mt-10 border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Plavecký klub Znojmo z.s. Všechna práva vyhrazena.
        </div>
      </div>
    </footer>
  );
}