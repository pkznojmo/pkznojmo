import type { Metadata } from 'next';
import { 
  Mail, 
  MapPin, 
  Phone, 
  Send, 
  FileText, 
  Download, 
  Sparkles, 
  HelpCircle,
  User 
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Kontakty | PK Znojmo',
  description: 'Máte-li jakýkoliv dotaz, neváhejte nás kontaktovat. Kontakty na vedení klubu, sídlo a dokumenty ke stažení.',
  openGraph: {
    title: 'Kontakty | PK Znojmo',
    description: 'Máte-li jakýkoliv dotaz, neváhejte nás kontaktovat. Kontakty na vedení klubu, sídlo a dokumenty ke stažení.',
    type: 'website',
  },
};

export default function KontaktyPage() {
  // Předvyplněný mailto odkaz pro rychlý dotaz
  const mailtoSubject = encodeURIComponent('Dotaz – Plavecký klub Znojmo');
  const mailtoBody = encodeURIComponent('Dobrý den,\n\nměl/a bych dotaz ohledně...\n\nDěkuji,\n');
  const mailtoUrl = `mailto:info@pkznojmo.cz?subject=${mailtoSubject}&body=${mailtoBody}`;

  return (
    <div 
      className="min-h-screen bg-white pb-20 overflow-x-hidden text-slate-800"
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
            <Sparkles className="h-4 w-4 text-cyan-500 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Plavecký klub Znojmo z.s.</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tight max-w-4xl leading-[1.1]">
            Kontakty
          </h1>

          <p className="mt-5 text-base sm:text-xl text-slate-600 max-w-2xl font-normal leading-relaxed">
            Tradice, radost a úspěch ve vodě. Máte-li jakýkoliv dotaz, neváhejte nás kontaktovat.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full relative z-20 space-y-12">

        {/* 2. KONTAKTNÍ BUBLINY (Podle obrázku) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
          
          {/* E-mail */}
          <div className="bg-white/90 backdrop-blur-md rounded-[40px] p-8 border border-sky-100 shadow-lg shadow-blue-900/5 flex flex-col items-center justify-center text-center hover:border-blue-300 transition-all aspect-square sm:aspect-auto lg:aspect-square">
            <div className="p-4 bg-sky-50 border border-sky-100/50 text-blue-600 rounded-full mb-6">
              <Mail className="h-8 w-8" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-black text-slate-950 tracking-tight">E-mail</h2>
            <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider mt-1.5 mb-5 block">Oficiální komunikace</span>
            <a 
              href="mailto:info@pkznojmo.cz" 
              className="text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors break-all"
            >
              info@pkznojmo.cz
            </a>
          </div>

          {/* Sídlo */}
          <div className="bg-white/90 backdrop-blur-md rounded-[40px] p-8 border border-sky-100 shadow-lg shadow-blue-900/5 flex flex-col items-center justify-center text-center hover:border-blue-300 transition-all aspect-square sm:aspect-auto lg:aspect-square">
            <div className="p-4 bg-sky-50 border border-sky-100/50 text-blue-600 rounded-full mb-6">
              <MapPin className="h-8 w-8" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-black text-slate-950 tracking-tight">Sídlo</h2>
            <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider mt-1.5 mb-5 block">Adresa klubu</span>
            <p className="text-sm font-bold text-slate-700 leading-relaxed">
              Marušky Kudeříkové 622/8,<br />Znojmo
            </p>
          </div>

          {/* Monika Dufková */}
          <div className="bg-white/90 backdrop-blur-md rounded-[40px] p-8 border border-amber-100/70 shadow-lg shadow-amber-900/5 flex flex-col items-center justify-center text-center hover:border-amber-300 transition-all aspect-square sm:aspect-auto lg:aspect-square">
            <div className="p-4 bg-amber-50 border border-amber-100/50 text-amber-600 rounded-full mb-6">
              <User className="h-8 w-8" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-black text-slate-950 tracking-tight">Ing. Monika Dufková</h2>
            <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider mt-1.5 mb-5 block">Předsedkyně klubu</span>
            <a 
              href="tel:+420777535302" 
              className="text-sm font-bold text-slate-700 hover:text-amber-700 transition-colors"
            >
              +420 777 535 302
            </a>
          </div>

          {/* David Křivan */}
          <div className="bg-white/90 backdrop-blur-md rounded-[40px] p-8 border border-cyan-100/70 shadow-lg shadow-cyan-900/5 flex flex-col items-center justify-center text-center hover:border-cyan-300 transition-all aspect-square sm:aspect-auto lg:aspect-square">
            <div className="p-4 bg-cyan-50 border border-cyan-100/50 text-cyan-600 rounded-full mb-6">
              <User className="h-8 w-8" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-black text-slate-950 tracking-tight">Mgr. David Křivan</h2>
            <span className="text-[10px] font-extrabold text-cyan-600 uppercase tracking-wider mt-1.5 mb-5 block">Hlavní trenér</span>
            <a 
              href="tel:+420724506433" 
              className="text-sm font-bold text-slate-700 hover:text-cyan-700 transition-colors"
            >
              +420 724 506 433
            </a>
          </div>

        </section>

        {/* 3. RYCHLÝ DOTAZ (CTA KARTA) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600 p-8 sm:p-12 text-white shadow-xl shadow-blue-500/15">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-bold uppercase tracking-wider text-white mb-3">
              <HelpCircle className="h-4 w-4" />
              Rychlý dotaz
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Potřebujete se na něco zeptat?
            </h2>
            <p className="mt-3 text-sky-100 text-base sm:text-lg leading-relaxed font-normal">
              Po kliknutí na odeslání se vám otevře e-mail s předvyplněným předmětem a zprávou.
            </p>
            <div className="mt-8">
              <a
                href={mailtoUrl}
                className="inline-flex items-center gap-2.5 rounded-2xl bg-white px-8 py-4 font-extrabold text-blue-900 hover:bg-sky-50 transition-all active:scale-95 shadow-lg shadow-black/10 text-base"
              >
                <Send className="h-5 w-5 text-blue-600" />
                Odeslat dotaz
              </a>
            </div>
          </div>

          <div className="absolute right-[-20px] bottom-[-30px] opacity-15 text-[200px] font-black select-none pointer-events-none hidden sm:block overflow-hidden">
            ✉️
          </div>
        </div>

        {/* 4. DOKUMENTY KE STAŽENÍ */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 sm:p-10 border border-sky-100 shadow-xl shadow-blue-900/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-teal-500 text-white rounded-2xl shadow-md shadow-teal-500/20">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Dokumenty ke stažení</h2>
              <p className="text-xs sm:text-sm font-semibold text-slate-500">Vše potřebné pro členy a rodiče</p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Kartička dokumentu */}
            <a
              href="/dokumenty/posouzeni-zdravotni-zpusobilosti.pdf" 
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-slate-50 hover:bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="truncate">
                  <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                    Žádost o posouzení zdravotní způsobilosti
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-400">Dokument PDF</span>
                </div>
              </div>
              <Download className="h-5 w-5 text-slate-400 group-hover:text-blue-600 shrink-0 transition-colors" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}