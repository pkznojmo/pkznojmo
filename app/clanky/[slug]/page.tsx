import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { Article } from '../page';

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
    .from('articles')
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
    ? new Date(article.created_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="min-h-screen bg-white text-neutral-900 pb-24">
      
      {/* 1. JEDNODUCHÁ REDAKČNÍ HORNÍ LIŠTA */}
      <div className="border-b border-neutral-200 bg-neutral-50/70 py-3 px-4 sm:px-6 mb-8">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <Link 
            href="/clanky"
            className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Zpět na přehled článků</span>
          </Link>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
            Zpravodajství PK Znojmo
          </span>
        </div>
      </div>

      {/* 2. HLAVNÍ ČLÁNEK (ZPRAVODAJSKÝ FORMÁT) */}
      <article className="mx-auto max-w-3xl px-4 sm:px-6">
        
        {/* Kategorie & Titulek */}
        <div className="space-y-3 mb-4">
          {article.category && (
            <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-red-600 bg-red-50 px-2.5 py-1 rounded">
              {article.category}
            </span>
          )}

          <h1 className="text-3xl sm:text-5xl font-extrabold text-neutral-900 tracking-tight leading-[1.15]">
            {article.title}
          </h1>
        </div>

        {/* Redakční metadata pod titulkem */}
        <div className="flex flex-wrap items-center justify-between border-y border-neutral-200 py-3 my-6 text-xs text-neutral-600 gap-4">
          <div className="flex items-center gap-4">
            {article.author_name && (
              <div className="flex items-center gap-1.5 font-semibold text-neutral-800">
                <User className="h-4 w-4 text-neutral-500" />
                <span>{article.author_name}</span>
              </div>
            )}
            {formattedDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-neutral-500" />
                <span>{formattedDate}</span>
              </div>
            )}
          </div>
        </div>

        {/* PEREX A HLAVNÍ OBRÁZEK VEDLE SEBE (4:5 na výšku) */}
        {(article.excerpt || imageUrl) && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start mb-8">
            {article.excerpt && (
              <div className={`${imageUrl ? 'md:col-span-7' : 'md:col-span-12'}`}>
                <p className="text-lg sm:text-xl font-semibold text-neutral-800 leading-relaxed">
                  {article.excerpt}
                </p>
              </div>
            )}
            {imageUrl && (
              <div className={`${article.excerpt ? 'md:col-span-5' : 'md:col-span-12'}`}>
                <div className="aspect-[4/5] w-full overflow-hidden rounded bg-neutral-100 border border-neutral-200 shadow-sm">
                  <img
                    src={imageUrl}
                    alt={article.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tělo článku (Klasický redakční typografický styl) */}
        <div className="prose prose-neutral max-w-none text-neutral-800 text-base sm:text-lg leading-relaxed 
          prose-headings:font-bold prose-headings:text-neutral-900 
          prose-h2:text-2xl sm:prose-h2:text-3xl prose-h2:mt-8 prose-h2:mb-4 
          prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
          prose-p:mb-5 prose-p:leading-relaxed
          prose-a:text-blue-700 prose-a:underline hover:prose-a:text-blue-900
          prose-strong:text-neutral-900 prose-strong:font-bold
          prose-img:rounded prose-img:my-6"
          dangerouslySetInnerHTML={{ __html: article.content || '' }}
        />

        {/* Fotogalerie */}
        {article.gallery_urls && article.gallery_urls.length > 0 && (
          <div className="mt-12 pt-8 border-t border-neutral-200 space-y-6">
            <h3 className="text-xl font-bold text-neutral-900 tracking-tight">
              Fotogalerie ({article.gallery_urls.length} {article.gallery_urls.length === 1 ? 'snímek' : article.gallery_urls.length < 5 ? 'snímky' : 'snímků'})
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {article.gallery_urls.map((url, index) => (
                <div 
                  key={index} 
                  className="aspect-[4/3] rounded overflow-hidden bg-neutral-100 border border-neutral-200"
                >
                  <img
                    src={url}
                    alt={`Fotografie ${index + 1}`}
                    className="h-full w-full object-cover hover:scale-102 transition-transform duration-300"
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