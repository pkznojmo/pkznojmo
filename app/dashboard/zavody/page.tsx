'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Trophy, 
  ArrowLeft, 
  Loader2, 
  Calendar, 
  MapPin, 
  Star, 
  Search, 
  Filter, 
  ExternalLink,
  Flame,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface CspsCompetition {
  competitionId: number;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  locationRegion?: string;
  contactName?: string;
  contactEmail?: string;
  competitionState?: string;
  poolLength?: number;
  sport?: number;
  competitionTags?: { competitionTagId: number; title: string; key: string }[];
  hasPlan?: boolean;
  hasResults?: boolean;
  planFileName?: string;
  resultsFileName?: string;
}

const monthNames = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
];

export default function ZavodyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isCoachOrAdmin, setIsCoachOrAdmin] = useState(false);

  const [competitions, setCompetitions] = useState<CspsCompetition[]>([]);
  const [targetCompetitionIds, setTargetCompetitionIds] = useState<Set<number>>(new Set());

  // Filtry
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'targets_only' | 'all_portal'>('targets_only');
  
  // Filtry pro délku bazénu a typy (tagy)
  const [selectedPools, setSelectedPools] = useState<number[]>([]); 
  const [selectedTags, setSelectedTags] = useState<string[]>([]); 

  useEffect(() => {
    loadData(selectedYear);
  }, [selectedYear]);

  const loadData = async (year: number) => {
    setLoading(true);
    try {
      // 1. Zjištění oprávnění trenéra/admina
      const { data: { session } } = await supabase.auth.getSession();
      let userCanManage = false;
      if (session) {
        const { data: myProfile } = await supabase
          .from('profiles')
          .select('roles')
          .eq('id', session.user.id)
          .single();
        
        if (myProfile && Array.isArray(myProfile.roles)) {
          const lowerRoles = myProfile.roles.map((r: string) => r.toLowerCase());
          if (lowerRoles.some(r => ['coach', 'admin', 'trenér', 'trainer'].includes(r))) {
            userCanManage = true;
          }
        }
      }
      setIsCoachOrAdmin(userCanManage);
      if (userCanManage) {
        setViewMode('all_portal');
      }

      // 2. Načtení z API route
      const res = await fetch(`/api/competitions?year=${year}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) {
          json.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
          setCompetitions(json);
        }
      }

      // 3. Načtení označených závodů z DB
      const { data: dbTargets, error: dbErr } = await supabase
        .from('club_competitions')
        .select('competition_id')
        .eq('is_target', true);

      if (!dbErr && dbTargets) {
        const idsSet = new Set<number>(dbTargets.map((item: any) => item.competition_id));
        setTargetCompetitionIds(idsSet);
      }

    } catch (err) {
      console.error('Chyba při načítání dat závodů:', err);
    } finally {
      setLoading(false);
    }
  };

  // Přepnutí hvězdičky
  const toggleTargetCompetition = async (e: React.MouseEvent, competitionId: number) => {
    e.stopPropagation(); 
    if (!isCoachOrAdmin) return;

    const isCurrentlyTarget = targetCompetitionIds.has(competitionId);
    const newTargetState = !isCurrentlyTarget;

    const updatedSet = new Set(targetCompetitionIds);
    if (newTargetState) updatedSet.add(competitionId);
    else updatedSet.delete(competitionId);
    setTargetCompetitionIds(updatedSet);

    const { error } = await supabase
      .from('club_competitions')
      .upsert(
        { competition_id: competitionId, is_target: newTargetState },
        { onConflict: 'competition_id' }
      );

    if (error) {
      console.error('Chyba při ukládání:', error);
      loadData(selectedYear);
    }
  };

  const togglePoolFilter = (pool: number) => {
    setSelectedPools(prev => 
      prev.includes(pool) ? prev.filter(p => p !== pool) : [...prev, pool]
    );
  };

  const toggleTagFilter = (tagKey: string) => {
    setSelectedTags(prev => 
      prev.includes(tagKey) ? prev.filter(t => t !== tagKey) : [...prev, tagKey]
    );
  };

  const allAvailableTags = Array.from(
    new Map(
      competitions.flatMap(c => c.competitionTags || []).map(t => [t.key, t])
    ).values()
  );

  const filteredCompetitions = competitions.filter(comp => {
    // Ponechat pouze závody s "sport": 1 (pokud je vlastnost přítomna)
    if (comp.sport !== undefined && comp.sport !== 1) {
      return false;
    }

    const isTarget = targetCompetitionIds.has(comp.competitionId);
    if (viewMode === 'targets_only' && !isTarget) return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTitle = comp.title?.toLowerCase().includes(q);
      const matchLoc = comp.location?.toLowerCase().includes(q);
      if (!matchTitle && !matchLoc) return false;
    }

    if (selectedPools.length > 0 && (!comp.poolLength || !selectedPools.includes(comp.poolLength))) {
      return false;
    }

    if (selectedTags.length > 0) {
      const compTagKeys = (comp.competitionTags || []).map(t => t.key);
      const hasMatchingTag = selectedTags.some(tag => compTagKeys.includes(tag));
      if (!hasMatchingTag) return false;
    }

    return true;
  });

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const ongoingCompetitions = filteredCompetitions.filter(comp => {
    const start = new Date(comp.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(comp.endDate || comp.startDate);
    end.setHours(23, 59, 59, 999);
    return now >= start && now <= end;
  });

  const upcomingCompetitions = filteredCompetitions.filter(comp => {
    const compDate = new Date(comp.endDate || comp.startDate);
    compDate.setHours(23, 59, 59, 999);
    return compDate >= now;
  });

  const passedCompetitions = filteredCompetitions.filter(comp => {
    const compDate = new Date(comp.endDate || comp.startDate);
    compDate.setHours(23, 59, 59, 999);
    return compDate < now;
  });

  const groupCompetitionsByMonth = (comps: CspsCompetition[]) => {
    const monthsMap: { [monthIndex: number]: CspsCompetition[] } = {};
    comps.forEach(comp => {
      const startMonth = new Date(comp.startDate).getMonth();
      const endMonth = new Date(comp.endDate || comp.startDate).getMonth();
      
      if (!monthsMap[startMonth]) monthsMap[startMonth] = [];
      if (!monthsMap[startMonth].some(c => c.competitionId === comp.competitionId)) {
        monthsMap[startMonth].push(comp);
      }
      
      if (endMonth !== startMonth) {
        if (!monthsMap[endMonth]) monthsMap[endMonth] = [];
        if (!monthsMap[endMonth].some(c => c.competitionId === comp.competitionId)) {
          monthsMap[endMonth].push(comp);
        }
      }
    });
    return monthsMap;
  };

  const upcomingByMonth = groupCompetitionsByMonth(upcomingCompetitions);
  const passedByMonth = groupCompetitionsByMonth(passedCompetitions);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 gap-2 p-4">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="text-xs font-semibold text-slate-600">Načítám kalendář závodů...</span>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-5 max-w-7xl mx-auto space-y-5 pb-20 md:pb-6 font-sans text-slate-800">
      
      {/* Horní lišta */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Zpět</span>
        </button>

        <div className="px-3 py-1 bg-blue-50 border border-blue-200/80 rounded-lg text-xs font-bold text-blue-700 flex items-center gap-1.5 shadow-2xs">
          <Trophy className="w-3.5 h-3.5 text-blue-600" />
          <span>Oficiální kalendář ČSPS</span>
        </div>
      </div>

      {/* Hlavička & Přepínač roku + Pohledu */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Přehled závodů
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isCoachOrAdmin 
              ? 'Režim správce: Označte hvězdičkou závody, na které klub vyráží.' 
              : 'Kompletní přehled vybraných závodů, na které se náš plavecký klub připravuje.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* Výběr roku se šipkami (od 2014 do 2050) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setSelectedYear(prev => Math.max(2014, prev - 1))}
              disabled={selectedYear <= 2014}
              className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 transition-colors cursor-pointer"
              title="Předchozí rok"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-xs font-black text-slate-900 bg-white rounded-lg shadow-xs min-w-[55px] text-center">
              {selectedYear}
            </span>
            <button
              onClick={() => setSelectedYear(prev => Math.min(2050, prev + 1))}
              disabled={selectedYear >= 2050}
              className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 transition-colors cursor-pointer"
              title="Následující rok"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Přepínač pohledu pro trenéra */}
          {isCoachOrAdmin && (
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-xl border border-slate-200/60">
              <button
                onClick={() => setViewMode('targets_only')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewMode === 'targets_only' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Klubové ({targetCompetitionIds.size})
              </button>
              <button
                onClick={() => setViewMode('all_portal')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewMode === 'all_portal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Všechny ({competitions.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FILTRAČNÍ PANEL */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Filtry a parametry</span>
          </div>
          {(selectedPools.length > 0 || selectedTags.length > 0 || searchQuery) && (
            <button
              onClick={() => { setSelectedPools([]); setSelectedTags([]); setSearchQuery(''); }}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              Resetovat filtry
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Hledat název nebo město..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500">Bazén:</span>
            {[25, 50].map((pool) => {
              const active = selectedPools.includes(pool);
              return (
                <button
                  key={pool}
                  onClick={() => togglePoolFilter(pool)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    active 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs' 
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {pool}m
                </button>
              );
            })}
          </div>
        </div>

        {allAvailableTags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Typ:</span>
            {allAvailableTags.map((tag) => {
              const active = selectedTags.includes(tag.key);
              return (
                <button
                  key={tag.competitionTagId}
                  onClick={() => toggleTagFilter(tag.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    active
                      ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tag.title}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* PROBÍHAJÍCÍ ZÁVODY DNES */}
      {ongoingCompetitions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-wider px-0.5">
            <Flame className="w-3.5 h-3.5 fill-emerald-500 text-emerald-600 animate-pulse" />
            <span>Právě probíhá ({ongoingCompetitions.length})</span>
          </div>

          <div className="space-y-2">
            {ongoingCompetitions.map(comp => {
              const isTarget = targetCompetitionIds.has(comp.competitionId);
              const startDateStr = comp.startDate ? new Date(comp.startDate).toLocaleDateString('cs-CZ') : '';
              const endDateStr = comp.endDate ? new Date(comp.endDate).toLocaleDateString('cs-CZ') : '';
              const dateDisplay = startDateStr === endDateStr ? startDateStr : `${startDateStr} – ${endDateStr}`;

              return (
                <div 
                  key={comp.competitionId}
                  onClick={() => router.push(`/dashboard/zavod/${comp.competitionId}`)}
                  className="relative bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-3.5 sm:p-4 rounded-2xl border border-emerald-500/30 shadow-md cursor-pointer hover:border-emerald-400/60 transition-all group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 overflow-hidden"
                >
                  <div className="space-y-1.5 flex-1 relative z-10">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-lg text-[11px] font-bold flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {dateDisplay}
                      </span>
                      {comp.poolLength && (
                        <span className="px-2 py-0.5 bg-white/10 text-slate-200 border border-white/10 rounded-lg text-[11px] font-bold">
                          {comp.poolLength}m
                        </span>
                      )}
                    </div>
                    <h2 className="text-sm font-extrabold text-white group-hover:text-emerald-200 transition-colors">
                      {comp.title}
                    </h2>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto relative z-10 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10 text-xs">
                    {comp.location && (
                      <span className="flex items-center gap-1 text-slate-300 text-xs">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        <span>{comp.location}</span>
                      </span>
                    )}

                    <div className="flex items-center gap-1.5">
                      <a
                        href={`https://vysledky.czechswimming.cz/souteze/${comp.competitionId}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors"
                      >
                        <span>ČSPS</span>
                        <ExternalLink className="w-3 h-3 text-emerald-400" />
                      </a>

                      {isCoachOrAdmin && (
                        <button
                          onClick={(e) => toggleTargetCompetition(e, comp.competitionId)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            isTarget 
                              ? 'bg-amber-500 border-amber-400 text-white shadow-xs' 
                              : 'bg-white/10 border-white/20 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${isTarget ? 'fill-white' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* HLAVNÍ OBSAH: 2 SLOUPCE (Měsíční přehled) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        
        {/* SLOUPEC 1: NÁSLEDUJÍCÍ ZÁVODY */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              <h2 className="font-extrabold text-slate-900 text-sm">Následující závody</h2>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {upcomingCompetitions.length}
            </span>
          </div>

          <div className="space-y-3">
            {Object.keys(upcomingByMonth).length > 0 ? (
              Object.keys(upcomingByMonth).map(monthKey => {
                const mIdx = Number(monthKey);
                const compsInMonth = upcomingByMonth[mIdx];

                return (
                  <details key={mIdx} open className="group bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <summary className="flex items-center justify-between p-3.5 bg-slate-50/80 hover:bg-slate-100/80 cursor-pointer select-none transition-colors">
                      <div className="flex items-center gap-2.5">
                        <span className="font-extrabold text-slate-900 text-xs">{monthNames[mIdx]}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {compsInMonth.length}
                        </span>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-open:rotate-180 transition-transform" />
                    </summary>

                    <div className="p-3 space-y-2 border-t border-slate-100">
                      {compsInMonth.map((comp) => {
                        const isTarget = targetCompetitionIds.has(comp.competitionId);
                        const startDateStr = comp.startDate ? new Date(comp.startDate).toLocaleDateString('cs-CZ') : '';
                        const endDateStr = comp.endDate ? new Date(comp.endDate).toLocaleDateString('cs-CZ') : '';
                        const dateDisplay = startDateStr === endDateStr ? startDateStr : `${startDateStr} – ${endDateStr}`;

                        return (
                          <div
                            key={comp.competitionId}
                            onClick={() => router.push(`/dashboard/zavod/${comp.competitionId}`)}
                            className={`p-3 rounded-xl border transition-all bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-2xs hover:shadow-xs cursor-pointer group/card ${
                              isTarget ? 'border-amber-300 bg-amber-50/10' : 'border-slate-200/80 hover:border-slate-300'
                            }`}
                          >
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {isCoachOrAdmin && (
                                  <button
                                    onClick={(e) => toggleTargetCompetition(e, comp.competitionId)}
                                    title={isTarget ? "Odebrat z klubových" : "Označit jako klubový závod"}
                                    className={`p-1 rounded-lg border transition-all cursor-pointer ${
                                      isTarget 
                                        ? 'bg-amber-100 border-amber-300 text-amber-600' 
                                        : 'bg-slate-50 border-slate-200 text-slate-300 hover:text-slate-400'
                                    }`}
                                  >
                                    <Star className={`w-3.5 h-3.5 ${isTarget ? 'fill-amber-500 text-amber-600' : ''}`} />
                                  </button>
                                )}
                                {!isCoachOrAdmin && isTarget && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-200">
                                    <Star className="w-3 h-3 fill-amber-500 text-amber-600" />
                                    <span>Klubový</span>
                                  </span>
                                )}

                                <h3 className="font-bold text-slate-900 text-xs group-hover/card:text-blue-600 transition-colors">
                                  {comp.title}
                                </h3>

                                {comp.poolLength && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                    {comp.poolLength}m
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2.5 text-[11px] text-slate-500 flex-wrap">
                                {comp.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-slate-400" />
                                    <span>{comp.location}</span>
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  <span>{dateDisplay}</span>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                              <a
                                href={`https://vysledky.czechswimming.cz/souteze/${comp.competitionId}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 transition-colors"
                              >
                                <span>ČSPS</span>
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 italic bg-white rounded-xl border border-dashed border-slate-200">
                Žádné nadcházející závody v této kategorii.
              </div>
            )}
          </div>
        </div>

        {/* SLOUPEC 2: PROBĚHLÉ ZÁVODY */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-slate-400" />
              <h2 className="font-extrabold text-slate-700 text-sm">Proběhlé závody</h2>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
              {passedCompetitions.length}
            </span>
          </div>

          <div className="space-y-3">
            {Object.keys(passedByMonth).length > 0 ? (
              Object.keys(passedByMonth).map(monthKey => {
                const mIdx = Number(monthKey);
                const compsInMonth = passedByMonth[mIdx];

                return (
                  <details key={mIdx} className="group bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <summary className="flex items-center justify-between p-3.5 bg-slate-50/80 hover:bg-slate-100/80 cursor-pointer select-none transition-colors">
                      <div className="flex items-center gap-2.5">
                        <span className="font-extrabold text-slate-700 text-xs">{monthNames[mIdx]}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {compsInMonth.length}
                        </span>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-open:rotate-180 transition-transform" />
                    </summary>

                    <div className="p-3 space-y-2 border-t border-slate-100">
                      {compsInMonth.map((comp) => {
                        const isTarget = targetCompetitionIds.has(comp.competitionId);
                        const startDateStr = comp.startDate ? new Date(comp.startDate).toLocaleDateString('cs-CZ') : '';
                        const endDateStr = comp.endDate ? new Date(comp.endDate).toLocaleDateString('cs-CZ') : '';
                        const dateDisplay = startDateStr === endDateStr ? startDateStr : `${startDateStr} – ${endDateStr}`;

                        return (
                          <div
                            key={comp.competitionId}
                            onClick={() => router.push(`/dashboard/zavod/${comp.competitionId}`)}
                            className="p-3 rounded-xl border border-slate-200/60 bg-slate-50/50 hover:bg-white transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-2xs hover:shadow-xs cursor-pointer group/card opacity-80 hover:opacity-100"
                          >
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {isCoachOrAdmin && (
                                  <button
                                    onClick={(e) => toggleTargetCompetition(e, comp.competitionId)}
                                    className={`p-1 rounded-lg border transition-all cursor-pointer ${
                                      isTarget ? 'bg-amber-100 border-amber-300 text-amber-600' : 'bg-slate-100 border-slate-200 text-slate-300'
                                    }`}
                                  >
                                    <Star className={`w-3.5 h-3.5 ${isTarget ? 'fill-amber-500 text-amber-600' : ''}`} />
                                  </button>
                                )}
                                <h3 className="font-semibold text-slate-700 text-xs group-hover/card:text-slate-900 transition-colors">
                                  {comp.title}
                                </h3>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200/60 text-slate-500">
                                  Proběhlo
                                </span>
                              </div>

                              <div className="flex items-center gap-2.5 text-[11px] text-slate-400 flex-wrap">
                                {comp.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    <span>{comp.location}</span>
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{dateDisplay}</span>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-200/50">
                              <a
                                href={`https://vysledky.czechswimming.cz/souteze/${comp.competitionId}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[11px] font-semibold text-blue-700 transition-colors"
                              >
                                <span>Výsledky</span>
                                <ExternalLink className="w-3 h-3 text-blue-400" />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 italic bg-white rounded-xl border border-dashed border-slate-200">
                Žádné proběhlé závody v této filtraci.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}