'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Sparkles, ArrowRight, Calendar, User, Pin, Plus, Pencil, Loader2 } from 'lucide-react';

export interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  category: string | null;
  image: string | null;
  author_name: string | null;
  pin: boolean | null;
  priority: number | null;
  cover_image_url: string | null;
  gallery_urls: string[] | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  canonical_url: string | null;
  created_at: string | null;
}

export default function ClankyPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [canManage, setCanManage] = useState<boolean>(false);
  const [isLoadingArticles, setIsLoadingArticles] = useState<boolean>(true);

  const fetchArticles = async () => {
    try {
      setIsLoadingArticles(true);
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('pin', { ascending: false })
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (!error && data) {
        setArticles(data as Article[]);
      } else {
        setArticles([]);
      }
    } catch (err) {
      console.error('Chyba při načítání článků:', err);
      setArticles([]);
    } finally {
      setIsLoadingArticles(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchArticles();

      try {
        const { data: { session } } = await supabase.auth.getSession();
        let canManageUser = false;

        if (session?.user) {
          // 1. Kontrola v uživatelských metadatech
          const metaRole = session.user.user_metadata?.role;
          const metaRoles = session.user.user_metadata?.roles;
          if (metaRole === 'admin' || metaRole === 'marketing') {
            canManageUser = true;
          } else if (Array.isArray(metaRoles) && (metaRoles.includes('admin') || metaRoles.includes('marketing'))) {
            canManageUser = true;
          } else {
            // 2. Kontrola v tabulce profiles
            const { data: profile } = await supabase
              .from('profiles')
              .select('roles, role')
              .eq('id', session.user.id)
              .maybeSingle();

            if (profile) {
              const rolesData = profile.roles || profile.role;
              if (Array.isArray(rolesData)) {
                if (rolesData.includes('admin') || rolesData.includes('marketing')) {
                  canManageUser = true;
                }
              } else if (typeof rolesData === 'string') {
                if (rolesData === 'admin' || rolesData === 'marketing') {
                  canManageUser = true;
                }
              }
            }
          }
        }
        setCanManage(canManageUser);
      } catch (err) {
        console.error('Chyba při ověřování oprávnění:', err);
      }
    };

    init();
  }, []);

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

          {/* Tlačítko pro přidání článku (pouze pro admin / marketing) */}
          {canManage && (
            <div className="mt-8">
              <Link
                href="/admin/clanky/novy"
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 hover:scale-105 transition-all active:scale-95"
              >
                <Plus className="h-5 w-5" />
                <span>Přidat článek</span>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 2. SEKCE SEZNAMU ČLÁNKŮ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full mt-6 relative z-20">
        {isLoadingArticles ? (
          <div className="flex items-center justify-center py-20 text-blue-600 gap-3">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="font-bold text-sm text-slate-600">Načítám články...</span>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16 bg-white/60 backdrop-blur-md rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-slate-500 text-lg">Zatím zde nejsou publikované žádné články.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => {
              const imageUrl = article.cover_image_url || article.image;
              const formattedDate = article.created_at 
                ? new Date(article.created_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
                : null;

              return (
                <div
                  key={article.id}
                  className="group flex flex-col bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative"
                >
                  {/* Připnutý článek */}
                  {article.pin && (
                    <div className="absolute top-4 left-4 z-10 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md">
                      <Pin className="h-3.5 w-3.5 fill-current" />
                      <span>Připnuto</span>
                    </div>
                  )}

                  {/* Tlačítko úpravy pro admina / marketing */}
                  {canManage && (
                    <Link
                      href={`/admin/clanky/edit/${article.id}`}
                      title="Upravit článek"
                      className="absolute top-4 right-4 z-20 bg-white/90 hover:bg-blue-600 hover:text-white text-slate-700 p-2.5 rounded-full shadow-md backdrop-blur-md transition-all"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                  )}

                  {/* Odkaz na detail článku */}
                  <Link href={`/clanky/${article.slug}`} className="flex flex-col flex-grow">
                    {/* Náhledový obrázek ve formátu 4:5 na výšku */}
                    <div className="relative aspect-[4/5] w-full bg-slate-100 overflow-hidden">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={article.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-4xl">
                          🏊‍♂️
                        </div>
                      )}
                      {article.category && (
                        <span className="absolute bottom-4 left-4 rounded-full bg-white/90 backdrop-blur-md px-3.5 py-1 text-xs font-bold text-blue-700 shadow-sm">
                          {article.category}
                        </span>
                      )}
                    </div>

                    {/* Obsah karty */}
                    <div className="flex flex-col flex-grow p-6">
                      <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                        {formattedDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{formattedDate}</span>
                          </div>
                        )}
                        {article.author_name && (
                          <div className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            <span>{article.author_name}</span>
                          </div>
                        )}
                      </div>

                      <h2 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                        {article.title}
                      </h2>

                      {article.excerpt && (
                        <p className="text-slate-600 text-sm line-clamp-3 mb-6 flex-grow leading-relaxed">
                          {article.excerpt}
                        </p>
                      )}

                      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-blue-600 font-bold text-sm">
                        <span>Číst více</span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. CTA SEKCE */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full mt-16 relative z-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600 p-8 sm:p-12 text-white shadow-xl shadow-blue-500/15">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-block rounded-lg bg-white/25 backdrop-blur-md px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white mb-3">
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