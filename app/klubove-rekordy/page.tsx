'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Sparkles, Loader2, Calendar, Pencil, X, Check } from 'lucide-react';

interface ClubRecord {
  id?: number | string;
  event: string;
  swimmer_name: string;
  swimmer_id?: string | null;
  time: string;
  year: number;
  category: string;
  gender: 'male' | 'female' | 'M' | 'W';
}

interface SwimmerProfile {
  id: string;
  first_name: string;
  last_name: string;
}

const STANDARD_EVENTS = [
  '50VZ', '100VZ', '200VZ', '400VZ', '800VZ', '1500VZ',
  '50M', '100M', '200M',
  '50Z', '100Z', '200Z',
  '50P', '100P', '200P',
  '100PZ', '200PZ', '400PZ'
];

const normalizeEventName = (name: string) => {
  return name.trim().toUpperCase().replace(/\s+/g, '');
};

const MAIN_GROUPS = [
  {
    id: 'younger_pupils',
    title: 'Mladší žáci',
    subCategories: [
      { id: '9', name: '9 let a mladší' },
      { id: '10', name: '10 let' },
      { id: '11', name: '11 let' },
    ]
  },
  {
    id: 'older_pupils',
    title: 'Starší žáci',
    subCategories: [
      { id: '12', name: '12 letí' },
      { id: '13', name: '13 letí' },
      { id: '14', name: '14 let' },
    ]
  },
  {
    id: 'juniors_open',
    title: 'Junioři / Open',
    subCategories: [
      { id: '15/16', name: 'Mladší junioři' },
      { id: '17/18', name: 'Starší junioři' },
      { id: 'open', name: 'Open' },
    ]
  },
];

