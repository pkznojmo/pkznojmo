import type { Metadata } from 'next';
import Link from 'next/link';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Sparkles, ArrowRight } from 'lucide-react';
import ArticlesClient, { Article } from './ArticlesClient';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Blog & Články | PK Znojmo',
  description: 'Přečtěte si nejnovější články, návody, výsledky ze závodů a aktuality z našeho klubu.',
  openGraph: {
    title: 'Blog & Články | PK Znojmo',
    description: 'Přečtěte si nejnovější články, návody, výsledky ze závodů a aktuality z našeho klubu.',
    type: 'website',
  },
};

async function getSupabaseClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

async function getArticles(): Promise<Article[]> {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from('articles')
    .select('id, slug, title, perex, content, category, cover_image_url, gallery_urls, gallery_images, published, published_at, reading_time_minutes, pin_priority, author_name, author_id')
    .eq('published', true)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Chyba při načítání článků ze serveru:', error);
    return [];
  }

  return (data || []) as Article[];
}

export default async function ClankyPage() {
  const articles = await getArticles();

  return (
    <div 
      className="min-h-screen bg-white pb-20 overflow-x-hidden"
      style={{
        backgroundImage: `
          radial-gradient(circle at 80% 10%, rgba(186, 230, 253, 0.45) 0%, transparent 45%),
          radial-gradient(circle at 10% 20%, rgba(191, 219, 254, 0.35) 0%, transparent 40%),
          radial-gradient(circle at 90% 60%, rgba(204, 251, 241, 0.3) 0%, transparent 50%)
        `
      }}
    >
      {/* 1. HERO SECTION */}
      <section className="relative pt-16 pb-12 z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-blue-700 shadow-sm border border-blue-100 mb-6 hover:scale-105 transition-transform cursor-default">
            <Sparkles className="h-4 w-4 text-cyan-500 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Klubové novinky & Magazín</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tight max-w-4xl leading-[1.1]">
            Blog & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500">Články</span>
          </h1>

          <p className="mt-5 text-base sm:text-xl text-slate-600 max-w-2xl font-normal leading-relaxed">
            Objevte nejnovější novinky ze závodů, tréninkové tipy, rozhovory a pohledy do zákulisí Plaveckého klubu Znojmo.
          </p>
        </div>
      </section>

      {/* 2. KLIENTSKÁ SEKCE S FILTRY, ADMIN OVLÁDÁNÍM A ČLÁNKY */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full mt-2 relative z-20">
        <ArticlesClient initialArticles={articles} />
      </section>

      {/* 3. CTA SEKCE */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full mt-16 relative z-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600 p-8 sm:p-12 text-white shadow-xl shadow-blue-500/15">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-block rounded-lg bg-white/20 backdrop-blur-md px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white mb-3">
              Plavecký klub Znojmo
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Chcete se k nám přidat?
            </h2>
            <p className="mt-3 text-sky-100 text-base sm:text-lg leading-relaxed">
              Máme program pro každého – od prvních krůčků ve vodě přes zdokonalovací plavání až po závodní družstva.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/druzstva"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 font-bold text-blue-900 hover:bg-sky-50 transition-all active:scale-95 shadow-md"
              >
                Prohlédnout družstva
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div className="absolute right-[-20px] bottom-[-30px] opacity-15 text-[220px] font-black select-none pointer-events-none hidden sm:block">
            🏊‍♂️
          </div>
        </div>
      </section>

    </div>
  );
}