'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Users, Loader2, ShieldAlert, User, Trophy, Sparkles, ChevronDown, Check } from 'lucide-react';

interface Team {
  id: number;
  name: string;
  active?: boolean;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  birth_year: number | null;
  username: string | null;
  csps_id: number | null;
}

interface Performance {
  id?: string | number;
  discipline?: string;
  disciplineName?: string;
  disciplineTitle?: string;
  time?: string;
  timeString?: string;
  points?: number;
  finaPoints?: number;
  waPoints?: number;
  [key: string]: any;
}

function SwimmerCard({ swimmer }: { swimmer: Profile }) {
  const [topPerformances, setTopPerformances] = useState<Performance[]>([]);
  const [loadingPerformances, setLoadingPerformances] = useState<boolean>(false);

  const firstName = swimmer.first_name.toUpperCase();
  const lastName = swimmer.last_name.toUpperCase();

  useEffect(() => {
    if (!swimmer.csps_id) return;

    const fetchPerformances = async () => {
      setLoadingPerformances(true);
      try {
        const res = await fetch(`/api/csps-outputs/${swimmer.csps_id}`);
        
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        const data = await res.json();
        
        const outputs: Performance[] = Array.isArray(data)
          ? data
          : data.outputs || data.items || data.results || [];

        const getPoints = (item: Performance) =>
          item.finaPoints ?? item.waPoints ?? item.points ?? 0;

        const sorted = [...outputs].sort((a, b) => getPoints(b) - getPoints(a));

        const uniquePerformances: Performance[] = [];
        const seenDisciplines = new Set<string>();

        for (const perf of sorted) {
          const discipline = perf.disciplineTitle || perf.discipline || 'Neznámá disciplína';
          
          if (!seenDisciplines.has(discipline)) {
            seenDisciplines.add(discipline);
            uniquePerformances.push(perf);
          }

          if (uniquePerformances.length === 3) break;
        }

        setTopPerformances(uniquePerformances);
      } catch (err) {
        console.error(`Chyba při načítání výkonů pro ČSPS ID ${swimmer.csps_id}:`, err);
      } finally {
        setLoadingPerformances(false);
      }
    };

    fetchPerformances();
  }, [swimmer.csps_id]);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group">
      {/* HORNÍ NÁHLEDOVÁ KARTA / GRAFIKA S FOTKOU */}
      <div className="relative h-64 bg-gradient-to-br from-blue-600 via-sky-700 to-indigo-900 overflow-hidden flex items-end justify-center">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.3)_0%,_transparent_100%)] pointer-events-none" />

        <div className="absolute inset-0 flex flex-col justify-center items-center opacity-10 select-none pointer-events-none font-black italic tracking-tighter text-white leading-none text-2xl uppercase">
          <div>{firstName} {lastName}</div>
          <div>{firstName} {lastName}</div>
          <div>{firstName} {lastName}</div>
          <div>{firstName} {lastName}</div>
        </div>

        <div className="relative z-0 h-full flex items-end justify-center w-full pt-10">
          <User className="h-48 w-48 text-white/30 translate-y-4" />
        </div>
      </div>

      {/* SPODNÍ INFORMACE O PLAVCI A TOP VÝKONY */}
      <div className="p-5 flex-1 flex flex-col justify-between bg-white">
        <div>
          {/* Jméno a Příjmení */}
          <div className="mb-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight italic uppercase leading-none">
              {lastName}
            </h2>
            <h3 className="text-sm font-bold text-slate-400 italic uppercase mt-1">
              {firstName}
            </h3>
          </div>

          {/* NEJLEPŠÍ VÝKONY (PODLE FINA BODŮ) */}
          <div className="border-t border-slate-100 pt-3">
            <div className="flex items-center gap-1.5 mb-2.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              <span>Nejlepší výkony (FINA)</span>
            </div>

            {loadingPerformances ? (
              <div className="flex items-center justify-center py-4 text-slate-400 gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-xs font-bold">Načítám výkony...</span>
              </div>
            ) : topPerformances.length > 0 ? (
              <div className="space-y-2">
                {topPerformances.map((perf, index) => {
                  const discipline = perf.disciplineTitle || perf.discipline || 'Disciplína';
                  const points = perf.finaPoints ?? perf.waPoints ?? perf.points ?? 0;

                  return (
                    <div
                      key={perf.id || index}
                      className="flex items-center justify-between text-xs bg-slate-50/80 rounded-xl px-2.5 py-1.5 font-bold"
                    >
                      <span className="text-slate-700 truncate mr-2 max-w-[130px]" title={discipline}>
                        {discipline}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                          {points} b.
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-slate-400 font-medium italic py-2 text-center">
                {swimmer.csps_id ? 'Žádné dostupné výkony' : 'Není zadané ČSPS ID'}
              </div>
            )}
          </div>
        </div>

        {/* Tlačítko Celý Profil jako rozkliknutelný odkaz */}
        <Link
          href={`/dashboard/plavec/${swimmer.id}`}
          className="mt-6 w-full py-2.5 px-4 rounded-2xl bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-blue-600 transition-all duration-200 flex items-center justify-center gap-1 shadow-sm"
        >
          <span>Celý profil</span>
        </Link>
      </div>
    </div>
  );
}

export default function SwimmerProfilesPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [swimmers, setSwimmers] = useState<Profile[]>([]);
  
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingSwimmers, setLoadingSwimmers] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Zavření dropdownu při kliknutí mimo
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const { data, error } = await supabase
          .from('teams')
          .select('id, name, active')
          .eq('active', true)
          .order('name');

        if (error) throw error;

        setTeams(data || []);
        if (data && data.length > 0) {
          setSelectedTeamId(data[0].id);
        }
      } catch (err) {
        console.error('Chyba při načítání týmů:', err);
      } finally {
        setLoadingTeams(false);
      }
    };

    fetchTeams();
  }, []);

  useEffect(() => {
    if (!selectedTeamId) return;

    const fetchSwimmers = async () => {
      setLoadingSwimmers(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, birth_year, username, csps_id')
          .eq('team_id', selectedTeamId)
          .eq('active', true)
          .order('last_name', { ascending: true });

        if (error) throw error;

        setSwimmers(data || []);
      } catch (err) {
        console.error('Chyba při načítání plavců:', err);
      } finally {
        setLoadingSwimmers(false);
      }
    };

    fetchSwimmers();
  }, [selectedTeamId]);

  const selectedTeamName = teams.find(t => t.id === selectedTeamId)?.name || 'Vyberte skupinu';

  if (loadingTeams) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-bold text-slate-500">Načítám týmy...</p>
      </div>
    );
  }

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
      {/* HLAVIČKA A VÝBĚR TÝMU */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 relative z-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col items-start">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-blue-700 shadow-sm border border-blue-100 mb-6 hover:scale-105 transition-transform cursor-default">
              <Sparkles className="h-4 w-4 text-cyan-500 animate-spin" style={{ animationDuration: '6s' }} />
              <span>ČLENSKÁ DATABÁZE</span>
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] uppercase">
              Profily <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500">plavců</span>
            </h1>
            <p className="mt-4 text-slate-600 text-base sm:text-lg font-normal max-w-2xl leading-relaxed">
              Přehled členů a závodníků podle jednotlivých tréninkových skupin
            </p>
          </div>

          {/* CUSTOM DROPDOWN */}
          <div className="w-full md:w-80 shrink-0 relative" ref={dropdownRef}>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">
              Vyberte tréninkovou skupinu
            </label>
            
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full rounded-2xl border border-slate-200 bg-white/90 backdrop-blur-md px-4 py-3.5 text-sm font-bold text-slate-900 shadow-sm hover:border-blue-400 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10 transition-all flex items-center justify-between cursor-pointer"
            >
              <span className="truncate">{selectedTeamName}</span>
              <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 shrink-0 ml-2 ${isDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-100 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 max-h-72 overflow-y-auto p-1.5">
                {teams.map((team) => {
                  const isSelected = team.id === selectedTeamId;
                  return (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => {
                        setSelectedTeamId(team.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all text-left ${
                        isSelected 
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20' 
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span className="truncate">{team.name}</span>
                      {isSelected && <Check className="h-4 w-4 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* SEZNAM KARET PLAVCI */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {loadingSwimmers ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-3" />
            <span className="text-xs font-bold uppercase tracking-wider">Načítám plavce z databáze...</span>
          </div>
        ) : swimmers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {swimmers.map((swimmer) => (
              <SwimmerCard key={swimmer.id} swimmer={swimmer} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-white/80 backdrop-blur-md p-12 text-center border border-slate-100 shadow-sm max-w-lg mx-auto">
            <ShieldAlert className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 uppercase">Žádní plavci v týmu</h3>
            <p className="text-sm text-slate-500 mt-1">
              V této tréninkové skupině zatím nejsou evidováni žádní aktivní plavci.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}