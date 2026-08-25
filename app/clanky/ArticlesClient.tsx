'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { 
  Calendar, 
  Clock, 
  ArrowRight, 
  BookOpen, 
  Tag, 
  Pin, 
  Search, 
  Filter, 
  ArrowUpDown,
  X,
  ChevronDown,
  Check,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Lock,
  Upload,
  Bold,
  Italic,
  Underline,
  Heading2,
  List,
  ListOrdered,
  Image as ImageIcon
} from 'lucide-react';

export interface Article {
  id: string;
  slug: string;
  title: string;
  perex: string;
  content?: string | null;
  category: string | null;
  cover_image_url: string | null;
  gallery_urls?: string[] | null;
  gallery_images?: string[] | null;
  published: boolean;
  published_at: string | null;
  reading_time_minutes: number | null;
  pin_priority: number;
  author_name?: string | null;
  author_id?: string | null;
}

interface ArticlesClientProps {
  initialArticles: Article[];
}

const CATEGORY_OPTIONS = [
  'Akce',
  'Závody',
  'Zpravodaj',
  'Motivační soutěž'
];

function normalizeText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function generateSlug(text: string): string {
  return normalizeText(text)
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export default function ArticlesClient({ initialArticles }: ArticlesClientProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Stavy pro oprávnění a autora
  const [canEdit, setCanEdit] = useState<boolean>(false);

  // Stavy pro editor článku
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploadingCover, setIsUploadingCover] = useState<boolean>(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState<boolean>(false);

  // Stavy pro custom dropdowny
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const categoryRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);


  // Načtení veřejných článků (fallback pro případ, že server vrátil prázdné data)
  const fetchPublicArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('id, slug, title, perex, content, category, cover_image_url, gallery_urls, gallery_images, published, published_at, reading_time_minutes, pin_priority, author_name, author_id')
        .eq('published', true)
        .order('published_at', { ascending: false });

      if (!error && data) {
        setArticles(data as Article[]);
      }
    } catch (err) {
      console.error('Chyba při načítání veřejných článků:', err);
    }
  };

  // Kontrola rolí uživatele a spárování s načítáním
  useEffect(() => {
    const checkPermissionsAndLoad = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('roles')
            .eq('id', session.user.id)
            .single();

          if (!error && data && Array.isArray(data.roles)) {
            const hasAccess = data.roles.includes('admin') || data.roles.includes('marketing');
            setCanEdit(hasAccess);

            if (hasAccess) {
              await fetchArticlesForEditor();
              return;
            }
          }
        }

        // Pokud jde o anonymního uživatele (nebo běžného čtenáře) a ze serveru nepřišly články, načteme je na klientu
        if (initialArticles.length === 0) {
          await fetchPublicArticles();
        }
      } catch (err) {
        console.error('Chyba při kontrole oprávnění:', err);
      }
    };

    checkPermissionsAndLoad();
  }, []);
  
  // Kontrola rolí uživatele
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return; // <-- TADY TO SKONČÍ PRO ANONYMY!

        const { data, error } = await supabase
          .from('profiles')
          .select('roles')
          .eq('id', session.user.id)
          .single();

        if (!error && data && Array.isArray(data.roles)) {
          const hasAccess = data.roles.includes('admin') || data.roles.includes('marketing');
          setCanEdit(hasAccess);
          if (hasAccess) {
            fetchArticlesForEditor(); // <-- Kód přepíše články jen pokud je uživatel admin/marketing!
          }
        }
      } catch (err) {
        console.error('Chyba při kontrole oprávnění:', err);
      }
    };

    checkPermissions();
  }, []);

  // Načítání pro editor (sloupec cover_image_alt odstraněn, opravená chyba v Supabase)
  const fetchArticlesForEditor = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('id, slug, title, perex, content, category, cover_image_url, gallery_urls, gallery_images, published, published_at, reading_time_minutes, pin_priority, author_name, author_id')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Chyba Supabase při načítání článků pro editor:', error.message || error);
        return;
      }

      if (data && data.length > 0) {
        setArticles(data as Article[]);
      }
    } catch (err) {
      console.error('Neočekávaná chyba při načítání článků pro editor:', err);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Synchronizace obsahu editoru s editable div při otevření článku
  useEffect(() => {
    if (editingArticle && editorRef.current) {
      if (editorRef.current.innerHTML !== (editingArticle.content || '')) {
        editorRef.current.innerHTML = editingArticle.content || '<p>Napište text článku...</p>';
      }
    }
  }, [editingArticle?.id]);

  const categories = useMemo(() => {
    const cats = new Set<string>(CATEGORY_OPTIONS);
    articles.forEach((a) => {
      if (a.category) cats.add(a.category);
    });
    return Array.from(cats);
  }, [articles]);

  const filteredAndSortedArticles = useMemo(() => {
    const normalizedQuery = normalizeText(searchQuery.trim());

    return articles
      .filter((article) => {
        const matchesSearch = 
          normalizedQuery === '' ||
          normalizeText(article.title).includes(normalizedQuery) ||
          normalizeText(article.perex).includes(normalizedQuery) ||
          normalizeText(article.content || '').includes(normalizedQuery);

        const matchesCategory = 
          selectedCategory === 'all' || 
          article.category === selectedCategory;

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        const prioA = Number(a.pin_priority || 0);
        const prioB = Number(b.pin_priority || 0);

        if (prioA > 0 && prioB > 0) {
          if (prioA !== prioB) return prioA - prioB;
        } else if (prioA > 0) {
          return -1;
        } else if (prioB > 0) {
          return 1;
        }

        const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
        const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;

        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });
  }, [articles, searchQuery, selectedCategory, sortOrder]);

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setEditingArticle(prev => ({ ...prev, content: editorRef.current?.innerHTML || '' }));
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('article-covers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('article-covers')
        .getPublicUrl(filePath);

      setEditingArticle(prev => ({ ...prev, cover_image_url: publicUrl }));
    } catch {
      alert('Chyba při nahrávání náhledového obrázku.');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingGallery(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `gallery/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('article-galleries')
          .upload(filePath, file);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('article-galleries')
            .getPublicUrl(filePath);
          uploadedUrls.push(publicUrl);
        }
      }

      setEditingArticle(prev => ({
        ...prev,
        gallery_urls: [...(prev?.gallery_urls || []), ...uploadedUrls]
      }));
    } catch {
      alert('Chyba při nahrávání fotek do galerie.');
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const handleRemoveGalleryImage = (indexToRemove: number) => {
    setEditingArticle(prev => ({
      ...prev,
      gallery_urls: (prev?.gallery_urls || []).filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleOpenCreate = () => {
    setEditingArticle({
      title: '',
      slug: '',
      perex: '',
      content: '<p>Napište text článku...</p>',
      category: 'Akce',
      cover_image_url: '',
      gallery_urls: [],
      published: true,
      pin_priority: 0,
      reading_time_minutes: 3
    });
  };

  const handleOpenEdit = (article: Article) => {
    setEditingArticle({ 
      ...article,
      gallery_urls: article.gallery_urls || article.gallery_images || []
    });
  };

  const handleTogglePin = async (article: Article) => {
    const newPriority = article.pin_priority > 0 ? 0 : 1;
    const { error } = await supabase
      .from('articles')
      .update({ pin_priority: newPriority })
      .eq('id', article.id);

    if (!error) {
      fetchArticlesForEditor();
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm('Opravdu chcete tento článek smazat?')) return;

    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', articleId);

    if (!error) {
      fetchArticlesForEditor();
    }
  };

  // Uložení článku včetně načtení reálného Jména a Příjmení autora z UUID
  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle || !editingArticle.title || !editingArticle.perex) return;

    setIsSaving(true);

    try {
      // 1. Získání aktuálního autorova UUID a jeho Jména
      const { data: { user } } = await supabase.auth.getUser();
      let authorFullName = editingArticle.author_name;

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, first_name, last_name, display_name')
          .eq('id', user.id)
          .single();

        if (profile) {
          if (profile.full_name) {
            authorFullName = profile.full_name;
          } else if (profile.first_name || profile.last_name) {
            authorFullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
          } else if (profile.display_name) {
            authorFullName = profile.display_name;
          }
        }
      }

      const finalSlug = editingArticle.slug || generateSlug(editingArticle.title);
      const isPublishingNew = editingArticle.published && !editingArticle.published_at;
      const htmlContent = editorRef.current ? editorRef.current.innerHTML : (editingArticle.content || '');
      const gallery = editingArticle.gallery_urls || [];

      const payload = {
        title: editingArticle.title,
        slug: finalSlug,
        perex: editingArticle.perex,
        content: htmlContent,
        category: editingArticle.category || null,
        cover_image_url: editingArticle.cover_image_url || null,
        gallery_urls: gallery,
        gallery_images: gallery,
        published: editingArticle.published ?? true,
        published_at: isPublishingNew ? new Date().toISOString() : editingArticle.published_at,
        pin_priority: Number(editingArticle.pin_priority || 0),
        reading_time_minutes: Number(editingArticle.reading_time_minutes || 3),
        author_id: user ? user.id : editingArticle.author_id,
        author_name: authorFullName || 'Administrátor'
      };

      if (editingArticle.id) {
        await supabase
          .from('articles')
          .update(payload)
          .eq('id', editingArticle.id);
      } else {
        await supabase
          .from('articles')
          .insert([payload]);
      }

      await fetchArticlesForEditor();
      setEditingArticle(null);
    } catch (err) {
      console.error('Chyba při ukládání článku:', err);
      alert('Chyba při ukládání článku.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* OVLÁDACÍ LIŠTA */}
      <div className="mb-10 bg-white/90 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-sky-100 shadow-xl shadow-blue-900/5 relative z-30">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            {/* Vyhledávání */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Hledat v článcích a obsahu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Custom Dropdown: KATEGORIE */}
            <div className="relative w-full sm:w-auto min-w-[210px]" ref={categoryRef}>
              <button
                type="button"
                onClick={() => {
                  setIsCategoryOpen(!isCategoryOpen);
                  setIsSortOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-3 bg-slate-50 border rounded-2xl px-4 py-2 text-left transition-all ${
                  isCategoryOpen 
                    ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white shadow-md' 
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Filter className="h-4 w-4 text-blue-600 shrink-0" />
                  <div className="flex flex-col truncate">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider leading-none">Kategorie</span>
                    <span className="text-xs font-bold text-slate-800 truncate mt-0.5">
                      {selectedCategory === 'all' ? 'Všechny kategorie' : selectedCategory}
                    </span>
                  </div>
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${isCategoryOpen ? 'rotate-180 text-blue-600' : ''}`} />
              </button>

              {isCategoryOpen && (
                <div className="absolute left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-sky-100 rounded-2xl shadow-2xl shadow-blue-900/15 py-1.5 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setIsCategoryOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-xs font-bold text-left flex items-center justify-between transition-colors ${
                      selectedCategory === 'all' 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>Všechny kategorie</span>
                    {selectedCategory === 'all' && <Check className="h-4 w-4 text-blue-600" />}
                  </button>

                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setIsCategoryOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-xs font-bold text-left flex items-center justify-between transition-colors ${
                        selectedCategory === cat 
                          ? 'bg-blue-50 text-blue-600' 
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{cat}</span>
                      {selectedCategory === cat && <Check className="h-4 w-4 text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Dropdown: ŘAZENÍ */}
            <div className="relative w-full sm:w-auto min-w-[190px]" ref={sortRef}>
              <button
                type="button"
                onClick={() => {
                  setIsSortOpen(!isSortOpen);
                  setIsCategoryOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-3 bg-slate-50 border rounded-2xl px-4 py-2 text-left transition-all ${
                  isSortOpen 
                    ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white shadow-md' 
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ArrowUpDown className="h-4 w-4 text-cyan-600 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider leading-none">Řadit podle</span>
                    <span className="text-xs font-bold text-slate-800 mt-0.5">
                      {sortOrder === 'newest' ? 'Od nejnovějších' : 'Od nejstarších'}
                    </span>
                  </div>
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${isSortOpen ? 'rotate-180 text-blue-600' : ''}`} />
              </button>

              {isSortOpen && (
                <div className="absolute left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-sky-100 rounded-2xl shadow-2xl shadow-blue-900/15 py-1.5 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={() => {
                      setSortOrder('newest');
                      setIsSortOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-xs font-bold text-left flex items-center justify-between transition-colors ${
                      sortOrder === 'newest' 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>Od nejnovějších</span>
                    {sortOrder === 'newest' && <Check className="h-4 w-4 text-blue-600" />}
                  </button>

                  <button
                    onClick={() => {
                      setSortOrder('oldest');
                      setIsSortOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-xs font-bold text-left flex items-center justify-between transition-colors ${
                      sortOrder === 'oldest' 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>Od nejstarších</span>
                    {sortOrder === 'oldest' && <Check className="h-4 w-4 text-blue-600" />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* TLAČÍTKO VYTVOŘIT ČLÁNEK */}
          {canEdit && (
            <button
              onClick={handleOpenCreate}
              className="w-full lg:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/25 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Nový článek</span>
            </button>
          )}

        </div>
      </div>

      {/* SEZNAM ČLÁNKŮ */}
      {filteredAndSortedArticles.length === 0 ? (
        <div className="text-center py-20 rounded-3xl bg-white border border-sky-100 shadow-lg shadow-blue-900/5 p-8 max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-sky-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Žádné články nebyly nalezeny</h3>
          <p className="text-slate-600 text-sm mb-6">
            Zkuste změnit klíčové slovo vyhledávání nebo vyberte jinou kategorii.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-50 text-blue-700 px-4 py-2 text-sm font-bold hover:bg-blue-100 transition-colors"
          >
            Vynulovat filtry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start relative z-10">
          {filteredAndSortedArticles.map((article, index) => {
            const formattedDate = article.published_at
              ? new Date(article.published_at).toLocaleDateString('cs-CZ', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : null;

            const isPinned = article.pin_priority > 0;

            return (
              <article
                key={article.id}
                className={`group flex flex-col bg-white rounded-3xl border transition-all duration-300 overflow-hidden relative ${
                  isPinned 
                    ? 'border-blue-300 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/20' 
                    : 'border-sky-100/80 shadow-lg shadow-blue-900/5 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1.5'
                }`}
              >
                {/* ADMIN OVLÁDACÍ LIŠTA NA KARTĚ */}
                {canEdit && (
                  <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-lg border border-slate-200">
                    <button
                      onClick={() => handleTogglePin(article)}
                      className={`p-1.5 rounded-xl transition-colors ${
                        isPinned 
                          ? 'bg-amber-500 text-white' 
                          : 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-600'
                      }`}
                      title={isPinned ? `Připnuto (Priorita: ${article.pin_priority})` : "Připnout článek"}
                    >
                      <Pin className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => handleOpenEdit(article)}
                      className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors"
                      title="Upravit článek"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteArticle(article.id)}
                      className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors"
                      title="Smazat článek"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <Link 
                  href={`/clanky/${article.slug}`} 
                  className="relative aspect-[4/5] w-full bg-slate-100 overflow-hidden block"
                >
                  {article.cover_image_url ? (
                    <Image
                      src={article.cover_image_url}
                      alt={article.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={index < 2}
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-gradient-to-br from-sky-50 to-blue-50/50">
                      <BookOpen className="h-10 w-10 text-sky-200 mb-1" />
                      <span className="text-xs font-semibold text-sky-400">PK Znojmo</span>
                    </div>
                  )}

                  <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 items-start">
                    {article.category && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-md px-3 py-1 text-xs font-bold text-blue-700 shadow-md border border-sky-100 uppercase tracking-wider">
                        <Tag className="h-3 w-3 text-cyan-600" />
                        {article.category}
                      </span>
                    )}

                    {!article.published && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/90 text-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
                        <Lock className="h-3 w-3 text-amber-400" /> Koncept
                      </span>
                    )}
                  </div>
                </Link>

                <div className="flex flex-col flex-grow p-6 sm:p-7">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-3">
                    {formattedDate ? (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-sky-500" />
                        {formattedDate}
                      </span>
                    ) : <span />}
                    
                    {article.reading_time_minutes && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-sky-500" />
                        {article.reading_time_minutes} min čtení
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-3 leading-snug">
                    <Link href={`/clanky/${article.slug}`}>
                      {article.title}
                    </Link>
                  </h2>

                  <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 mb-6 flex-grow">
                    {article.perex}
                  </p>

                  <div className="pt-4 border-t border-sky-100 flex items-center justify-between mt-auto">
                    <span className="text-xs font-semibold text-slate-400">
                      {article.author_name || 'Redakce'}
                    </span>
                    <Link
                      href={`/clanky/${article.slug}`}
                      className="inline-flex items-center gap-1.5 font-bold text-sm text-blue-600 group-hover:text-blue-700 group-hover:translate-x-1 transition-all"
                    >
                      Číst dále
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* MODÁLNÍ EDITOR ČLÁNKŮ */}
      {editingArticle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-4xl w-full shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col my-auto animate-in fade-in zoom-in duration-200">
            
            {/* HLAVIČKA */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-black uppercase text-slate-900">
                  {editingArticle.id ? 'Upravit článek' : 'Vytvořit nový článek'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Redakční systém pro Administrátory a Marketing
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setEditingArticle(null)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* SKROLOVATELNÝ OBSAH FORMULÁŘE */}
            <form onSubmit={handleSaveArticle} className="space-y-5 overflow-y-auto py-4 pr-1 flex-grow">
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Název článku
                </label>
                <input
                  type="text"
                  required
                  value={editingArticle.title || ''}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setEditingArticle({ 
                      ...editingArticle, 
                      title: newTitle,
                      slug: editingArticle.id ? editingArticle.slug : generateSlug(newTitle)
                    });
                  }}
                  placeholder="např. Úspěch našich plavců na Letním poháru ČR"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    required
                    value={editingArticle.slug || ''}
                    onChange={(e) => setEditingArticle({ ...editingArticle, slug: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Kategorie
                  </label>
                  <select
                    value={editingArticle.category || 'Akce'}
                    onChange={(e) => setEditingArticle({ ...editingArticle, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Perex (Krátký úvod)
                </label>
                <textarea
                  required
                  rows={2}
                  value={editingArticle.perex || ''}
                  onChange={(e) => setEditingArticle({ ...editingArticle, perex: e.target.value })}
                  placeholder="Stručný přehled článku zobrazený na kartě..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* WORD-STYLE VISUAL EDITOR */}
              <div>
                <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Obsah článku (Visual Editor)
                  </span>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => execCommand('bold')}
                      className="p-1.5 text-slate-700 hover:bg-white rounded hover:text-blue-600 transition-colors"
                      title="Tučný text (strong)"
                    >
                      <Bold className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCommand('italic')}
                      className="p-1.5 text-slate-700 hover:bg-white rounded hover:text-blue-600 transition-colors"
                      title="Kurzíva (em)"
                    >
                      <Italic className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCommand('underline')}
                      className="p-1.5 text-slate-700 hover:bg-white rounded hover:text-blue-600 transition-colors"
                      title="Podtržené (u)"
                    >
                      <Underline className="h-3.5 w-3.5" />
                    </button>
                    <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />
                    <button
                      type="button"
                      onClick={() => execCommand('formatBlock', '<h2>')}
                      className="p-1.5 text-slate-700 hover:bg-white rounded hover:text-blue-600 transition-colors flex items-center gap-0.5 text-xs font-bold"
                      title="Nadpis H2"
                    >
                      <Heading2 className="h-3.5 w-3.5" />
                    </button>
                    <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />
                    <button
                      type="button"
                      onClick={() => execCommand('insertUnorderedList')}
                      className="p-1.5 text-slate-700 hover:bg-white rounded hover:text-blue-600 transition-colors"
                      title="Odrážkový seznam (ul)"
                    >
                      <List className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCommand('insertOrderedList')}
                      className="p-1.5 text-slate-700 hover:bg-white rounded hover:text-blue-600 transition-colors"
                      title="Číslovaný seznam (ol)"
                    >
                      <ListOrdered className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={() => {
                    if (editorRef.current) {
                      setEditingArticle(prev => ({ ...prev, content: editorRef.current?.innerHTML || '' }));
                    }
                  }}
                  className="w-full min-h-[220px] max-h-[350px] overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors prose prose-slate max-w-none 
                    [&>p]:mb-3 [&>p]:leading-relaxed [&>p]:text-slate-700
                    [&>h2]:text-lg [&>h2]:font-bold [&>h2]:text-slate-900 [&>h2]:mt-3 [&>h2]:mb-2
                    [&>ul]:list-disc [&>ul]:list-inside [&>ul]:space-y-1 [&>ul]:mb-3 [&>ul]:text-slate-700 [&>ul]:pl-2
                    [&>ol]:list-decimal [&>ol]:list-inside [&>ol]:space-y-1 [&>ol]:mb-3 [&>ol]:text-slate-700 [&>ol]:pl-2
                    [&>strong]:font-bold [&>strong]:text-slate-900"
                />
              </div>

              {/* UPLOAD NÁHLEDOVÉHO OBRÁZKU & PRIORITY */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Náhledový obrázek
                  </label>
                  
                  <div className="flex items-center gap-3">
                    <label className="flex-grow flex items-center justify-center gap-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl px-4 py-2.5 cursor-pointer transition-colors text-xs font-bold text-slate-700">
                      {isUploadingCover ? (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      ) : (
                        <Upload className="h-4 w-4 text-blue-600" />
                      )}
                      <span>{isUploadingCover ? 'Nahrávám...' : 'Vybrat soubor'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        disabled={isUploadingCover}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {editingArticle.cover_image_url && (
                    <div className="mt-2 relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 group">
                      <Image 
                        src={editingArticle.cover_image_url} 
                        alt="Náhled" 
                        fill 
                        sizes="80px"
                        className="object-cover" 
                      />
                      <button
                        type="button"
                        onClick={() => setEditingArticle({ ...editingArticle, cover_image_url: '' })}
                        className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Priorita připnutí
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingArticle.pin_priority ?? 0}
                    onChange={(e) => setEditingArticle({ ...editingArticle, pin_priority: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    0 = vypnuto, 1 = nejvyšší priorita...
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Čas čtení (v minutách)
                  </label>
                  <input
                    type="number"
                    value={editingArticle.reading_time_minutes || 3}
                    onChange={(e) => setEditingArticle({ ...editingArticle, reading_time_minutes: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* UPLOAD FOTEK DO GALERIE */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Galerie článku
                </label>
                
                <label className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100/80 rounded-2xl p-3.5 cursor-pointer transition-colors text-xs font-bold text-slate-600 mb-3">
                  {isUploadingGallery ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-blue-600" />
                  )}
                  <span>{isUploadingGallery ? 'Nahrávám obrázky...' : 'Přidat obrázky do galerie'}</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleGalleryUpload}
                    disabled={isUploadingGallery}
                    className="hidden"
                  />
                </label>

                {editingArticle.gallery_urls && editingArticle.gallery_urls.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl max-h-36 overflow-y-auto">
                    {editingArticle.gallery_urls.map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                        <Image src={url} alt={`Galerie ${idx + 1}`} fill sizes="100vw" className="object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryImage(idx)}
                          className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* PATIČKA MODÁLU */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingArticle(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploadingCover || isUploadingGallery}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Uložit článek
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  );
}