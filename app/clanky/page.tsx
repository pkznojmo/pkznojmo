'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Sparkles, ArrowRight, Calendar, User, Pin, Plus, Pencil, 
  Loader2, X, Upload, Trash2, Globe, FileText, 
  Bold, Italic, Heading2, List, Link as LinkIcon, Search 
} from 'lucide-react';

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

const CATEGORY_OPTIONS = [
  'Závody',
  'Akce',
  'Zpravodaj',
  'Motivační soutěž'
];

export default function ClankyPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [canManage, setCanManage] = useState<boolean>(false);
  const [isLoadingArticles, setIsLoadingArticles] = useState<boolean>(true);
  const [currentUserName, setCurrentUserName] = useState<string>('');

  // Stav vyhledávání a filtru
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Všechny');

  // Stav modálního okna
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [uploadingCover, setUploadingCover] = useState<boolean>(false);
  const [uploadingGallery, setUploadingGallery] = useState<boolean>(false);

  // Formulářová data
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [authorName, setAuthorName] = useState('');
  const [pin, setPin] = useState(false);
  const [priority, setPriority] = useState(0);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');

  // Reference pro WYSIWYG editor
  const editorRef = useRef<HTMLDivElement>(null);

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
    const checkUserAndRole = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (!user) {
          setCanManage(false);
          return;
        }

        let foundName = user.user_metadata?.full_name || user.user_metadata?.name || '';
        
        let canManageUser = false;
        const metaRole = user.user_metadata?.role;
        const metaRoles = user.user_metadata?.roles;
        const allowedRoles = ['admin', 'marketing'];

        if (typeof metaRole === 'string' && allowedRoles.includes(metaRole.toLowerCase())) {
          canManageUser = true;
        } else if (Array.isArray(metaRoles) && metaRoles.some(r => allowedRoles.includes(String(r).toLowerCase()))) {
          canManageUser = true;
        } else {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (profile) {
            const profileName = profile.full_name || profile.name || [profile.first_name, profile.last_name].filter(Boolean).join(' ');
            if (profileName) foundName = profileName;

            const rolesData = profile.roles || profile.role;
            if (Array.isArray(rolesData)) {
              if (rolesData.some(r => allowedRoles.includes(String(r).toLowerCase()))) {
                canManageUser = true;
              }
            } else if (typeof rolesData === 'string') {
              if (allowedRoles.includes(rolesData.toLowerCase())) {
                canManageUser = true;
              }
            }
            if (profile.is_admin === true || profile.isAdmin === true) {
              canManageUser = true;
            }
          }
        }

        if (foundName) {
          setCurrentUserName(foundName);
        }
        setCanManage(canManageUser);
      } catch (err) {
        console.error('Chyba při ověřování oprávnění:', err);
        setCanManage(false);
      }
    };

    fetchArticles();
    checkUserAndRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUserAndRole();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isModalOpen && editorRef.current) {
      editorRef.current.innerHTML = content || '';
    }
  }, [isModalOpen]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingArticle) {
      const generatedSlug = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generatedSlug);
    }
  };

  const openModal = (article: Article | null = null) => {
    if (article) {
      setEditingArticle(article);
      setTitle(article.title || '');
      setSlug(article.slug || '');
      setExcerpt(article.excerpt || '');
      setContent(article.content || '');
      setCategory(article.category || CATEGORY_OPTIONS[0]);
      setAuthorName(article.author_name || currentUserName || '');
      setPin(article.pin || false);
      setPriority(article.priority || 0);
      setCoverImageUrl(article.cover_image_url || article.image || '');
      setGalleryUrls(article.gallery_urls || []);
      setMetaTitle(article.meta_title || '');
      setMetaDescription(article.meta_description || '');
      setMetaKeywords(article.meta_keywords || '');
      setCanonicalUrl(article.canonical_url || '');
    } else {
      setEditingArticle(null);
      setTitle('');
      setSlug('');
      setExcerpt('');
      setContent('');
      setCategory(CATEGORY_OPTIONS[0]);
      setAuthorName(currentUserName || '');
      setPin(false);
      setPriority(0);
      setCoverImageUrl('');
      setGalleryUrls([]);
      setMetaTitle('');
      setMetaDescription('');
      setMetaKeywords('');
      setCanonicalUrl('');
    }
    setIsModalOpen(true);
  };

  const formatText = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleLinkInsert = () => {
    const url = prompt('Zadejte URL adresu odkazu (např. https://www.youtube.com/...):');
    if (url) {
      document.execCommand('createLink', false, url);
      if (editorRef.current) {
        setContent(editorRef.current.innerHTML);
      }
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      setUploadingCover(true);
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('article-covers')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('article-covers')
        .getPublicUrl(fileName);

      setCoverImageUrl(publicUrl);
    } catch (err: any) {
      console.error('Chyba při nahrávání krycího obrázku:', err);
      alert('Chyba při nahrávání obrázku: ' + (err.message || err));
    } finally {
      setUploadingCover(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      setUploadingGallery(true);
      const files = Array.from(e.target.files);
      const newUrls: string[] = [];

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('article-galleries')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('article-galleries')
          .getPublicUrl(fileName);

        newUrls.push(publicUrl);
      }

      setGalleryUrls(prev => [...prev, ...newUrls]);
    } catch (err: any) {
      console.error('Chyba při nahrávání galerie:', err);
      alert('Chyba při nahrávání galerie: ' + (err.message || err));
    } finally {
      setUploadingGallery(false);
    }
  };

  const removeGalleryImage = (indexToRemove: number) => {
    setGalleryUrls(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      alert('Vyplňte prosím Titulek a Slug.');
      return;
    }

    setIsSaving(true);
    try {
      const finalContent = editorRef.current ? editorRef.current.innerHTML : content;

      const articleData = {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim() || null,
        content: finalContent || null,
        category: category || null,
        author_name: authorName.trim() || currentUserName || null,
        pin,
        priority: Number(priority),
        cover_image_url: coverImageUrl || null,
        image: coverImageUrl || null,
        gallery_urls: galleryUrls.length > 0 ? galleryUrls : null,
        meta_title: metaTitle.trim() || null,
        meta_description: metaDescription.trim() || null,
        meta_keywords: metaKeywords.trim() || null,
        canonical_url: canonicalUrl.trim() || null,
      };

      if (editingArticle) {
        const { error } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', editingArticle.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('articles')
          .insert([articleData]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchArticles();
    } catch (err: any) {
      console.error('Chyba při ukládání článku:', err);
      alert('Chyba při ukládání článku: ' + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteArticle = async () => {
    if (!editingArticle) return;
    if (!confirm('Opravdu chcete tento článek trvale smazat?')) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', editingArticle.id);

      if (error) throw error;

      setIsModalOpen(false);
      fetchArticles();
    } catch (err: any) {
      console.error('Chyba při mazání článku:', err);
      alert('Chyba při mazání článku: ' + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  // Filtrování článků podle kategorie a vyhledávacího dotazu (hledá v nadpisu, perexu i obsahu)
  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory === 'Všechny' || article.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesCategory;

    const titleMatch = article.title?.toLowerCase().includes(query) || false;
    const excerptMatch = article.excerpt?.toLowerCase().includes(query) || false;
    const contentMatch = article.content?.toLowerCase().includes(query) || false;

    return matchesCategory && (titleMatch || excerptMatch || contentMatch);
  });

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

      {/* VYHLEDÁVÁNÍ A KATEGORIE */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full mt-2 relative z-20">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Vyhledat"
              className="w-full pl-11 pr-10 py-3 rounded-2xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {canManage && (
            <div className="">
              <button
                onClick={() => openModal(null)}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3.5 font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 hover:scale-105 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>Přidat článek</span>
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setSelectedCategory('Všechny')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === 'Všechny'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Všechny
            </button>
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>
      </section>

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
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-16 bg-white/60 backdrop-blur-md rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-slate-500 text-lg">Žádné články neodpovídají zadanému vyhledávání nebo filtru.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('Všechny'); }}
              className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Zrušit filtry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((article) => {
              const imageUrl = article.cover_image_url || article.image;
              const formattedDate = article.created_at 
                ? new Date(article.created_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
                : null;

              return (
                <div
                  key={article.id}
                  className="group flex flex-col bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative"
                >
                  {article.pin && (
                    <div className="absolute top-4 left-4 z-10 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md">
                      <Pin className="h-3.5 w-3.5 fill-current" />
                      <span>Připnuto</span>
                    </div>
                  )}

                  {canManage && (
                    <button
                      onClick={() => openModal(article)}
                      title="Upravit článek"
                      className="absolute top-4 right-4 z-20 bg-white/90 hover:bg-blue-600 hover:text-white text-slate-700 p-2.5 rounded-full shadow-md backdrop-blur-md transition-all cursor-pointer"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}

                  <Link href={`/clanky/${article.slug}`} className="flex flex-col flex-grow">
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

      {/* MODÁLNÍ OKNO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                {editingArticle ? 'Upravit článek' : 'Přidat nový článek'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/50 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="p-6 overflow-y-auto flex-grow space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Titulek *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Např. Jarní soustředění v Brně"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Slug (URL) *</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="jarni-soustredeni-v-brne"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Kategorie</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all cursor-pointer"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Autor</label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Tomáš Dufek"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Priorita</label>
                  <input
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 py-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pin}
                    onChange={(e) => setPin(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-bold text-slate-700">Připnout na začátek (Pin)</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Úvodní obrázek (Cover)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="https://... nebo nahrajte soubor"
                    className="flex-grow rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 outline-none"
                  />
                  <label className="inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2 text-sm font-bold text-slate-700 cursor-pointer transition-colors">
                    {uploadingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    <span>Nahrát</span>
                    <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                  </label>
                </div>
                {coverImageUrl && (
                  <div className="mt-3 relative w-32 h-32 rounded-xl overflow-hidden border border-slate-200">
                    <img src={coverImageUrl} alt="Náhled" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Perex (krátký úvod)</label>
                <textarea
                  rows={2}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Stručné shrnutí článku..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Hlavní obsah (Vizuální editor)</label>
                
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <div className="flex flex-wrap items-center gap-1 bg-slate-50 border-b border-slate-200 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => formatText('bold')}
                      title="Tučně"
                      className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      <Bold className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => formatText('italic')}
                      title="Kurzíva"
                      className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      <Italic className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => formatText('formatBlock', '<h2>')}
                      title="Nadpis"
                      className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      <Heading2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => formatText('insertUnorderedList')}
                      title="Odrážkový seznam"
                      className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleLinkInsert}
                      title="Vložit odkaz"
                      className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      <LinkIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={(e) => setContent(e.currentTarget.innerHTML)}
                    className="w-full min-h-[220px] max-h-[400px] overflow-y-auto p-4 text-sm focus:outline-none prose max-w-none"
                    style={{ wordBreak: 'break-word' }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Galerie obrázků</label>
                  <label className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer">
                    {uploadingGallery ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    <span>Přidat do galerie</span>
                    <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
                  </label>
                </div>
                {galleryUrls.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {galleryUrls.map((url, index) => (
                      <div key={index} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-50">
                        <img src={url} alt={`Galerie ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(index)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Zatím nebyly přidány žádné obrázky do galerie.</p>
                )}
              </div>

              <div className="border-t border-slate-100 pt-6 space-y-4">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-cyan-500" />
                  SEO Nastavení
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Meta Title</label>
                    <input
                      type="text"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Canonical URL</label>
                    <input
                      type="text"
                      value={canonicalUrl}
                      onChange={(e) => setCanonicalUrl(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Meta Description</label>
                  <textarea
                    rows={2}
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Meta Keywords</label>
                  <input
                    type="text"
                    value={metaKeywords}
                    onChange={(e) => setMetaKeywords(e.target.value)}
                    placeholder="plavání, znojmo, závody..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div>
                  {editingArticle && (
                    <button
                      type="button"
                      onClick={handleDeleteArticle}
                      disabled={isSaving}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 font-bold text-sm text-red-600 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Smazat článek</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Zrušit
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 font-bold text-sm text-white hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>{editingArticle ? 'Uložit změny' : 'Vytvořit článek'}</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}