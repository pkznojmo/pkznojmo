import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { Article } from '../page'; // Případně si rozhraní upravte podle umístění

interface PageProps {
  params: Promise<{ slug: string }>;
}

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

async function getArticle(slug: string): Promise<Article | null> {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from('articles') // Pokud máte v DB tabulku 'acticles', změňte zde
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Article;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return {
      title: 'Článek nenalezen | PK Znojmo',
    };
  }

  const imageUrl = article.cover_image_url || article.image;

  return {
    title: article.meta_title || `${article.title} | PK Znojmo`,
    description: article.meta_description || article.excerpt || 'Přečtěte si článek z Plaveckého klubu Znojmo.',
    keywords: article.meta_keywords || undefined,
    alternates: {
      canonical: article.canonical_url || undefined,
    },
    openGraph: {
      title: article.meta_title || article.title,
      description: article.meta_description || article.excerpt || '',
      type: 'article',
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
  };
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const imageUrl = article.cover_image_url || article.image;
  const formattedDate = article.created_at 
    ? new Date(article.created_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

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
      {/* 1. TLAČÍTKO ZPĚT */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-10">
        <Link 
          href="/clanky"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200/60 shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Zpět na přehled článků</span>
        </Link>
      </div>

      {/* 2. HLAVNÍ OBSAH ČLÁNKU */}
      <article className="mx-auto max-w-4xl px-4 sm:px-6 mt-8">
        {/* Kategorie, datum, autor */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {article.category && (
            <span className="rounded-full bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-700 border border-blue-100 shadow-sm">
              {article.category}
            </span>
          )}
          {formattedDate && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>{formattedDate}</span>
            </div>
          )}
          {article.author_name && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <User className="h-4 w-4 text-slate-400" />
              <span>{article.author_name}</span>
            </div>
          )}
        </div>

        {/* Titulek */}
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-6">
          {article.title}
        </h1>

        {/* Perex / Excerpt */}
        {article.excerpt && (
          <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed mb-8 bg-white/60 backdrop-blur-sm p-6 rounded-3xl border border-slate-100 shadow-sm">
            {article.excerpt}
          </p>
        )}

        {/* Náhledový obrázek (cover) */}
        {imageUrl && (
          <div className="relative aspect-[16/9] w-full rounded-3xl overflow-hidden shadow-lg mb-10 bg-slate-100 border border-slate-100">
            <img
              src={imageUrl}
              alt={article.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Samotný obsah článku (vykresluje HTML uložené v DB) */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-sm mb-12">
          <div 
            className="prose prose-blue max-w-none text-slate-700 leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{ __html: article.content || '' }}
          />
        </div>

        {/* Fotogalerie (pokud jsou k dispozici gallery_urls) */}
        {article.gallery_urls && article.gallery_urls.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-black text-slate-900 mb-6">Fotogalerie</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {article.gallery_urls.map((url, index) => (
                <div key={index} className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md bg-slate-100 border border-slate-100">
                  <img
                    src={url}
                    alt={`Fotografie z galerie ${index + 1}`}
                    className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}