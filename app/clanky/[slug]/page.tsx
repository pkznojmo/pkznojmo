'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Tag, 
  ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';

interface ArticleDetail {
  id: string;
  slug: string;
  title: string;
  perex: string;
  content: string;
  category: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  gallery_urls: string[] | null;
  published_at: string | null;
  reading_time_minutes: number | null;
}

export default function ClanekDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  useEffect(() => {
    async function fetchArticle() {
      if (!slug) return;
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('slug', slug)
          .eq('published', true)
          .single();

        if (error || !data) {
          setArticle(null);
        } else {
          setArticle(data as ArticleDetail);
        }
      } catch (err) {
        console.error('Chyba při načítání detailu článku:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchArticle();
  }, [slug]);

  // Klávesové zkratky pro Lightbox (Šipky + Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeImageIndex === null || !article?.gallery_urls) return;

      if (e.key === 'Escape') {
        setActiveImageIndex(null);
      } else if (e.key === 'ArrowLeft') {
        setActiveImageIndex((prev) => 
          prev !== null ? (prev === 0 ? article.gallery_urls!.length - 1 : prev - 1) : null
        );
      } else if (e.key === 'ArrowRight') {
        setActiveImageIndex((prev) => 
          prev !== null ? (prev === article.gallery_urls!.length - 1 ? 0 : prev + 1) : null
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeImageIndex, article]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Načítám článek...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    notFound();
  }

  const formattedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('cs-CZ', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div 
      className="min-h-screen bg-white pb-24 overflow-x-hidden"
      style={{
        backgroundImage: `
          radial-gradient(circle at 80% 8%, rgba(186, 230, 253, 0.35) 0%, transparent 45%),
          radial-gradient(circle at 10% 15%, rgba(191, 219, 254, 0.25) 0%, transparent 40%)
        `
      }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-12">
        
        {/* Tlačítko Zpět */}
        <Link
          href="/clanky"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Zpět na přehled článků
        </Link>

        {/* Kategorie & Meta badges */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {article.category && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-100 uppercase tracking-wider">
              <Tag className="h-3 w-3 text-cyan-600" />
              {article.category}
            </span>
          )}

          {formattedDate && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Calendar className="h-3.5 w-3.5 text-sky-500" />
              {formattedDate}
            </span>
          )}

          {article.reading_time_minutes && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Clock className="h-3.5 w-3.5 text-sky-500" />
              {article.reading_time_minutes} min čtení
            </span>
          )}
        </div>

        {/* Hlavní Nadpis */}
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.15] mb-6">
          {article.title}
        </h1>

        {/* Perex */}
        <p className="text-lg sm:text-xl text-slate-700 font-medium leading-relaxed border-l-4 border-cyan-500 pl-4 py-2 bg-sky-50/50 rounded-r-2xl mb-10">
          {article.perex}
        </p>

        {/* OBSAH ČLÁNKU S NÁHLEDOVÝM OBRÁZKEM */}
        <div className="relative clearfix">
          {article.cover_image_url && (
            <div className="md:float-right md:ml-8 md:mb-6 mb-8 w-full md:w-[340px] max-w-full">
              <div className="relative rounded-2xl overflow-hidden shadow-xl shadow-blue-950/10 border border-sky-100 bg-slate-50">
                <Image
                  src={article.cover_image_url}
                  alt={article.cover_image_alt || article.title}
                  width={340}
                  height={425}
                  priority
                  className="w-full h-auto object-contain rounded-2xl"
                />
              </div>
            </div>
          )}

          {/* Vlastní HTML obsah z editoru */}
          <div 
            className="prose prose-lg max-w-none text-slate-800 leading-relaxed font-normal
              prose-headings:font-bold prose-headings:text-slate-900 
              prose-p:text-slate-800 prose-p:leading-relaxed prose-p:mb-5
              prose-a:text-blue-600 hover:prose-a:text-blue-700 
              prose-strong:text-slate-900 prose-strong:font-bold
              prose-ul:list-disc prose-ol:list-decimal"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>

        {/* INTERAKTIVNÍ FOTOGALERIE */}
        {article.gallery_urls && article.gallery_urls.length > 0 && (
          <section className="mt-16 pt-12 border-t border-sky-100 clear-both">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-sky-50 text-blue-600 rounded-2xl border border-sky-100">
                <ImageIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">
                  Fotogalerie
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {article.gallery_urls.length} snímků k tomuto článku
                </p>
              </div>
            </div>

            {/* Mřížka snímků */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {article.gallery_urls.map((imgUrl, idx) => (
                <button
                  type="button"
                  key={idx} 
                  onClick={() => setActiveImageIndex(idx)}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-sky-100/80 shadow-sm hover:shadow-lg transition-all cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Image
                    src={imgUrl}
                    alt={`${article.title} - fotka ${idx + 1}`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-blue-900/0 group-hover:bg-blue-900/20 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur-md text-blue-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-md transition-opacity">
                      Zvětšit
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* PATKA DETAILU */}
        <div className="mt-16 pt-8 border-t border-sky-100 flex items-center justify-between clear-both">
          <Link
            href="/clanky"
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Další klubové články
          </Link>
        </div>

      </div>

      {/* LIGHTBOX MODAL / FULLSCREEN NÁHLED FOTKY */}
      {activeImageIndex !== null && article?.gallery_urls && (
        <div className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          
          {/* Zavírací tlačítko */}
          <button
            type="button"
            onClick={() => setActiveImageIndex(null)}
            className="absolute top-5 right-5 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-50"
            title="Zavřít (Esc)"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Posun Vlevo */}
          {article.gallery_urls.length > 1 && (
            <button
              type="button"
              onClick={() => setActiveImageIndex((prev) => 
                prev !== null ? (prev === 0 ? article.gallery_urls!.length - 1 : prev - 1) : null
              )}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-50"
              title="Předchozí fotka"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Zvětšená Fotka */}
          <div className="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center">
            <Image
              src={article.gallery_urls[activeImageIndex]}
              alt={`Fotka ${activeImageIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>

          {/* Posun Vpravo */}
          {article.gallery_urls.length > 1 && (
            <button
              type="button"
              onClick={() => setActiveImageIndex((prev) => 
                prev !== null ? (prev === article.gallery_urls!.length - 1 ? 0 : prev + 1) : null
              )}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-50"
              title="Další fotka"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Počítadlo fotek dole */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-semibold border border-white/10">
            {activeImageIndex + 1} / {article.gallery_urls.length}
          </div>

        </div>
      )}
    </div>
  );
}