export default function ClubRecordsPage() {
  const [activeGroupId, setActiveGroupId] = useState<string>(MAIN_GROUPS[0].id);
  const [records, setRecords] = useState<{ [category: string]: ClubRecord[] }>({});
  const [loading, setLoading] = useState<boolean>(true);
  
  // Stav pro administraci
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<ClubRecord | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Seznam plavců z tabulky profiles
  const [swimmerProfiles, setSwimmerProfiles] = useState<SwimmerProfile[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const allCategoryIds = MAIN_GROUPS.flatMap(group => group.subCategories.map(sub => sub.id));

  // Funkce pro načtení všech rekordů
  const fetchAllRecords = async () => {
    const { data: recordsData, error: recordsError } = await supabase
      .from('club_records')
      .select('*')
      .in('category', allCategoryIds);

    if (recordsError) {
      throw recordsError;
    }

    const grouped: { [category: string]: ClubRecord[] } = {};
    (recordsData || []).forEach((record) => {
      if (!grouped[record.category]) {
        grouped[record.category] = [];
      }
      grouped[record.category].push(record);
    });

    setRecords(grouped);
  };

  useEffect(() => {
    const checkIsAdminRole = async (userId?: string) => {
      if (!userId) return false;
      const { data, error } = await supabase
        .from('profiles')
        .select('roles')
        .eq('id', userId)
        .single();

      if (error || !data || !Array.isArray(data.roles)) return false;
      return data.roles.includes('admin');
    };

    const checkUserAndFetch = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        const userIsAdmin = await checkIsAdminRole(session?.user?.id);
        setIsAdmin(userIsAdmin);

        await fetchAllRecords();

        // Fetch plavců z tabulky profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, roles')
          .contains('roles', ['swimmer']);

        if (!profilesError && profilesData) {
          setSwimmerProfiles(profilesData);
        }
      } catch (err) {
        // Ignorujeme nebo zpracováváme dle potřeby
      } finally {
        setLoading(false);
      }
    };

    checkUserAndFetch();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_, session) => {
      const userIsAdmin = await checkIsAdminRole(session?.user?.id);
      setIsAdmin(userIsAdmin);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getOrderedDisciplineRows = (categoryId: string) => {
    const catRecords = records[categoryId] || [];
    const disciplineMap: { [event: string]: { M?: ClubRecord; W?: ClubRecord } } = {};

    STANDARD_EVENTS.forEach(ev => {
      disciplineMap[ev] = {};
    });

    catRecords.forEach((rec) => {
      const normalizedDBEvent = normalizeEventName(rec.event);
      const matchedStandardEvent = STANDARD_EVENTS.find(se => normalizeEventName(se) === normalizedDBEvent);
      const targetKey = matchedStandardEvent || rec.event;

      if (!disciplineMap[targetKey]) {
        disciplineMap[targetKey] = {};
      }
      
      if (rec.gender === 'male' || rec.gender === 'M') {
        disciplineMap[targetKey].M = rec;
      } else if (rec.gender === 'female' || rec.gender === 'W') {
        disciplineMap[targetKey].W = rec;
      }
    });

    catRecords.forEach((rec) => {
      const normalizedDBEvent = normalizeEventName(rec.event);
      const existsInStandard = STANDARD_EVENTS.some(se => normalizeEventName(se) === normalizedDBEvent);
      if (!existsInStandard) {
        if (!disciplineMap[rec.event]) {
          disciplineMap[rec.event] = {};
        }
        if (rec.gender === 'male' || rec.gender === 'M') {
          disciplineMap[rec.event].M = rec;
        } else if (rec.gender === 'female' || rec.gender === 'W') {
          disciplineMap[rec.event].W = rec;
        }
      }
    });

    return Object.entries(disciplineMap);
  };

  const handleOpenEdit = (categoryId: string, event: string, gender: 'M' | 'W', existingRecord?: ClubRecord) => {
    if (existingRecord) {
      setEditingRecord({ ...existingRecord });
    } else {
      setEditingRecord({
        category: categoryId,
        event: event,
        gender: gender,
        swimmer_name: '',
        swimmer_id: null,
        time: '',
        year: new Date().getFullYear(),
      });
    }
    setShowSuggestions(false);
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingRecord) {
      return;
    }

    setIsSaving(true);
    try {
      const targetGender = 
        editingRecord.gender === 'M' ? 'male' : 
        editingRecord.gender === 'W' ? 'female' : 
        editingRecord.gender;

      const payload = {
        category: editingRecord.category,
        event: editingRecord.event,
        gender: targetGender,
        swimmer_name: editingRecord.swimmer_name.trim(),
        swimmer_id: editingRecord.swimmer_id || null,
        time: editingRecord.time,
        year: Number(editingRecord.year),
      };

      let res;
      if (editingRecord.id) {
        res = await supabase
          .from('club_records')
          .update(payload)
          .eq('id', editingRecord.id)
          .select();
      } else {
        res = await supabase
          .from('club_records')
          .insert([payload])
          .select();
      }

      if (res.error) {
        alert(`Chyba databáze: ${res.error.message} (${res.error.details || 'bez detailu'})`);
        return;
      }

      await fetchAllRecords();
      setEditingRecord(null);

    } catch (err: any) {
      alert(`Neočekávaná chyba: ${err?.message || 'Neznámý problém'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSwimmers = swimmerProfiles.filter(profile => {
    const firstName = profile.first_name || '';
    const lastName = profile.last_name || '';
    const fullName1 = `${firstName} ${lastName}`.trim().toLowerCase();
    const fullName2 = `${lastName} ${firstName}`.trim().toLowerCase();
    const query = (editingRecord?.swimmer_name || '').toLowerCase();

    if (!query) return false;

    return (
      firstName.toLowerCase().includes(query) ||
      lastName.toLowerCase().includes(query) ||
      fullName1.includes(query) ||
      fullName2.includes(query)
    );
  });

  const currentGroup = MAIN_GROUPS.find(g => g.id === activeGroupId) || MAIN_GROUPS[0];

  return (
    <div 
      className="min-h-screen bg-white text-slate-900 pb-24 relative overflow-x-hidden"
      style={{
        backgroundImage: `
          radial-gradient(circle at 80% 10%, rgba(186, 230, 253, 0.45) 0%, transparent 45%),
          radial-gradient(circle at 10% 20%, rgba(191, 219, 254, 0.35) 0%, transparent 40%),
          radial-gradient(circle at 90% 60%, rgba(204, 251, 241, 0.3) 0%, transparent 50%)
        `
      }}
    >
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 relative z-10">
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-3 mb-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-blue-700 shadow-sm border border-blue-100">
              <Sparkles className="h-4 w-4 text-cyan-500 animate-spin" style={{ animationDuration: '6s' }} />
              <span>HISTORIE A TABULKY</span>
            </div>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 shadow-sm border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                Režim administrátora
              </span>
            )}
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] uppercase">
            Klubové <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500">rekordy</span>
          </h1>
          <p className="mt-4 text-slate-600 text-base sm:text-lg font-normal max-w-2xl leading-relaxed">
            Nejlepší historické výkony plavců našeho klubu přehledně v 9 věkových kategoriích.
          </p>

          <div className="mt-8 bg-white/85 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 shadow-sm inline-flex flex-wrap gap-1.5">
            {MAIN_GROUPS.map((group) => {
              const isActive = activeGroupId === group.id;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setActiveGroupId(group.id)}
                  className={`px-6 py-3 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                  }`}
                >
                  {group.title}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-3" />
            <span className="text-xs font-bold uppercase tracking-wider">Načítám rekordy...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {currentGroup.subCategories.map((sub) => {
              const disciplineRows = getOrderedDisciplineRows(sub.id);

              return (
                <div key={sub.id} className="flex flex-col gap-3">
                  
                  <div className="bg-white/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-100 shadow-sm text-center">
                    <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-slate-900">
                      {sub.name}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {disciplineRows.map(([event, genders]) => (
                      <div 
                        key={event}
                        className="bg-white/90 backdrop-blur-md rounded-2xl p-3.5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-2.5 group relative"
                      >
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                          <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100">
                            {event}
                          </span>
                        </div>

                        {/* ŘÁDEK: MUŽI / CHLAPCI */}
                        <div className="flex items-center justify-between group/row relative">
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-blue-50 text-blue-600 text-[9px] font-black flex items-center justify-center border border-blue-100">M</span>
                            <div>
                              <div className="text-xs font-black text-slate-900 uppercase">
                                {genders.M ? genders.M.swimmer_name : <span className="text-slate-300 font-normal italic">Bez záznamu</span>}
                              </div>
                              {genders.M && (
                                <div className="text-[9px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                                  <span className="flex items-center gap-0.5"><Calendar className="h-2 w-2" />{genders.M.year}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {genders.M && (
                              <div className="text-right">
                                <div className="text-sm font-black text-slate-900 tracking-tighter">{genders.M.time}</div>
                              </div>
                            )}

                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(sub.id, event, 'M', genders.M)}
                                className="opacity-0 group-hover/row:opacity-100 transition-opacity p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg border border-blue-200 cursor-pointer"
                                title={genders.M ? "Upravit záznam" : "Přidat záznam"}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* ŘÁDEK: ŽENY / DÍVKY */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-50 group/roww relative">
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-pink-50 text-pink-600 text-[9px] font-black flex items-center justify-center border border-pink-100">Ž</span>
                            <div>
                              <div className="text-xs font-black text-slate-900 uppercase">
                                {genders.W ? genders.W.swimmer_name : <span className="text-slate-300 font-normal italic">Bez záznamu</span>}
                              </div>
                              {genders.W && (
                                <div className="text-[9px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                                  <span className="flex items-center gap-0.5"><Calendar className="h-2 w-2" />{genders.W.year}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {genders.W && (
                              <div className="text-right">
                                <div className="text-sm font-black text-slate-900 tracking-tighter">{genders.W.time}</div>
                              </div>
                            )}

                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(sub.id, event, 'W', genders.W)}
                                className="opacity-0 group-hover/roww:opacity-100 transition-opacity p-1.5 bg-pink-50 text-pink-600 hover:bg-pink-100 rounded-lg border border-pink-200 cursor-pointer"
                                title={genders.W ? "Upravit záznam" : "Přidat záznam"}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {editingRecord && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-lg font-black uppercase text-slate-900">
                  {editingRecord.id ? 'Upravit rekord' : 'Přidat rekord'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Disciplína: <span className="font-bold text-blue-600">{editingRecord.event}</span> ({editingRecord.gender === 'M' || editingRecord.gender === 'male' ? 'Muži' : 'Ženy'}, {editingRecord.category})
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setEditingRecord(null)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecord} className="space-y-4">
              
              <div className="relative" ref={suggestionsRef}>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Jméno plavce (z profilů)
                </label>
                <input
                  type="text"
                  required
                  value={editingRecord.swimmer_name}
                  onChange={(e) => {
                    setEditingRecord({ 
                      ...editingRecord, 
                      swimmer_name: e.target.value,
                      swimmer_id: null 
                    });
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Začněte psát jméno nebo příjmení..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
                />

                {editingRecord.swimmer_id !== null && editingRecord.swimmer_id !== undefined && (
                  <div className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                    <Check className="h-3 w-3" /> Propojeno s profilem plavce (ID: {String(editingRecord.swimmer_id).slice(0, 8)}...)
                  </div>
                )}

                {showSuggestions && filteredSwimmers.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-20">
                    {filteredSwimmers.map((profile) => {
                      const displayName = `${profile.first_name} ${profile.last_name}`.trim();
                      return (
                        <button
                          key={profile.id}
                          type="button"
                          onClick={() => {
                            setEditingRecord({ 
                              ...editingRecord, 
                              swimmer_name: displayName,
                              swimmer_id: profile.id 
                            });
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors border-b border-slate-50 last:border-none flex items-center justify-between"
                        >
                          <span>{displayName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Plavec</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Čas
                  </label>
                  <input
                    type="text"
                    required
                    value={editingRecord.time}
                    onChange={(e) => setEditingRecord({ ...editingRecord, time: e.target.value })}
                    placeholder="např. 00:25,83"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Rok překonání
                  </label>
                  <input
                    type="number"
                    required
                    value={editingRecord.year}
                    onChange={(e) => setEditingRecord({ ...editingRecord, year: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Uložit změny
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}