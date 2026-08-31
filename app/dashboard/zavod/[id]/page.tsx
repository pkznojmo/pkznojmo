'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProfile } from '@/components/ProfileContext';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, 
  Loader2, 
  Calendar, 
  MapPin, 
  ExternalLink, 
  Bus, 
  Users, 
  Trophy, 
  Edit3, 
  Save, 
  Star,
  Clock,
  Medal,
  RefreshCw,
  Sparkles,
  X,
  FileText,
  ListOrdered,
  User
} from 'lucide-react';

interface CompetitionDetail {
  competitionId: number;
  title: string;
  description?: string;
  sportTitle?: string;
  poolLength?: number;
  location?: string;
  locationRegionName?: string;
  competitionStartDate?: string;
  competitionEndDate?: string;
  registrationEndDate?: string;
  halfDayDtos?: any[];
}

export default function ZavodDetailPage() {
  const router = useRouter();
  const params = useParams();
  const competitionId = Number(params.id);
  const { activeProfile } = useProfile();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'disciplines' | 'club' | 'myRace'>('disciplines');

  // Data
  const [competition, setCompetition] = useState<CompetitionDetail | null>(null);
  const [applicationsData, setApplicationsData] = useState<any>(null);
  const [resultsData, setResultsData] = useState<Record<string, any>>({});
  const [clubSwimmers, setClubSwimmers] = useState<any[]>([]);
  const [updatingResults, setUpdatingResults] = useState(false);

  // Uživatelské ČSPS ID
  const [userCspsId, setUserCspsId] = useState<number | null>(null);

  // Stav pro modal okno
  const [modalContent, setModalContent] = useState<{
    title: string;
    type: 'applications' | 'startlist' | 'results';
    items: any[];
  } | null>(null);

  // Klubová data (Supabase)
  const [isCoachOrAdmin, setIsCoachOrAdmin] = useState(false);
  const [isTarget, setIsTarget] = useState(false);
  const [departureZnojmo, setDepartureZnojmo] = useState('');
  const [venueMeeting, setVenueMeeting] = useState('');
  const [coachNotes, setCoachNotes] = useState('');
  const [isEditingLogistics, setIsEditingLogistics] = useState(false);
  const [savingLogistics, setSavingLogistics] = useState(false);

  useEffect(() => {
    if (competitionId) {
      loadAllData();
    }
  }, [competitionId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: myProfile } = await supabase
          .from('profiles')
          .select('roles, csps_id')
          .eq('id', session.user.id)
          .single();
        
        if (myProfile) {
          if (myProfile.csps_id) {
            setUserCspsId(Number(myProfile.csps_id));
          }
          if (Array.isArray(myProfile.roles)) {
            const lowerRoles = myProfile.roles.map((r: string) => r.toLowerCase());
            if (lowerRoles.some(r => ['coach', 'admin', 'trenér', 'trainer'].includes(r))) {
              setIsCoachOrAdmin(true);
            }
          }
        }
      }

      const { data: clubData } = await supabase
        .from('club_competitions')
        .select('*')
        .eq('competition_id', competitionId)
        .maybeSingle();

      if (clubData) {
        setIsTarget(clubData.is_target || false);
        setDepartureZnojmo(clubData.departure_znojmo || '');
        setVenueMeeting(clubData.venue_meeting || '');
        setCoachNotes(clubData.coach_notes || '');
        if (clubData.results_cache) {
          setCompetition(clubData.results_cache.competition);
          setResultsData(clubData.results_cache.results || {});
          setClubSwimmers(clubData.results_cache.clubSwimmers || []);
        }
      }

      const res = await fetch(`/api/competitions/${competitionId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.competition) setCompetition(json.competition);
        setApplicationsData(json.applications);
        
        if (!clubData?.results_cache) {
          const resCache = await fetch(`/api/competitions/${competitionId}/results`);
          if (resCache.ok) {
            const cacheJson = await resCache.json();
            if (cacheJson.results) setResultsData(cacheJson.results);
            if (cacheJson.clubSwimmers) setClubSwimmers(cacheJson.clubSwimmers);
          }
        }
      }

    } catch (err) {
      console.error('Chyba při načítání detailu závodu:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateResults = async () => {
    setUpdatingResults(true);
    try {
      const res = await fetch(`/api/competitions/${competitionId}/results`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setCompetition(data.competition);
        const newResults = data.results || {};
        const newSwimmers = data.clubSwimmers || [];

        setResultsData(newResults);
        setClubSwimmers(newSwimmers);

        // --- AGREGACE KLUBOVÝCH PLAVCŮ ---
        const tempAggregated = newSwimmers.reduce((acc: any[], curr: any) => {
          const key = `${curr.firstName?.trim()}_${curr.lastName?.trim()}_${curr.birthYear}_${curr.clubAbbrev}`;
          let existing = acc.find(s => `${s.firstName?.trim()}_${s.lastName?.trim()}_${s.birthYear}_${s.clubAbbrev}` === key);
          const currResults = Array.isArray(curr.results) ? curr.results : [curr];

          if (existing) {
            existing.results = [...existing.results, ...currResults];
          } else {
            acc.push({ 
              swimmerId: curr.swimmerId || curr.id || curr.competitorId || null,
              firstName: curr.firstName, 
              lastName: curr.lastName, 
              birthYear: curr.birthYear, 
              clubAbbrev: curr.clubAbbrev, 
              results: currResults 
            });
          }
          return acc;
        }, []);

        let totalStartsSum = 0;
        let totalOrSum = 0;
        let totalNrSum = 0;
        let totalDsqSum = 0;

        tempAggregated.forEach(swimmer => {
          swimmer.results.forEach((res: any) => {
            totalStartsSum++;
            const formattedTime = formatSwimmingTime(res.time);
            const isDsq = formattedTime === 'DSQ';
            const hasSwum = res.time !== undefined && res.time !== null && res.time !== '' && res.time !== '-' && !isDsq;

            if (isDsq) {
              totalDsqSum++;
            } else if (hasSwum) {
              if (!res.personalBestTime) {
                totalNrSum++;
              } else if (res.isPersonalBest) {
                totalOrSum++;
              }
            }
          });
        });
        const totalSwimmersSum = tempAggregated.length;

        await supabase
          .from('club_competitions')
          .upsert({
            competition_id: competitionId,
            total_starts: totalStartsSum,
            total_or: totalOrSum,
            total_nr: totalNrSum,
            total_dsq: totalDsqSum,
            total_swimmers: totalSwimmersSum,
            updated_at: new Date().toISOString()
          }, { onConflict: 'competition_id' });

        const validCspsIds = new Set();
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('csps_id')
          .not('csps_id', 'is', null);
        
        if (profilesData) {
          profilesData.forEach(p => validCspsIds.add(p.csps_id));
        }

        const statsToUpsert = tempAggregated
          .filter(swimmer => swimmer.swimmerId && validCspsIds.has(Number(swimmer.swimmerId)))
          .map(swimmer => {
            let starts = 0;
            let orCount = 0;
            let nrCount = 0;
            let dsqCount = 0;

            swimmer.results.forEach((res: any) => {
              starts++;
              const formattedTime = formatSwimmingTime(res.time);
              const isDsq = formattedTime === 'DSQ';
              const hasSwum = res.time !== undefined && res.time !== null && res.time !== '' && res.time !== '-' && !isDsq;

              if (isDsq) {
                dsqCount++;
              } else if (hasSwum) {
                if (!res.personalBestTime) {
                  nrCount++;
                } else if (res.isPersonalBest) {
                  orCount++;
                }
              }
            });

            return {
              competition_id: competitionId,
              csps_id: Number(swimmer.swimmerId),
              first_name: swimmer.firstName,
              last_name: swimmer.lastName,
              birth_year: swimmer.birthYear,
              club_abbrev: swimmer.clubAbbrev,
              starts_count: starts,
              or_count: orCount,
              nr_count: nrCount,
              dsq_count: dsqCount,
              updated_at: new Date().toISOString()
            };
          });

        if (statsToUpsert.length > 0) {
          await supabase
            .from('swimmer_competition_stats')
            .upsert(statsToUpsert, { onConflict: 'competition_id,csps_id' });
        }

      } else {
        alert('Nepodařilo se aktualizovat výsledky.');
      }
    } catch (err) {
      console.error('Chyba při aktualizaci výsledků:', err);
      alert('Chyba připojení při aktualizaci výsledků.');
    } finally {
      setUpdatingResults(false);
    }
  };

  const saveLogisticsData = async () => {
    setSavingLogistics(true);
    try {
      const { error } = await supabase
        .from('club_competitions')
        .upsert({
          competition_id: competitionId,
          is_target: isTarget,
          departure_znojmo: departureZnojmo,
          venue_meeting: venueMeeting,
          coach_notes: coachNotes,
          updated_at: new Date().toISOString()
        }, { onConflict: 'competition_id' });

      if (error) throw error;
      setIsEditingLogistics(false);
    } catch (err) {
      console.error('Chyba při ukládání logistiky:', err);
      alert('Nepodařilo se uložit změny.');
    } finally {
      setSavingLogistics(false);
    }
  };

  const toggleTargetStatus = async () => {
    const newTarget = !isTarget;
    setIsTarget(newTarget);
    await supabase
      .from('club_competitions')
      .upsert({ competition_id: competitionId, is_target: newTarget }, { onConflict: 'competition_id' });
  };

  const isPKZnSwimmer = (clubAbbrev?: string, club?: string) => {
    const abbrev = (clubAbbrev || '').trim().toUpperCase();
    const fullName = (club || '').trim().toUpperCase();
    return abbrev === 'PKZN' || abbrev === 'PKZNO' || fullName.includes('PLAVECKÝ KLUB ZNOJMO');
  };

  const formatSwimmingTime = (timeInput: any) => {
    if (timeInput === undefined || timeInput === null || timeInput === '') return '-';
    
    if (typeof timeInput === 'string') {
      const trimmed = timeInput.trim();
      if (trimmed === '100:39.99' || trimmed === '99:99.99' || trimmed.includes('100:39.99') || trimmed.includes('99:99.99')) {
        return 'DSQ';
      }
      return trimmed;
    }

    if (typeof timeInput === 'number') {
      const totalSeconds = timeInput / 1000;
      const mins = Math.floor(totalSeconds / 60);
      const secs = (totalSeconds % 60).toFixed(2);
      const formatted = mins > 0 ? `${mins}:${secs.padStart(5, '0')}` : `${secs} s`;

      if (formatted.startsWith('100:39') || formatted.startsWith('99:99') || timeInput > 6000000) {
        return 'DSQ';
      }
      return mins > 0 ? `${mins}:${secs.padStart(5, '0')}` : `${secs} s`;
    }

    return '-';
  };

  const formatModalTime = (item: any, type?: 'applications' | 'startlist' | 'results') => {
    let rawVal = null;
    if (type === 'startlist') {
      rawVal = item.entryTime !== undefined && item.entryTime !== null 
        ? item.entryTime 
        : item.qualificationTime;
    } else if (type === 'results') {
      rawVal = item.time !== undefined && item.time !== null ? item.time : (item.entryTime || item.qualificationTime);
    } else {
      rawVal = item.qualificationTime !== undefined && item.qualificationTime !== null 
        ? item.qualificationTime 
        : (item.entryTime !== undefined && item.entryTime !== null ? item.entryTime : item.time);
    }

    const formatted = formatSwimmingTime(rawVal);
    
    if (formatted === 'DSQ') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[11px] font-black tracking-wider">
          DSQ
        </span>
      );
    }
    return formatted;
  };

  const openApplicationsModal = (catTitle: string, catId: number, gender?: string) => {
    let foundApps: any[] = [];
    if (applicationsData && applicationsData.halfDays) {
      for (const hd of applicationsData.halfDays) {
        for (const cat of hd.competitionCategories || hd.categoryDtos || []) {
          const matchId = cat.id === catId || cat.competitionCategoryId === catId;
          const matchGender = gender ? cat.gender === gender : true;
          if (matchId && matchGender) {
            foundApps = cat.applications || [];
            break;
          }
        }
        if (foundApps.length > 0) break;
      }
    }
    setModalContent({
      title: `Přihlášky: ${catTitle} ${gender ? `(${gender === 'MALE' ? 'Muži' : 'Ženy'})` : ''}`,
      type: 'applications',
      items: foundApps
    });
  };

  const openStartListModal = (catTitle: string, catId: number, gender?: string) => {
    let foundItems: any[] = [];
    if (resultsData[catId]?.startList || resultsData[catId]?.singleOutputs) {
      foundItems = resultsData[catId]?.startList || resultsData[catId]?.singleOutputs;
    } else if (applicationsData && applicationsData.halfDays) {
      for (const hd of applicationsData.halfDays) {
        for (const cat of hd.competitionCategories || hd.categoryDtos || []) {
          const matchId = cat.id === catId || cat.competitionCategoryId === catId;
          const matchGender = gender ? cat.gender === gender : true;
          if (matchId && matchGender) {
            foundItems = cat.applications || [];
            break;
          }
        }
        if (foundItems.length > 0) break;
      }
    }
    setModalContent({
      title: `Startovní listina: ${catTitle} ${gender ? `(${gender === 'MALE' ? 'Muži' : 'Ženy'})` : ''}`,
      type: 'startlist',
      items: foundItems
    });
  };

  const openResultsModal = (catTitle: string, catId: number, gender?: string) => {
    const outputs = resultsData[catId]?.singleOutputs || [];
    setModalContent({
      title: `Výsledky: ${catTitle} ${gender ? `(${gender === 'MALE' ? 'Muži' : 'Ženy'})` : ''}`,
      type: 'results',
      items: outputs
    });
  };

  const getTimeDifferenceString = (currentTime: any, pbTime: any) => {
    if (typeof currentTime !== 'number' || typeof pbTime !== 'number' || isNaN(currentTime) || isNaN(pbTime)) return null;
    const diffMs = currentTime - pbTime;
    const diffSecs = Math.abs(diffMs) / 1000;
    const sign = diffMs < 0 ? '-' : '+';
    return `${sign}${diffSecs.toFixed(2)} s`;
  };

  // Robustní pomocná funkce pro porovnání ČSPS ID plavce napříč strukturami
  const isUserSwimmer = (item: any) => {
    if (!userCspsId || !item) return false;
    const sId = Number(
      item.swimmerId || 
      item.competitorId || 
      item.cspsId || 
      item.swimmer?.id || 
      item.swimmer?.cspsId || 
      item.competitor?.id || 
      item.competitor?.cspsId
    );
    return sId === userCspsId;
  };

  // Agregace startů pro přihlášeného plavce (podle userCspsId)
  const myEntries = (() => {
    if (!userCspsId) return [];
    const entriesMap = new Map<string, any>();

    // 1. Prozkoumání klubových plavců (pokud jsou načteni)
    if (Array.isArray(clubSwimmers)) {
      clubSwimmers.forEach((swimmer: any) => {
        if (isUserSwimmer(swimmer)) {
          const results = Array.isArray(swimmer.results) ? swimmer.results : [swimmer];
          results.forEach((res: any) => {
            const key = `${res.disciplineTitle || res.catId || 'disc'}`;
            if (!entriesMap.has(key)) {
              entriesMap.set(key, {
                catId: res.catId || '',
                disciplineTitle: res.disciplineTitle || 'Disciplína',
                heat: res.heat || res.group || '-',
                lane: res.lane || res.line || '-',
                entryTime: res.entryTime ?? res.qualificationTime,
                time: res.time,
                order: res.order,
                points: res.points,
                isPersonalBest: res.isPersonalBest,
                personalBestTime: res.personalBestTime,
              });
            }
          });
        }
      });
    }

    // 2. Prozkoumání výsledků a startovních listin
    if (resultsData) {
      Object.keys(resultsData).forEach(catId => {
        const catData = resultsData[catId];
        
        const startList = catData?.startList || [];
        startList.forEach((item: any) => {
          if (isUserSwimmer(item)) {
            const key = `${catId}_${item.disciplineTitle || catId}`;
            if (!entriesMap.has(key)) {
              entriesMap.set(key, {
                catId,
                disciplineTitle: item.disciplineTitle || catData.disciplineTitle || `Disciplína ${catId}`,
                heat: item.heat || item.group || '-',
                lane: item.lane || item.line || '-',
                entryTime: item.entryTime ?? item.qualificationTime,
                time: item.time,
                order: item.order,
                points: item.points,
                isPersonalBest: item.isPersonalBest,
                personalBestTime: item.personalBestTime,
              });
            }
          }
        });

        const outputs = catData?.singleOutputs || [];
        outputs.forEach((item: any) => {
          if (isUserSwimmer(item)) {
            const key = `${catId}_${item.disciplineTitle || catId}`;
            if (!entriesMap.has(key)) {
              entriesMap.set(key, {
                catId,
                disciplineTitle: item.disciplineTitle || catData.disciplineTitle || `Disciplína ${catId}`,
                heat: item.heat || item.group || '-',
                lane: item.lane || item.line || '-',
                entryTime: item.entryTime ?? item.qualificationTime,
                time: item.time,
                order: item.order,
                points: item.points,
                isPersonalBest: item.isPersonalBest,
                personalBestTime: item.personalBestTime,
              });
            } else {
              const existing = entriesMap.get(key);
              if (item.time !== undefined) existing.time = item.time;
              if (item.order !== undefined) existing.order = item.order;
              if (item.points !== undefined) existing.points = item.points;
              if (item.isPersonalBest !== undefined) existing.isPersonalBest = item.isPersonalBest;
              if (item.personalBestTime !== undefined) existing.personalBestTime = item.personalBestTime;
            }
          }
        });
      });
    }

    // 3. Prozkoumání přihlášek
    if (applicationsData && applicationsData.halfDays) {
      applicationsData.halfDays.forEach((hd: any) => {
        const categories = hd.competitionCategories || hd.categoryDtos || [];
        categories.forEach((cat: any) => {
          const catId = cat.id || cat.competitionCategoryId;
          const catTitle = cat.title || cat.disciplineTitle;
          const apps = cat.applications || [];
          apps.forEach((app: any) => {
            if (isUserSwimmer(app)) {
              const key = `${catId}_${catTitle}`;
              if (!entriesMap.has(key)) {
                entriesMap.set(key, {
                  catId,
                  disciplineTitle: catTitle,
                  heat: '-',
                  lane: '-',
                  entryTime: app.qualificationTime ?? app.entryTime,
                  time: null,
                  order: null,
                  points: null,
                  isPersonalBest: false,
                  personalBestTime: null,
                });
              }
            }
          });
        });
      });
    }

    return Array.from(entriesMap.values());
  })();

  const aggregatedClubSwimmers = clubSwimmers.reduce((acc: any[], curr: any) => {
    const key = `${curr.firstName?.trim()}_${curr.lastName?.trim()}_${curr.birthYear}_${curr.clubAbbrev}`;
    let existing = acc.find(s => `${s.firstName?.trim()}_${s.lastName?.trim()}_${s.birthYear}_${s.clubAbbrev}` === key);
    
    const currResults = Array.isArray(curr.results) ? curr.results : [curr];

    if (existing) {
      existing.results = [...existing.results, ...currResults];
    } else {
      acc.push({ 
        firstName: curr.firstName, 
        lastName: curr.lastName, 
        birthYear: curr.birthYear, 
        clubAbbrev: curr.clubAbbrev, 
        results: currResults 
      });
    }
    return acc;
  }, []);

  let totalStarts = 0;
  let totalOR = 0;
  let totalNR = 0;
  let totalDSQ = 0;

  aggregatedClubSwimmers.forEach(swimmer => {
    swimmer.results.forEach((res: any) => {
      totalStarts++;
      const formattedTime = formatSwimmingTime(res.time);
      const isDsq = formattedTime === 'DSQ';
      const hasSwum = res.time !== undefined && res.time !== null && res.time !== '' && res.time !== '-' && !isDsq;

      if (isDsq) {
        totalDSQ++;
      } else if (hasSwum) {
        if (!res.personalBestTime) {
          totalNR++;
        } else if (res.isPersonalBest) {
          totalOR++;
        }
      }
    });
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 gap-2 p-4">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="text-xs font-semibold text-slate-600">Načítám detail závodu...</span>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center space-y-4">
        <h1 className="text-lg font-bold text-slate-800">Závod se nepodařilo nalézt</h1>
        <button onClick={() => router.back()} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer">
          Zpět na přehled
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-5 max-w-7xl mx-auto space-y-5 pb-20 font-sans text-slate-800">
      
      {/* Navigační lišta */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Zpět na přehled</span>
        </button>

        <div className="flex items-center gap-2">
          {isCoachOrAdmin && (
            <button
              onClick={toggleTargetStatus}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                isTarget ? 'bg-amber-500 border-amber-400 text-white shadow-xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${isTarget ? 'fill-white' : ''}`} />
              <span>{isTarget ? 'Klubový závod' : 'Označit jako klubový'}</span>
            </button>
          )}

          <a
            href={`https://vysledky.czechswimming.cz/souteze/${competitionId}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold text-blue-700 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <span>Otevřít v ČSPS portálu</span>
            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
          </a>
        </div>
      </div>

      {/* Hlavní hlavička závodu */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-extrabold">
            {competition.sportTitle || 'Plavání'}
          </span>
          {competition.poolLength && (
            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold">
              {competition.poolLength}m bazén
            </span>
          )}
          {competition.locationRegionName && (
            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold">
              {competition.locationRegionName}
            </span>
          )}
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {competition.title}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-600">
          <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-semibold text-slate-800">{competition.location || 'Neuvedeno'}</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-semibold text-slate-800">
              {competition.competitionStartDate ? new Date(competition.competitionStartDate).toLocaleDateString('cs-CZ') : ''} 
              {' – '}
              {competition.competitionEndDate ? new Date(competition.competitionEndDate).toLocaleDateString('cs-CZ') : ''}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-semibold text-slate-800">
              Uzávěrka: {competition.registrationEndDate ? new Date(competition.registrationEndDate).toLocaleString('cs-CZ') : 'Neuvedeno'}
            </span>
          </div>
        </div>
      </div>

      {/* KLÍČOVÁ SEKCE: Logistika */}
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-5 rounded-2xl shadow-md space-y-4 border border-blue-900/50">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Bus className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-extrabold tracking-wide uppercase text-blue-200">Klubová logistika & Doprava</h2>
          </div>
          {isCoachOrAdmin && !isEditingLogistics && (
            <button
              onClick={() => setIsEditingLogistics(true)}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-300" />
              <span>Upravit logistiku</span>
            </button>
          )}
        </div>

        {isEditingLogistics ? (
          <div className="space-y-3 bg-black/20 p-4 rounded-xl border border-white/10">
            <div>
              <label className="block text-[11px] font-bold text-blue-300 uppercase mb-1">Hromadný odjezd ze Znojma</label>
              <input
                type="text"
                value={departureZnojmo}
                onChange={(e) => setDepartureZnojmo(e.target.value)}
                placeholder="Např. 5. 9. 2026 v 6:30 od plaveckého stadionu"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-blue-300 uppercase mb-1">Sraz na místě závodů</label>
              <input
                type="text"
                value={venueMeeting}
                onChange={(e) => setVenueMeeting(e.target.value)}
                placeholder="Např. V 7:15 u hlavního vstupu bazénu"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-blue-300 uppercase mb-1">Poznámka trenéra</label>
              <textarea
                value={coachNotes}
                onChange={(e) => setCoachNotes(e.target.value)}
                placeholder="Další pokyny pro plavce a rodiče..."
                rows={2}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-400"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsEditingLogistics(false)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Zrušit
              </button>
              <button
                onClick={saveLogisticsData}
                disabled={savingLogistics}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {savingLogistics ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Uložit změny</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-1">
              <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">Hromadný odjezd ze Znojma</span>
              <p className="text-xs sm:text-sm font-semibold text-white">
                {departureZnojmo || <span className="text-slate-400 italic">Zatím nezadáno</span>}
              </p>
            </div>
            <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-1">
              <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">Sraz na místě závodů</span>
              <p className="text-xs sm:text-sm font-semibold text-white">
                {venueMeeting || <span className="text-slate-400 italic">Zatím nezadáno</span>}
              </p>
            </div>
            {coachNotes && (
              <div className="sm:col-span-2 bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-1">
                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">Poznámka trenéra</span>
                <p className="text-xs text-slate-200">{coachNotes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* HLAVNÍ ZÁLOŽKY: Disciplíny & Klubové výsledky & Můj závod */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="flex items-center border-b border-slate-200 overflow-x-auto bg-slate-50/50">
          <button
            onClick={() => setActiveTab('disciplines')}
            className={`px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'disciplines' ? 'border-blue-600 text-blue-600 bg-white shadow-2xs' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Disciplíny</span>
          </button>
          <button
            onClick={() => setActiveTab('club')}
            className={`px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'club' ? 'border-blue-600 text-blue-600 bg-white shadow-2xs' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Klubové výsledky ({aggregatedClubSwimmers.length})</span>
          </button>
          {userCspsId && (
            <button
              onClick={() => setActiveTab('myRace')}
              className={`px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'myRace' ? 'border-blue-600 text-blue-600 bg-white shadow-2xs' : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Můj závod {myEntries.length > 0 ? `(${myEntries.length})` : ''}</span>
            </button>
          )}
        </div>

        <div className="p-5">
          {/* ZÁLOŽKA 1: Disciplíny */}
          {activeTab === 'disciplines' && (
            <div className="space-y-6">
              {competition.halfDayDtos && competition.halfDayDtos.length > 0 ? (
                competition.halfDayDtos.map((hd: any, hdIdx: number) => (
                  <div key={hdIdx} className="space-y-3">
                    <div className="bg-blue-900 text-white px-4 py-2 rounded-xl text-xs font-extrabold flex items-center justify-between">
                      <span>{new Date(hd.date).toLocaleDateString('cs-CZ')} (Půlden {hdIdx + 1})</span>
                    </div>

                    <div className="space-y-2.5">
                      {hd.categoryDtos?.map((cat: any, cIdx: number) => {
                        const catId = cat.id || cat.competitionCategoryId;
                        const catTitle = cat.title || cat.disciplineTitle || `Disciplína ${cIdx + 1}`;

                        return (
                          <div key={cIdx} className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3 flex-wrap transition-all hover:bg-slate-100/60">
                            <div className="flex items-center gap-2.5">
                              <Medal className="w-4 h-4 text-blue-600 shrink-0" />
                              <span className="text-xs font-black text-slate-900">
                                {catTitle}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                {cat.gender === 'MALE' ? 'Muži' : cat.gender === 'FEMALE' ? 'Ženy' : ''}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={() => openApplicationsModal(catTitle, catId, cat.gender)}
                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                              >
                                <Users className="w-3.5 h-3.5" />
                                <span>Přihlášky</span>
                              </button>
                              <button
                                onClick={() => openStartListModal(catTitle, catId, cat.gender)}
                                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Startovní listina</span>
                              </button>
                              <button
                                onClick={() => openResultsModal(catTitle, catId, cat.gender)}
                                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                              >
                                <Trophy className="w-3.5 h-3.5" />
                                <span>Výsledky</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <ListOrdered className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">Pro tento závod nejsou dosud dostupné harmonogramy ani disciplíny.</p>
                </div>
              )}
            </div>
          )}

          {/* ZÁLOŽKA 2: Klubové výsledky */}
          {activeTab === 'club' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Výsledky plavců klubu PKZn</h3>
                <button
                  onClick={handleUpdateResults}
                  disabled={updatingResults}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {updatingResults ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  <span>Aktualizovat výsledky</span>
                </button>
              </div>

              {aggregatedClubSwimmers.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Startů celkem</span>
                    <span className="text-lg font-black text-slate-900">{totalStarts}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Osobní rekordy (OR)</span>
                    <span className="text-lg font-black text-emerald-600">{totalOR}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nové rekordy (NR)</span>
                    <span className="text-lg font-black text-blue-600">{totalNR}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Diskvalifikace (DSQ)</span>
                    <span className="text-lg font-black text-red-600">{totalDSQ}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Startující plavci</span>
                    <span className="text-lg font-black text-blue-900">{aggregatedClubSwimmers.length}</span>
                  </div>
                </div>
              )}

              {aggregatedClubSwimmers.length > 0 ? (
                aggregatedClubSwimmers.map((swimmer: any, idx: number) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-600 text-white rounded-xl flex items-center justify-center text-xs font-black">
                          {swimmer.firstName?.[0]}{swimmer.lastName?.[0]}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900">
                            {swimmer.firstName} {swimmer.lastName}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-bold">Ročník: {swimmer.birthYear} | Klub: {swimmer.clubAbbrev}</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                        {swimmer.results.length} startů
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {swimmer.results.map((res: any, rIdx: number) => {
                        const hasSwum = res.time !== undefined && res.time !== null && res.time !== '' && res.time !== '-';
                        const formattedTime = formatSwimmingTime(res.time);
                        const isDsq = formattedTime === 'DSQ';
                        const timeDiff = getTimeDifferenceString(res.time, res.personalBestTime);

                        return (
                          <div key={rIdx} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs shadow-2xs">
                            <div className="space-y-0.5">
                              <span className="font-extrabold text-slate-800 block">{res.disciplineTitle}</span>
                              <span className="text-[10px] text-slate-400 block">Pořadí: {res.order || '-'} | Body: {res.points || '-'}</span>
                            </div>
                            <div className="text-right space-y-1">
                              {isDsq ? (
                                <span className="inline-flex items-center px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[11px] font-black tracking-wider">
                                  DSQ
                                </span>
                              ) : !hasSwum ? (
                                <span className="font-mono font-bold text-slate-900 block text-sm">-</span>
                              ) : (
                                <span className="font-mono font-bold text-slate-900 block text-sm">{formattedTime}</span>
                              )}

                              {!hasSwum ? (
                                <span className="text-[10px] text-slate-400 block">-</span>
                              ) : isDsq ? (
                                <span className="text-[10px] text-slate-400 block font-medium">
                                  OR: {formatSwimmingTime(res.personalBestTime)}
                                </span>
                              ) : !res.personalBestTime ? (
                                <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-extrabold">
                                  NR
                                </span>
                              ) : res.isPersonalBest ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-extrabold">
                                    <Sparkles className="w-3 h-3 text-emerald-600" />
                                    <span>Osobák (OR) {timeDiff}</span>
                                  </span>
                                  <span className="text-[10px] text-slate-400 block font-medium">
                                    Původní OR: {formatSwimmingTime(res.personalBestTime)}
                                  </span>
                                </div>
                              ) : (
                                <div className="space-y-0.5">
                                  <span className="text-[10px] text-slate-600 block font-medium">
                                    OR: {formatSwimmingTime(res.personalBestTime)}
                                    {timeDiff && (
                                      <span className="ml-1 text-slate-400">({timeDiff})</span>
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
                  <Users className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">Zatím nejsou načteny žádné výsledky pro plavce klubu PKZn.</p>
                  <button
                    onClick={handleUpdateResults}
                    disabled={updatingResults}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {updatingResults ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    <span>Stáhnout a vyhodnotit výsledky</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ZÁLOŽKA 3: Můj závod */}
          {activeTab === 'myRace' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between flex-wrap gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">Osobní profil plavce</span>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span>ČSPS ID: {userCspsId}</span>
                  </h3>
                </div>
                <div className="px-3 py-1 bg-white/10 rounded-xl text-xs font-bold text-blue-200 border border-white/10">
                  {myEntries.length} {myEntries.length === 1 ? 'start' : myEntries.length >= 2 && myEntries.length <= 4 ? 'starty' : 'startů'} v tomto závodě
                </div>
              </div>

              {myEntries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {myEntries.map((entry: any, eIdx: number) => {
                    const hasSwum = entry.time !== undefined && entry.time !== null && entry.time !== '' && entry.time !== '-';
                    const formattedTime = formatSwimmingTime(entry.time);
                    const isDsq = formattedTime === 'DSQ';
                    const timeDiff = getTimeDifferenceString(entry.time, entry.personalBestTime);

                    return (
                      <div key={eIdx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                          <div className="flex items-center gap-2">
                            <Medal className="w-4 h-4 text-blue-600 shrink-0" />
                            <h4 className="text-xs font-black text-slate-900">{entry.disciplineTitle}</h4>
                          </div>
                          {entry.order && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-lg text-[11px] font-black">
                              {entry.order}. místo
                            </span>
                          )}
                        </div>

                        

                        <div className="bg-white p-3 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Přihlášený / Kval. čas</span>
                            <span className="font-mono font-bold text-slate-700">{formatSwimmingTime(entry.entryTime)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Reálný čas / Výsledek</span>
                            {isDsq ? (
                              <span className="inline-flex items-center px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[11px] font-black tracking-wider">
                                DSQ
                              </span>
                            ) : !hasSwum ? (
                              <span className="font-mono font-bold text-slate-400">Zatím neplaváno</span>
                            ) : (
                              <span className="font-mono font-extrabold text-slate-900 text-sm">{formattedTime}</span>
                            )}
                          </div>
                        </div>

                        {hasSwum && !isDsq && (
                          <div className="pt-1">
                            {!entry.personalBestTime ? (
                              <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] font-extrabold text-blue-700 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                <span>Nový osobní rekord (NR)</span>
                              </div>
                            ) : entry.isPersonalBest ? (
                              <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] font-extrabold text-emerald-700 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Osobní rekord (OR)! {timeDiff}</span>
                                </div>
                                <span className="text-[10px] text-slate-500 font-medium">Původní: {formatSwimmingTime(entry.personalBestTime)}</span>
                              </div>
                            ) : (
                              <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-medium text-slate-600 flex items-center justify-between">
                                <span>Osobní rekord (OR): {formatSwimmingTime(entry.personalBestTime)}</span>
                                {timeDiff && <span className="text-slate-400 font-mono">({timeDiff})</span>}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                  <User className="w-8 h-8 text-slate-300 mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800">Nemáte v tomto závodě evidované žádné starty</h4>
                    <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                      Váš ČSPS ID ({userCspsId}) nebyl nalezen v přihláškách, startovních listinách ani ve výsledcích tohoto závodu. Jakmile budou data aktualizována, vaše starty se zde zobrazí.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL OKNO */}
      {modalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
              <h3 className="text-sm font-black text-slate-900">{modalContent.title}</h3>
              <button
                onClick={() => setModalContent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-white rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div 
              className="p-5 overflow-y-auto flex-1 overscroll-contain"
              style={{ WebkitOverflowScrolling: 'touch', transform: 'translateZ(0)' }}
            >
              {modalContent.items.length > 0 ? (
                modalContent.type === 'startlist' ? (
                  <div className="space-y-6">
                    {(() => {
                      const grouped = modalContent.items.reduce((acc: Record<string, any[]>, item: any) => {
                        const grp = item.group || item.heat || '1';
                        if (!acc[grp]) acc[grp] = [];
                        acc[grp].push(item);
                        return acc;
                      }, {});

                      return Object.keys(grouped).sort((a, b) => Number(a) - Number(b)).map((groupKey) => {
                        const swimmersInGroup = grouped[groupKey].sort((a: any, b: any) => Number(a.line || a.lane || 0) - Number(b.line || b.lane || 0));
                        
                        return (
                          <div key={groupKey} className="space-y-2">
                            <div className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-black text-slate-700 uppercase tracking-wide">
                              Rozplavba {groupKey}
                            </div>
                            <div className="overflow-x-auto overscroll-x-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="border-b border-slate-200 text-slate-400 font-bold bg-slate-50">
                                    <th className="p-2.5 w-16">Dráha</th>
                                    <th className="p-2.5">Závodník</th>
                                    <th className="p-2.5">Klub</th>
                                    <th className="p-2.5">Ročník</th>
                                    <th className="p-2.5 text-right">Přihlášený čas</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {swimmersInGroup.map((item: any, idx: number) => {
                                    const name = item.firstName && item.lastName ? `${item.firstName} ${item.lastName}` : (item.name || 'Neznámý');
                                    const line = item.line || item.lane || '-';
                                    const clubAbbrev = item.clubAbbrev || item.club || '';
                                    const isPkzn = isPKZnSwimmer(clubAbbrev, item.clubFullName);

                                    return (
                                      <tr 
                                        key={idx} 
                                        className={`transition-colors ${isPkzn ? 'bg-blue-50/70 border-l-4 border-blue-600 font-medium' : 'hover:bg-slate-50/80'}`}
                                      >
                                        <td className="p-2.5 font-black text-blue-600">{line}</td>
                                        <td className="p-2.5 font-extrabold text-slate-900 flex items-center gap-2">
                                          {name}
                                          {isPkzn && (
                                            <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[9px] font-black uppercase">
                                              PKZn
                                            </span>
                                          )}
                                        </td>
                                        <td className="p-2.5 font-semibold text-slate-600">{clubAbbrev || '-'}</td>
                                        <td className="p-2.5 text-slate-500">{item.birthYear || '-'}</td>
                                        <td className="p-2.5 text-right font-mono font-bold text-slate-800">{formatModalTime(item, 'startlist')}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <div className="overflow-x-auto overscroll-x-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-bold bg-slate-100/70">
                          <th className="p-2.5 w-12">#</th>
                          <th className="p-2.5">Závodník</th>
                          <th className="p-2.5">Klub</th>
                          <th className="p-2.5">Ročník</th>
                          <th className="p-2.5 text-right">Čas / Výkon</th>
                          {modalContent.type === 'results' && <th className="p-2.5 text-right">Body</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {modalContent.items.map((item: any, idx: number) => {
                          const name = item.firstName && item.lastName ? `${item.firstName} ${item.lastName}` : (item.name || 'Neznámý');
                          const order = item.order || idx + 1;
                          const clubAbbrev = item.clubAbbrev || item.club || '';
                          const isPkzn = isPKZnSwimmer(clubAbbrev, item.clubFullName);

                          return (
                            <tr 
                              key={idx} 
                              className={`transition-colors ${isPkzn ? 'bg-blue-50/70 border-l-4 border-blue-600 font-medium' : 'hover:bg-slate-50/80'}`}
                            >
                              <td className="p-2.5 font-black text-slate-400">{order}.</td>
                              <td className="p-2.5 font-extrabold text-slate-900 flex items-center gap-2">
                                {name}
                                {isPkzn && (
                                  <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[9px] font-black uppercase">
                                    PKZn
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 font-semibold text-slate-600">{clubAbbrev || '-'}</td>
                              <td className="p-2.5 text-slate-500">{item.birthYear || '-'}</td>
                              <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                                {formatModalTime(item, modalContent.type === 'results' ? 'results' : 'applications')}
                              </td>
                              {modalContent.type === 'results' && (
                                <td className="p-2.5 text-right font-semibold text-slate-600">{item.points || '-'}</td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                <div className="py-10 text-center text-xs text-slate-400 italic">
                  Pro tuto disciplínu nejsou k dispozici žádná data.
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
              <button
                onClick={() => setModalContent(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Zavřít
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}