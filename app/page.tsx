'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Trophy, 
  Users, 
  HeartHandshake, 
  ShieldCheck, 
  Award, 
  ArrowRight, 
  X, 
  ChevronRight, 
  ChevronLeft,
  Settings,
  Plus,
  Pencil,
  Trash2,
  Upload,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  ImageIcon,
  UserPlus,
  Waves,
  Droplet,
  Mail,
  Phone,
  Dumbbell,
  UserCheck,
  Star,
  CheckCircle2
} from 'lucide-react';

export interface Trainer {
  id: string;
  name: string;
  role: string;
  license?: string | null;
  category?: 'vedeni' | 'kondice' | 'licence3' | 'asistent' | string | null;
  teams?: string | null;
  short_desc?: string | null;
  bio?: string | null;
  specialization?: string[] | null;
  private_lessons?: boolean | null;
  phone?: string | null;
  email?: string | null;
  image_url?: string | null;
  sort_order?: number;
}

export interface FlyerItem {
  id: string;
  title: string;
  image_url?: string | null;
  link_url?: string | null;
  is_active: boolean;
  sort_order?: number;
}

export default function HomePage() {
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [activeFlyerIndex, setActiveFlyerIndex] = useState<number>(0);

  const [flyers, setFlyers] = useState<FlyerItem[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [canEdit, setCanEdit] = useState<boolean>(false);
  const [isLoadingFlyers, setIsLoadingFlyers] = useState<boolean>(true);
  const [isLoadingTrainers, setIsLoadingTrainers] = useState<boolean>(true);

  // Modální okna letáků
  const [isFlyerManagerOpen, setIsFlyerManagerOpen] = useState<boolean>(false);
  const [editingFlyer, setEditingFlyer] = useState<Partial<FlyerItem> | null>(null);
  const [isSavingFlyer, setIsSavingFlyer] = useState<boolean>(false);
  const [isUploadingFlyerImage, setIsUploadingFlyerImage] = useState<boolean>(false);

  // Modální okna trenérů
  const [isTrainerManagerOpen, setIsTrainerManagerOpen] = useState<boolean>(false);
  const [editingTrainer, setEditingTrainer] = useState<Partial<Trainer> | null>(null);
  const [trainerSpecInput, setTrainerSpecInput] = useState<string>('');
  const [isSavingTrainer, setIsSavingTrainer] = useState<boolean>(false);
  const [isUploadingTrainerImage, setIsUploadingTrainerImage] = useState<boolean>(false);

  const fetchFlyers = async (isAdmin: boolean) => {
    try {
      setIsLoadingFlyers(true);
      let query = supabase
        .from('flyers')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (!error && data) setFlyers(data as FlyerItem[]);
      else setFlyers([]);
    } catch (err) {
      console.error('Chyba při načítání letáků:', err);
      setFlyers([]);
    } finally {
      setIsLoadingFlyers(false);
    }
  };

  const fetchTrainers = async () => {
    try {
      setIsLoadingTrainers(true);
      const { data, error } = await supabase
        .from('trainers')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!error && data) setTrainers(data as Trainer[]);
      else setTrainers([]);
    } catch (err) {
      console.error('Chyba při načítání trenérů:', err);
      setTrainers([]);
    } finally {
      setIsLoadingTrainers(false);
    }
  };

  useEffect(() => {
    const checkPermissionsAndLoad = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let isAdmin = false;

        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('roles')
            .eq('id', session.user.id)
            .single();

          if (profile && Array.isArray(profile.roles)) {
            isAdmin = profile.roles.includes('admin') || profile.roles.includes('marketing');
          }
        }

        setCanEdit(isAdmin);
        await Promise.all([fetchFlyers(isAdmin), fetchTrainers()]);
      } catch (err) {
        console.error('Chyba při inicializaci:', err);
        await Promise.all([fetchFlyers(false), fetchTrainers()]);
      }
    };

    checkPermissionsAndLoad();
  }, []);

  const activeFlyers = useMemo(() => flyers.filter((f) => f.is_active), [flyers]);

  useEffect(() => {
    if (activeFlyers.length <= 1) return;
    const timer = setInterval(() => {
      setActiveFlyerIndex((prev) => (prev + 1) % activeFlyers.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeFlyers.length]);

  const handlePrevFlyer = () => {
    if (activeFlyers.length === 0) return;
    setActiveFlyerIndex((prev) => (prev - 1 + activeFlyers.length) % activeFlyers.length);
  };

  const handleNextFlyer = () => {
    if (activeFlyers.length === 0) return;
    setActiveFlyerIndex((prev) => (prev + 1) % activeFlyers.length);
  };

  // --- KATEGORIZACE TRENÉRŮ DO 4 SEKCÍ ---
  const vedeniTrainers = useMemo(() => trainers.filter((t) => t.category === 'vedeni'), [trainers]);
  const kondiceTrainers = useMemo(() => trainers.filter((t) => t.category === 'kondice'), [trainers]);
  const licence3Trainers = useMemo(() => trainers.filter((t) => t.category === 'licence3'), [trainers]);
  const asistentTrainers = useMemo(() => trainers.filter((t) => t.category === 'asistent'), [trainers]);

  // --- SPRÁVA LETÁKŮ HOF ---
  const handleFlyerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFlyerImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `flyer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('flyer-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('flyer-images')
        .getPublicUrl(fileName);

      setEditingFlyer((prev) => ({ ...prev, image_url: publicUrl }));
    } catch (err: any) {
      alert(`Chyba při nahrávání obrázku: ${err?.message || 'Zkontrolujte oprávnění bucketu'}`);
    } finally {
      setIsUploadingFlyerImage(false);
    }
  };

  const handleSaveFlyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFlyer || !editingFlyer.image_url) {
      alert('Prosím nahrajte nebo vložte URL obrázku.');
      return;
    }

    setIsSavingFlyer(true);
    try {
      const payload = {
        title: editingFlyer.title || 'Leták bez názvu',
        image_url: editingFlyer.image_url,
        link_url: editingFlyer.link_url || null,
        is_active: editingFlyer.is_active ?? true,
      };

      if (editingFlyer.id) {
        await supabase.from('flyers').update(payload).eq('id', editingFlyer.id);
      } else {
        await supabase.from('flyers').insert([payload]);
      }

      await fetchFlyers(canEdit);
      setEditingFlyer(null);
    } catch (err) {
      alert('Chyba při ukládání letáku.');
    } finally {
      setIsSavingFlyer(false);
    }
  };

  const handleToggleFlyerActive = async (flyer: FlyerItem) => {
    try {
      await supabase
        .from('flyers')
        .update({ is_active: !flyer.is_active })
        .eq('id', flyer.id);

      await fetchFlyers(canEdit);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFlyer = async (flyerId: string) => {
    if (!confirm('Opravdu chcete tento leták smazat?')) return;
    try {
      await supabase.from('flyers').delete().eq('id', flyerId);
      await fetchFlyers(canEdit);
    } catch (err) {
      console.error(err);
    }
  };

  // --- SPRÁVA TRENÉRŮ HOF ---
  const handleTrainerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingTrainerImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `trainer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('flyer-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('flyer-images')
        .getPublicUrl(fileName);

      setEditingTrainer((prev) => ({ ...prev, image_url: publicUrl }));
    } catch (err: any) {
      alert(`Chyba při nahrávání: ${err?.message || 'Zkontrolujte oprávnění bucketu'}`);
    } finally {
      setIsUploadingTrainerImage(false);
    }
  };

  const handleOpenCreateTrainer = () => {
    setEditingTrainer({
      name: '',
      role: 'Trenér',
      category: 'licence3',
      license: 'Licence III. třídy',
      teams: '',
      short_desc: '',
      bio: '',
      private_lessons: false,
      phone: '',
      email: '',
      image_url: '',
      specialization: []
    });
    setTrainerSpecInput('');
  };

  const handleOpenEditTrainer = (trainer: Trainer) => {
    setEditingTrainer(trainer);
    setTrainerSpecInput(trainer.specialization ? trainer.specialization.join(', ') : '');
  };

  const handleSaveTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrainer || !editingTrainer.name || !editingTrainer.role) {
      alert('Vyplňte prosím jméno a roli trenéra.');
      return;
    }

    setIsSavingTrainer(true);
    try {
      const specsArray = trainerSpecInput
        ? trainerSpecInput.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        name: editingTrainer.name,
        role: editingTrainer.role,
        category: editingTrainer.category || 'licence3',
        license: editingTrainer.license || null,
        teams: editingTrainer.teams || null,
        short_desc: editingTrainer.short_desc || null,
        bio: editingTrainer.bio || null,
        specialization: specsArray,
        private_lessons: editingTrainer.private_lessons ?? false,
        phone: editingTrainer.phone || null,
        email: editingTrainer.email || null,
        image_url: editingTrainer.image_url || null,
      };

      if (editingTrainer.id) {
        await supabase.from('trainers').update(payload).eq('id', editingTrainer.id);
      } else {
        await supabase.from('trainers').insert([payload]);
      }

      await fetchTrainers();
      setEditingTrainer(null);
    } catch (err) {
      alert('Chyba při ukládání trenéra.');
    } finally {
      setIsSavingTrainer(false);
    }
  };

  const handleDeleteTrainer = async (trainerId: string) => {
    if (!confirm('Opravdu chcete tohoto trenéra smazat?')) return;
    try {
      await supabase.from('trainers').delete().eq('id', trainerId);
      await fetchTrainers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFlyerClick = (flyer: FlyerItem, index: number) => {
    if (index === activeFlyerIndex) {
      if (flyer.link_url) {
        if (flyer.link_url.startsWith('http')) {
          window.open(flyer.link_url, '_blank');
        } else {
          window.location.href = flyer.link_url;
        }
      }
    } else {
      setActiveFlyerIndex(index);
    }
  };

  // Pomocná funkce pro rendering štítků družstev
  const renderTeamBadges = (teamsStr?: string | null) => {
    if (!teamsStr) return null;
    const teamsList = teamsStr.split(',').map((t) => t.trim()).filter(Boolean);
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {teamsList.map((team, idx) => (
          <span
            key={idx}
            className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80"
          >
            {team}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-16 sm:gap-24 pb-20 overflow-x-hidden bg-slate-50 text-slate-900 min-h-screen">
      
      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-b from-sky-50/80 via-white to-slate-50 pt-8 pb-16 sm:pt-12 sm:pb-20 overflow-hidden border-b border-slate-200/80">
        <div className="absolute top-[-10%] right-[10%] w-[500px] h-[500px] rounded-full bg-sky-200/30 blur-[100px] pointer-events-none" />
        <div className="absolute top-[30%] left-[-10%] w-[400px] h-[400px] rounded-full bg-blue-100/40 blur-[120px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-center flex flex-col items-center">
          
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-100/80 border border-sky-200 px-4 py-2 text-xs font-bold text-sky-900 shadow-sm cursor-default">
              <Waves className="h-4 w-4 text-blue-600" />
              <span>Elitní Sportovní středisko ČSPS od roku 2023</span>
            </div>

            {canEdit && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFlyerManagerOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <Settings className="h-4 w-4" />
                  <span>Upravit letáky</span>
                </button>

                <button
                  onClick={() => setIsTrainerManagerOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <Users className="h-4 w-4" />
                  <span>Upravit trenéry</span>
                </button>
              </div>
            )}
          </div>

          {(isLoadingFlyers || activeFlyers.length > 0) && (
            <div className="w-full max-w-lg sm:max-w-2xl my-4 relative flex flex-col items-center">
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[300px] w-full bg-gradient-to-r from-blue-500/10 via-cyan-400/20 to-sky-400/10 rounded-[100%] blur-3xl pointer-events-none animate-pulse" />
              <div className="absolute bottom-4 w-3/4 h-12 bg-gradient-to-r from-blue-600/20 via-cyan-400/35 to-blue-600/20 rounded-[100%] blur-xl pointer-events-none" />

              {activeFlyers.length > 1 && (
                <>
                  <button 
                    onClick={handlePrevFlyer} 
                    className="absolute left-0 sm:-left-6 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-white/80 border border-slate-200/80 text-slate-800 shadow-lg hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:scale-110 active:scale-95 transition-all backdrop-blur-md"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button 
                    onClick={handleNextFlyer} 
                    className="absolute right-0 sm:-right-6 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-white/80 border border-slate-200/80 text-slate-800 shadow-lg hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:scale-110 active:scale-95 transition-all backdrop-blur-md"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}

              <div 
                className="relative w-full h-[360px] sm:h-[430px] flex justify-center items-center"
                style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
              >
                {isLoadingFlyers ? (
                  <div className="flex flex-col items-center gap-3 text-blue-600">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="text-xs font-mono uppercase tracking-widest text-slate-500">Načítám letáky...</span>
                  </div>
                ) : (
                  activeFlyers.map((flyer, index) => {
                    const offset = (index - activeFlyerIndex + activeFlyers.length) % activeFlyers.length;
                    let transformStyle = '';
                    let zIndex = 0;
                    let opacity = 0;
                    let filterStyle = '';

                    if (offset === 0) {
                      transformStyle = 'translateX(0%) translateZ(80px) rotateY(0deg) scale(1)';
                      zIndex = 30;
                      opacity = 1;
                      filterStyle = 'drop-shadow(0 25px 35px rgba(2, 132, 199, 0.25))';
                    } else if (offset === 1) {
                      transformStyle = 'translateX(52%) translateZ(-110px) rotateY(-42deg) scale(0.82)';
                      zIndex = 20;
                      opacity = 0.8;
                      filterStyle = 'brightness(0.9) blur(0.2px)';
                    } else if (offset === activeFlyers.length - 1) {
                      transformStyle = 'translateX(-52%) translateZ(-110px) rotateY(42deg) scale(0.82)';
                      zIndex = 20;
                      opacity = 0.8;
                      filterStyle = 'brightness(0.9) blur(0.2px)';
                    } else {
                      transformStyle = 'translateY(-20px) translateZ(-300px) rotateY(180deg) scale(0.4)';
                      zIndex = 10;
                      opacity = 0;
                    }

                    return (
                      <div
                        key={flyer.id}
                        onClick={() => handleFlyerClick(flyer, index)}
                        style={{
                          transform: transformStyle,
                          zIndex: zIndex,
                          opacity: opacity,
                          filter: filterStyle,
                          transition: 'all 0.75s cubic-bezier(0.25, 1, 0.5, 1)',
                        }}
                        className="absolute w-[240px] sm:w-[290px] aspect-[1080/1350] rounded-2xl cursor-pointer select-none overflow-hidden group bg-slate-900 ring-1 ring-slate-900/10 shadow-2xl flex items-center justify-center transition-all duration-300"
                      >
                        {flyer.image_url ? (
                          <div className="relative w-full h-full overflow-hidden rounded-2xl">
                            <img
                              src={flyer.image_url}
                              alt={flyer.title || ''}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400 p-4">
                            <ImageIcon className="h-12 w-12 mb-2 text-slate-300" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {activeFlyers.length > 1 && (
                <div className="flex items-center gap-2 mt-2 px-5 py-2 rounded-full bg-white/90 border border-slate-200/80 backdrop-blur-md shadow-md">
                  {activeFlyers.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveFlyerIndex(i)}
                      className="relative focus:outline-none transition-all duration-300"
                    >
                      {activeFlyerIndex === i ? (
                        <div className="flex items-center justify-center px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-sky-500 text-white font-black text-xs gap-1.5 shadow-sm">
                          <Droplet className="h-3 w-3 fill-current animate-bounce" />
                          <span>{i + 1}</span>
                        </div>
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-300 hover:bg-blue-500 transition-all hover:scale-125" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <h1 className="mt-6 text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tight max-w-4xl leading-[1.1]">
            Budujeme generaci, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600">
              která miluje pohyb.
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-xl text-slate-600 max-w-2xl font-normal leading-relaxed">
            Jsme značkou kvality plavání ve Znojmě. Nabízíme bezpečné, profesionální a přátelské prostředí pro vaše děti.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/druzstva"
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 px-8 py-4 font-bold text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all active:scale-95"
            >
              Najděte si své družstvo
              <ArrowRight className="h-5 w-5" />
            </Link>
            {trainers.length > 0 && (
              <a
                href="#treneri"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 font-bold text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 hover:-translate-y-0.5 transition-all active:scale-95 shadow-sm"
              >
                Poznejte náš tým
              </a>
            )}
          </div>

        </div>
      </section>

      {/* HODNOTY KLUBU */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full -mt-6 sm:-mt-10 relative z-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="group rounded-3xl bg-white p-7 shadow-sm border border-slate-200/80 hover:border-blue-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold mb-5 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Trophy className="h-7 w-7" />
            </div>
            <h3 className="font-bold text-xl text-slate-900 mb-2">Cíl</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Systematická výuka od prvních kroků neplavců až po závodní úroveň.
            </p>
          </div>

          <div className="group rounded-3xl bg-white p-7 shadow-sm border border-slate-200/80 hover:border-blue-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold mb-5 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Users className="h-7 w-7" />
            </div>
            <h3 className="font-bold text-xl text-slate-900 mb-2">Komunita</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Kvalitní, smysluplné a aktivní trávení volného času v kolektivu.
            </p>
          </div>

          <div className="group rounded-3xl bg-white p-7 shadow-sm border border-slate-200/80 hover:border-blue-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold mb-5 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <HeartHandshake className="h-7 w-7" />
            </div>
            <h3 className="font-bold text-xl text-slate-900 mb-2">Atmosféra</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Pozitivní motivace a dlouhodobé budování přirozené lásky ke sportu.
            </p>
          </div>

          <div className="group rounded-3xl bg-white p-7 shadow-sm border border-slate-200/80 hover:border-blue-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold mb-5 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h3 className="font-bold text-xl text-slate-900 mb-2">Fair Play</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Plně transparentní fungování klubu, čestné jednání a otevřenost.
            </p>
          </div>
        </div>
      </section>

      {/* TRENÉŘI SECTION - 4 STRUCTURAL SECTIONS */}
      <section id="treneri" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 w-full relative">
        
        {/* Hlavička sekce */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6 border-b border-slate-200 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-widest bg-blue-50 border border-blue-200 px-4 py-1.5 rounded-full mb-3">
              <Award className="h-4 w-4 text-blue-600" />
              <span>Odbornost • Zkušenosti • Přístup</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Naši Trenéři
            </h2>
            <p className="mt-2 text-slate-600 text-base sm:text-lg">
              Svěřte své děti do rukou licencovaných profesionálů Plaveckého klubu Znojmo.
            </p>
          </div>

          {canEdit && (
            <button
              onClick={() => setIsTrainerManagerOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 font-bold text-sm shadow-md transition-all shrink-0 cursor-pointer"
            >
              <UserPlus className="h-5 w-5" />
              <span>Správa Trenérů</span>
            </button>
          )}
        </div>

        {isLoadingTrainers ? (
          <div className="flex items-center justify-center py-20 text-blue-600 gap-3">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="font-bold text-sm text-slate-600">Načítám trenéry...</span>
          </div>
        ) : trainers.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-500 bg-white">
            V databázi zatím nejsou žádní trenéři.
          </div>
        ) : (
          <div className="space-y-16">

            {/* SEKCIE 1: VEDENÍ KLUBU */}
            {vedeniTrainers.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                    <UserCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">Vedení klubu</h3>
                    <p className="text-xs font-medium text-slate-500">Strategické řízení a hlavní garanti tréninkového procesu</p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {vedeniTrainers.map((trainer) => (
                    <div
                      key={trainer.id}
                      onClick={() => setSelectedTrainer(trainer)}
                      className="group relative flex flex-col sm:flex-row gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg hover:border-blue-400 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                    >
                      <div className="w-full sm:w-36 h-40 sm:h-36 rounded-2xl overflow-hidden shrink-0 border border-slate-100 bg-slate-100 relative">
                        {trainer.image_url ? (
                          <img src={trainer.image_url} alt={trainer.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Users className="h-12 w-12" />
                          </div>
                        )}
                        {trainer.private_lessons && (
                          <div className="absolute top-2 left-2 bg-emerald-500 text-white p-1 rounded-full shadow" title="Nabízí soukromé lekce">
                            <Star className="h-3.5 w-3.5 fill-current" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col justify-between flex-1">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            {trainer.license && (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-md">
                                {trainer.license}
                              </span>
                            )}
                            {trainer.private_lessons && (
                              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                                Soukromé lekce
                              </span>
                            )}
                          </div>

                          <h4 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                            {trainer.name}
                          </h4>
                          <p className="text-xs font-bold text-blue-600 mb-2">{trainer.role}</p>

                          {trainer.teams && (
                            <div className="mb-2">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Trénuje:</span>
                              {renderTeamBadges(trainer.teams)}
                            </div>
                          )}

                          {trainer.short_desc && (
                            <p className="text-slate-600 text-xs leading-relaxed mt-2">
                              {trainer.short_desc}
                            </p>
                          )}
                        </div>

                        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                          <span>Detail & kontakt</span>
                          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SEKCIE 2: SUCHÁ PŘÍPRAVA & KONDICE */}
            {kondiceTrainers.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
                    <Dumbbell className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">Suchá příprava & Kondice</h3>
                    <p className="text-xs font-medium text-slate-500">Silový rozvoj, kompenzační cvičení, mobilita a preventivní péče</p>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {kondiceTrainers.map((trainer) => (
                    <div
                      key={trainer.id}
                      onClick={() => setSelectedTrainer(trainer)}
                      className="group flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-amber-400 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-slate-100 bg-slate-100 flex items-center justify-center">
                            {trainer.image_url ? (
                              <img src={trainer.image_url} alt={trainer.name} className="w-full h-full object-cover" />
                            ) : (
                              <Dumbbell className="h-6 w-6 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors text-base">
                              {trainer.name}
                            </h4>
                            <p className="text-xs font-semibold text-amber-700 mb-1">{trainer.role}</p>
                            {trainer.private_lessons && (
                              <span className="inline-block text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                                Soukromé lekce
                              </span>
                            )}
                          </div>
                        </div>

                        {trainer.teams && (
                          <div className="mb-3">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Působnost:</span>
                            {renderTeamBadges(trainer.teams)}
                          </div>
                        )}

                        {trainer.short_desc && (
                          <p className="text-slate-600 text-xs leading-relaxed mt-2">
                            {trainer.short_desc}
                          </p>
                        )}
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-600">
                        <span>Zobrazit profil</span>
                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SEKCIE 3: TRENÉŘI S LICENCÍ */}
            {licence3Trainers.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-2xl bg-sky-600 text-white shadow-md shadow-sky-500/20">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">Trenéři s licencí</h3>
                    <p className="text-xs font-medium text-slate-500">Licencovaní trenéři vedení závodních a přípravných družstev</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {licence3Trainers.map((trainer) => (
                    <div
                      key={trainer.id}
                      onClick={() => setSelectedTrainer(trainer)}
                      className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-sky-400 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-100 bg-slate-100 flex items-center justify-center">
                            {trainer.image_url ? (
                              <img src={trainer.image_url} alt={trainer.name} className="w-full h-full object-cover" />
                            ) : (
                              <Users className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-sky-600 transition-colors">
                              {trainer.name}
                            </h4>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              <span className="inline-block text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                {trainer.license || 'Licence III. třídy'}
                              </span>
                              {trainer.private_lessons && (
                                <span className="inline-block text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                                  Soukromé lekce
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {trainer.teams && renderTeamBadges(trainer.teams)}

                        {trainer.short_desc && (
                          <p className="text-slate-600 text-xs mt-2">
                            {trainer.short_desc}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-sky-600">
                        <span>Více info</span>
                        <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SEKCIE 4: POMOCNÍ TRENÉŘI */}
            {asistentTrainers.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-500/20">
                    <HeartHandshake className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">Pomocní a asistující trenéři</h3>
                    <p className="text-xs font-medium text-slate-500">Asistence při trénincích a individuální péče o plavce</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {asistentTrainers.map((trainer) => (
                    <div
                      key={trainer.id}
                      onClick={() => setSelectedTrainer(trainer)}
                      className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-teal-400 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-100 bg-slate-100 flex items-center justify-center">
                            {trainer.image_url ? (
                              <img src={trainer.image_url} alt={trainer.name} className="w-full h-full object-cover" />
                            ) : (
                              <Users className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm group-hover:text-teal-600 transition-colors">
                              {trainer.name}
                            </h4>
                            <p className="text-xs text-teal-700 font-medium mb-1">{trainer.role}</p>
                            {trainer.private_lessons && (
                              <span className="inline-block text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                                Soukromé lekce
                              </span>
                            )}
                          </div>
                        </div>

                        {trainer.teams && renderTeamBadges(trainer.teams)}

                        {trainer.short_desc && (
                          <p className="text-slate-600 text-xs mt-2">
                            {trainer.short_desc}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-600">
                        <span>Více info</span>
                        <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </section>

      {/* DETAIL TRENÉRA MODAL */}
      {selectedTrainer && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedTrainer(null)}
        >
          <div 
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedTrainer(null)}
              className="absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
              {selectedTrainer.image_url ? (
                <img
                  src={selectedTrainer.image_url}
                  alt={selectedTrainer.name}
                  className="h-36 w-36 rounded-2xl object-cover shadow-md shrink-0 border-2 border-slate-100"
                />
              ) : (
                <div className="h-36 w-36 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 border-2 border-slate-100">
                  <Users className="h-12 w-12" />
                </div>
              )}
              <div className="text-center sm:text-left flex-1">
                
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                  {selectedTrainer.license && (
                    <span className="rounded-md bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                      {selectedTrainer.license}
                    </span>
                  )}
                  {selectedTrainer.private_lessons && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Možnost soukromých lekcí</span>
                    </span>
                  )}
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{selectedTrainer.name}</h3>
                <p className="text-sm font-bold text-blue-600 mt-0.5">{selectedTrainer.role}</p>

                {selectedTrainer.teams && (
                  <div className="mt-3">
                    <span className="text-xs uppercase font-bold text-slate-400 block mb-1">Trénovaná družstva:</span>
                    {renderTeamBadges(selectedTrainer.teams)}
                  </div>
                )}

                {selectedTrainer.specialization && selectedTrainer.specialization.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 justify-center sm:justify-start">
                    {selectedTrainer.specialization.map((spec, i) => (
                      <span key={i} className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
                        {spec}
                      </span>
                    ))}
                  </div>
                )}

                {selectedTrainer.short_desc && (
                  <p className="mt-4 text-sm font-semibold text-slate-800 leading-relaxed border-t border-slate-100 pt-3">
                    {selectedTrainer.short_desc}
                  </p>
                )}
                {selectedTrainer.bio && (
                  <div className="mt-3 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {selectedTrainer.bio}
                  </div>
                )}

                {(selectedTrainer.phone || selectedTrainer.email) ? (
                  <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                    <span className="text-xs uppercase font-bold text-slate-400 block">Přímý kontakt:</span>
                    <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                      {selectedTrainer.phone && (
                        <a
                          href={`tel:${selectedTrainer.phone.replace(/\s+/g, '')}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-colors"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          <span>{selectedTrainer.phone}</span>
                        </a>
                      )}
                      {selectedTrainer.email && (
                        <a
                          href={`mailto:${selectedTrainer.email}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold hover:bg-slate-200 transition-colors"
                        >
                          <Mail className="h-3.5 w-3.5 text-blue-600" />
                          <span>{selectedTrainer.email}</span>
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500 italic">
                    Pro kontaktování trenéra využijte oficiální e-mail info@pkznojmo.cz.
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALY PRO ADMINA (LETÁKY A SPRÁVA TRENÉRŮ) */}
      {isFlyerManagerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col my-auto text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
                  <Settings className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase text-slate-900">Správa letáků</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Nahrajte obrázky letáků a nastavte cílové odkazovací URL.</p>
                </div>
              </div>
              <button onClick={() => setIsFlyerManagerOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-6 overflow-y-auto space-y-4 flex-grow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase text-blue-600 font-bold">Celkem letáků: {flyers.length}</span>
                <button
                  onClick={() => setEditingFlyer({ title: '', image_url: '', link_url: '', is_active: true })}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Přidat nový leták</span>
                </button>
              </div>

              {flyers.map((flyer) => (
                <div key={flyer.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all gap-4 ${flyer.is_active ? 'bg-slate-50 border-slate-200' : 'bg-slate-100/60 border-slate-200 opacity-60'}`}>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 aspect-[1080/1350] rounded-xl overflow-hidden shrink-0 border border-slate-300 bg-slate-200">
                      {flyer.image_url ? <img src={flyer.image_url} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="h-5 w-5 m-auto text-slate-400" />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{flyer.title}</h4>
                      <p className="text-xs font-mono text-blue-600 truncate mt-0.5">{flyer.link_url || 'Bez odkazu'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleToggleFlyerActive(flyer)} className="p-2 rounded-xl border text-xs font-bold">
                      {flyer.is_active ? <Eye className="h-4 w-4 text-emerald-600" /> : <EyeOff className="h-4 w-4 text-slate-400" />}
                    </button>
                    <button onClick={() => setEditingFlyer(flyer)} className="p-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl border border-blue-200"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDeleteFlyer(flyer.id)} className="p-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl border border-red-200"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end shrink-0">
              <button onClick={() => setIsFlyerManagerOpen(false)} className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200">Zavřít</button>
            </div>
          </div>
        </div>
      )}


      {/* EDITOR LETÁKU (ADMIN FORM) */}
      {editingFlyer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 my-auto text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-lg font-black uppercase text-slate-900">
                {editingFlyer.id ? 'Upravit leták' : 'Přidat nový leták'}
              </h3>
              <button onClick={() => setEditingFlyer(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFlyer} className="space-y-4 py-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Název letáku</label>
                <input
                  type="text"
                  placeholder="Např. Letní kemp 2026"
                  value={editingFlyer.title || ''}
                  onChange={(e) => setEditingFlyer({ ...editingFlyer, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Obrázek letáku *</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    required
                    placeholder="https://... URL obrázku"
                    value={editingFlyer.image_url || ''}
                    onChange={(e) => setEditingFlyer({ ...editingFlyer, image_url: e.target.value })}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono"
                  />
                  <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold text-blue-700 cursor-pointer shrink-0">
                    {isUploadingFlyerImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    <span>Nahraj</span>
                    <input type="file" accept="image/*" onChange={handleFlyerImageUpload} className="hidden" disabled={isUploadingFlyerImage} />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Odkaz po kliknutí (URL)</label>
                <input
                  type="text"
                  placeholder="https://... nebo /druzstva"
                  value={editingFlyer.link_url || ''}
                  onChange={(e) => setEditingFlyer({ ...editingFlyer, link_url: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-mono"
                />
              </div>

              <div className="pt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingFlyer.is_active ?? true}
                    onChange={(e) => setEditingFlyer({ ...editingFlyer, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300"
                  />
                  <span className="text-xs font-bold text-slate-700">Aktivní (zobrazovat na hlavní stránce)</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingFlyer(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={isSavingFlyer}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
                >
                  {isSavingFlyer && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Uložit leták</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDITOR TRENÉRA (ADMIN FORM) */}
      {editingTrainer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 my-auto text-slate-900 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
              <h3 className="text-lg font-black uppercase text-slate-900">{editingTrainer.id ? 'Upravit profil trenéra' : 'Přidat nového trenéra'}</h3>
              <button onClick={() => setEditingTrainer(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSaveTrainer} className="space-y-4 py-4 overflow-y-auto flex-grow">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Jméno a příjmení *</label>
                  <input type="text" required placeholder="Mgr. Jan Novák" value={editingTrainer.name || ''} onChange={(e) => setEditingTrainer({ ...editingTrainer, name: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Funkce / Role *</label>
                  <input type="text" required placeholder="Hlavní trenér A-družstva" value={editingTrainer.role || ''} onChange={(e) => setEditingTrainer({ ...editingTrainer, role: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Licence</label>
                  <input type="text" placeholder="Licence I. třídy" value={editingTrainer.license || ''} onChange={(e) => setEditingTrainer({ ...editingTrainer, license: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Kategorie sekce</label>
                  <select value={editingTrainer.category || 'licence3'} onChange={(e) => setEditingTrainer({ ...editingTrainer, category: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-semibold">
                    <option value="vedeni">Vedení klubu</option>
                    <option value="kondice">Suchá příprava & Kondice</option>
                    <option value="licence3">Trenéři s licencí</option>
                    <option value="asistent">Pomocní trenéři</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Trénovaná družstva (oddělená čárkou)</label>
                <input type="text" placeholder="Družstvo A1, Družstvo B" value={editingTrainer.teams || ''} onChange={(e) => setEditingTrainer({ ...editingTrainer, teams: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Fotografie trenéra</label>
                <div className="flex gap-2 items-center">
                  <input type="text" placeholder="https://... URL fotky" value={editingTrainer.image_url || ''} onChange={(e) => setEditingTrainer({ ...editingTrainer, image_url: e.target.value })} className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono" />
                  <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold text-blue-700 cursor-pointer shrink-0">
                    {isUploadingTrainerImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    <span>Nahraj</span>
                    <input type="file" accept="image/*" onChange={handleTrainerImageUpload} className="hidden" disabled={isUploadingTrainerImage} />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Stručný popis (na kartě)</label>
                <input type="text" placeholder="Koncepční vedení tréninkového procesu..." value={editingTrainer.short_desc || ''} onChange={(e) => setEditingTrainer({ ...editingTrainer, short_desc: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Detailní bio / Profil (v modal oknu)</label>
                <textarea rows={3} placeholder="Podrobný popis působení a zkušeností..." value={editingTrainer.bio || ''} onChange={(e) => setEditingTrainer({ ...editingTrainer, bio: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Telefon</label>
                  <input type="text" placeholder="+420 123 456 789" value={editingTrainer.phone || ''} onChange={(e) => setEditingTrainer({ ...editingTrainer, phone: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">E-mail</label>
                  <input type="email" placeholder="trener@pkznojmo.cz" value={editingTrainer.email || ''} onChange={(e) => setEditingTrainer({ ...editingTrainer, email: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm" />
                </div>
              </div>

              <div className="pt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editingTrainer.private_lessons ?? false} onChange={(e) => setEditingTrainer({ ...editingTrainer, private_lessons: e.target.checked })} className="w-4 h-4 text-blue-600 rounded border-slate-300" />
                  <span className="text-xs font-bold text-slate-700">Nabízí soukromé lekce plavání</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setEditingTrainer(null)} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">Zrušit</button>
                <button type="submit" disabled={isSavingTrainer} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md">
                  {isSavingTrainer && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Uložit trenéra</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SPRÁVCE TRENÉRŮ LIST (ADMIN) */}
      {isTrainerManagerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col my-auto text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase text-slate-900">Správa trenérů</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Přidávejte, upravujte a odebírejte trenéry klubu.</p>
                </div>
              </div>
              <button onClick={() => setIsTrainerManagerOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X className="h-5 w-5" /></button>
            </div>

            <div className="py-6 overflow-y-auto space-y-4 flex-grow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase text-blue-600 font-bold">Celkem trenérů v DB: {trainers.length}</span>
                <button onClick={handleOpenCreateTrainer} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold transition-all shadow-sm">
                  <UserPlus className="h-4 w-4" />
                  <span>Přidat trenéra</span>
                </button>
              </div>

              <div className="grid gap-3">
                {trainers.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:border-blue-300 transition-all gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-slate-200 flex items-center justify-center">
                        {t.image_url ? <img src={t.image_url} alt="" className="w-full h-full object-cover" /> : <Users className="h-6 w-6 text-slate-400" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm truncate">{t.name}</h4>
                          {t.license && <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-mono">{t.license}</span>}
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{t.role} • {t.teams || 'Bez zařazení'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => handleOpenEditTrainer(t)} className="p-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl border border-blue-200"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteTrainer(t.id)} className="p-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl border border-red-200"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end shrink-0">
              <button onClick={() => setIsTrainerManagerOpen(false)} className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200">Zavřít</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}