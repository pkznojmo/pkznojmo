'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Trophy, 
  ArrowLeft, 
  Loader2, 
  Activity, 
  Award, 
  Dumbbell, 
  Waves, 
  Target,
  Lock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MapPin,
  Clock,
  Medal,
  Sparkles
} from 'lucide-react';

interface SwimmerProfile {
  id: string;
  first_name: string;
  last_name: string;
  birth_year?: number;
  team_name?: string;
  team_id?: number;
  csps_id?: number;
}

interface AttendanceRow {
  date: string;
  morning_km: number;
  afternoon_km: number;
  dry_minutes: number;
}

interface ClubRecord {
  id: number;
  event: string;
  category: string;
  time: string;
  year: number;
}

interface CspsOutput {
  disciplineCode: string;
  disciplineTitle: string;
  time: number; // v ms
  poolLength: number; // 25 nebo 50
  date: string;
}

export default function PlavecDetailDBPage() {
  const params = useParams();
  const router = useRouter();
  const swimmerId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isCoachOrAdmin, setIsCoachOrAdmin] = useState<boolean>(false);
  const [teamSwimmers, setTeamSwimmers] = useState<{ id: string; first_name: string; last_name: string }[]>([]);
  const [swimmer, setSwimmer] = useState<SwimmerProfile | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [clubRecords, setClubRecords] = useState<ClubRecord[]>([]);
  const [cspsOutputs, setCspsOutputs] = useState<CspsOutput[]>([]);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [expandedComps, setExpandedComps] = useState<{ [key: string]: boolean }>({});
  
  const [activeTab, setActiveTab] = useState<'prehled' | 'rekordy' | 'treninky' | 'zavody'>('prehled');

  // Dynamický aktuální rok a stav pro výběr roku
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  useEffect(() => {
    if (swimmerId) {
      loadAllData(swimmerId);
    }
  }, [swimmerId]);

  useEffect(() => {
    if (!isLoggedIn && activeTab === 'treninky') {
      setActiveTab('prehled');
    }
  }, [isLoggedIn, activeTab]);

  const loadAllData = async (id: string) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const loggedIn = !!session;
      setIsLoggedIn(loggedIn);

      let userCanSwitch = false;
      if (session) {
        const { data: myProfile } = await supabase
          .from('profiles')
          .select('roles')
          .eq('id', session.user.id)
          .single();
        
        if (myProfile && Array.isArray(myProfile.roles)) {
          const lowerRoles = myProfile.roles.map((r: string) => r.toLowerCase());
          if (lowerRoles.some(r => ['coach', 'admin', 'trenér', 'trainer'].includes(r))) {
            userCanSwitch = true;
          }
        }
      }
      setIsCoachOrAdmin(userCanSwitch);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, birth_year, csps_id, team_id, teams:team_id(name)')
        .eq('id', id)
        .single();

      if (profileError || !profileData) {
        console.error('Chyba při načítání profilu:', profileError);
        setLoading(false);
        return;
      }

      const teamInfo = Array.isArray(profileData.teams) ? profileData.teams[0] : profileData.teams;
      const swimmerProfile: SwimmerProfile = {
        id: profileData.id,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        birth_year: profileData.birth_year,
        team_name: teamInfo?.name || 'Bez družstva',
        team_id: profileData.team_id,
        csps_id: profileData.csps_id,
      };
      setSwimmer(swimmerProfile);

      if (profileData.team_id) {
        const { data: teamMembers } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('team_id', profileData.team_id)
          .order('last_name', { ascending: true });
        if (teamMembers) {
          setTeamSwimmers(teamMembers);
        }
      }

      if (loggedIn) {
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('*')
          .eq('swimmer_id', id)
          .order('date', { ascending: false });

        if (attendanceData) {
          setAttendance(attendanceData);
        }
      }

      const { data: recordsData } = await supabase
        .from('club_records')
        .select('*')
        .eq('swimmer_id', id);

      if (recordsData) {
        setClubRecords(recordsData);
      }

      if (profileData.csps_id) {
        try {
          const resOutputs = await fetch(`/api/csps/${profileData.csps_id}?type=outputs`);
          if (resOutputs.ok) {
            const outputsJson = await resOutputs.json();
            if (Array.isArray(outputsJson)) {
              setCspsOutputs(outputsJson);
            }
          }

          const resComps = await fetch(`/api/csps/${profileData.csps_id}?type=competitions`);
          if (resComps.ok) {
            const compsJson = await resComps.json();
            if (Array.isArray(compsJson)) {
              setCompetitions(compsJson);
            }
          }
        } catch (apiErr) {
          console.error('Chyba při načítání ČSPS dat:', apiErr);
        }
      }

    } catch (err) {
      console.error('Neočekávaná chyba:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 gap-2 p-4">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="text-sm font-medium">Načítám data z databáze a ČSPS...</span>
      </div>
    );
  }

  if (!swimmer) {
    return (
      <div className="p-8 text-center text-slate-500">
        Plavec nenalezen.
      </div>
    );
  }

  // --- VÝPOČTY PRO PŘEHLED (KILOMETRY, JEDNOTKY, SUCHÁ) ---
  const validAttendance = attendance.filter(row => {
    const m = Number(row.morning_km || 0);
    const a = Number(row.afternoon_km || 0);
    const d = Number(row.dry_minutes || 0);
    return m > 0 || a > 0 || d > 0;
  });

  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  // Kilometry
  let kmWeek = 0;
  let kmMonth = 0;
  let kmYear = 0;
  let kmMorningYear = 0;
  let kmAfternoonYear = 0;
  let kmMorningWeek = 0;
  let kmAfternoonWeek = 0;
  let kmMorningMonth = 0;
  let kmAfternoonMonth = 0;

  // Jednotky plavání
  let unitsMorningWeek = 0;
  let unitsAfternoonWeek = 0;
  let unitsWeek = 0;
  let unitsMorningMonth = 0;
  let unitsAfternoonMonth = 0;
  let unitsMonth = 0;
  let unitsMorningYear = 0;
  let unitsAfternoonYear = 0;
  let unitsYear = 0;

  // Suchá příprava (minuty a jednotky)
  let dryMinutesWeek = 0;
  let dryMinutesMonth = 0;
  let dryMinutesYear = 0;
  let dryUnitsWeek = 0;
  let dryUnitsMonth = 0;
  let dryUnitsYear = 0;

  validAttendance.forEach(row => {
    const rowDate = new Date(row.date);
    const mKm = Number(row.morning_km || 0);
    const aKm = Number(row.afternoon_km || 0);
    const dMin = Number(row.dry_minutes || 0);
    const totalRowKm = mKm + aKm;
    const hasDry = dMin > 0;

    if (rowDate.getFullYear() === selectedYear) {
      kmYear += totalRowKm;
      kmMorningYear += mKm;
      kmAfternoonYear += aKm;
      dryMinutesYear += dMin;
      if (mKm > 0) unitsMorningYear++;
      if (aKm > 0) unitsAfternoonYear++;
      if (totalRowKm > 0) unitsYear++;
      if (hasDry) dryUnitsYear++;

      if (rowDate.getMonth() === currentMonth && selectedYear === currentYear) {
        kmMonth += totalRowKm;
        kmMorningMonth += mKm;
        kmAfternoonMonth += aKm;
        dryMinutesMonth += dMin;
        if (mKm > 0) unitsMorningMonth++;
        if (aKm > 0) unitsAfternoonMonth++;
        if (totalRowKm > 0) unitsMonth++;
        if (hasDry) dryUnitsMonth++;

        if (rowDate >= startOfWeek) {
          kmWeek += totalRowKm;
          kmMorningWeek += mKm;
          kmAfternoonWeek += aKm;
          dryMinutesWeek += dMin;
          if (mKm > 0) unitsMorningWeek++;
          if (aKm > 0) unitsAfternoonWeek++;
          if (totalRowKm > 0) unitsWeek++;
          if (hasDry) dryUnitsWeek++;
        }
      }
    }
  });

  const targetYearKm = 1300;
  const targetMonthKm = 125;
  const targetWeekKm = 30;

  const yearPercent = Math.min(Math.round((kmYear / targetYearKm) * 100), 100);
  const monthPercent = Math.min(Math.round((kmMonth / targetMonthKm) * 100), 100);
  const weekPercent = Math.min(Math.round((kmWeek / targetWeekKm) * 100), 100);

  // --- STATISTIKY PRO OSTATNÍ KARTY ---
  const pbMap: { [key: string]: { scTime?: string; scDate?: string; lcTime?: string; lcDate?: string; timeMsSc?: number; timeMsLc?: number; scYear?: number; lcYear?: number } } = {};

  cspsOutputs.forEach(item => {
    const code = item.disciplineCode || item.disciplineTitle;
    if (!pbMap[code]) pbMap[code] = {};

    const formattedTime = formatMsToTime(item.time);
    const dateObj = new Date(item.date);
    const dateStr = dateObj.toLocaleDateString('cs-CZ');
    const itemYear = dateObj.getFullYear();

    if (item.poolLength === 25) {
      if (!pbMap[code].timeMsSc || item.time < pbMap[code].timeMsSc!) {
        pbMap[code].timeMsSc = item.time;
        pbMap[code].scTime = formattedTime;
        pbMap[code].scDate = dateStr;
        pbMap[code].scYear = itemYear;
      }
    } else if (item.poolLength === 50) {
      if (!pbMap[code].timeMsLc || item.time < pbMap[code].timeMsLc!) {
        pbMap[code].timeMsLc = item.time;
        pbMap[code].lcTime = formattedTime;
        pbMap[code].lcDate = dateStr;
        pbMap[code].lcYear = itemYear;
      }
    }
  });

  const cspsPbsList = Object.keys(pbMap).map(disc => ({
    discipline: disc,
    ...pbMap[disc]
  }));

  let pbCountCurrentYear = 0;
  let pbCountPrevYear = 0;
  let pbCountTotal = 0;

  cspsPbsList.forEach(item => {
    if (item.scTime) {
      pbCountTotal++;
      if (item.scYear === currentYear) pbCountCurrentYear++;
      if (item.scYear === currentYear - 1) pbCountPrevYear++;
    }
    if (item.lcTime) {
      pbCountTotal++;
      if (item.lcYear === currentYear) pbCountCurrentYear++;
      if (item.lcYear === currentYear - 1) pbCountPrevYear++;
    }
  });

  const competitionsCurrentYearCount = competitions.filter(comp => {
    if (!comp.startDate) return false;
    return new Date(comp.startDate).getFullYear() === currentYear;
  }).length;
  const competitionsTotalCount = competitions.length;

  function formatMsToTime(ms: number): string {
    if (!ms) return '—';
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const hundredths = Math.round((totalSeconds % 1) * 100);

    if (minutes > 0) {
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}.${hundredths < 10 ? '0' : ''}${hundredths}`;
    }
    return `${seconds}.${hundredths < 10 ? '0' : ''}${hundredths}`;
  }

  const currentSwimmerIndex = teamSwimmers.findIndex(s => s.id === swimmerId);
  const prevSwimmer = currentSwimmerIndex > 0 ? teamSwimmers[currentSwimmerIndex - 1] : null;
  const nextSwimmer = currentSwimmerIndex !== -1 && currentSwimmerIndex < teamSwimmers.length - 1 ? teamSwimmers[currentSwimmerIndex + 1] : null;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 pb-24 md:pb-8 font-sans text-slate-800">
      
      {/* Horní lišta: Zpět + Výběr roku + Přepínání plavců */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zpět na seznam</span>
        </button>

        <div className="flex items-center gap-3 flex-wrap">
          {activeTab === 'prehled' && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-xs text-xs animate-fadeIn">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-slate-400 font-medium">Rok přehledu:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value={currentYear}>{currentYear}</option>
                <option value={currentYear - 1}>{currentYear - 1} (loni)</option>
                <option value={currentYear - 2}>{currentYear - 2}</option>
              </select>
            </div>
          )}

          {isCoachOrAdmin && teamSwimmers.length > 1 && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-xs text-xs">
              <span className="text-slate-400 font-medium hidden sm:inline">Plavec:</span>
              
              <button
                disabled={!prevSwimmer}
                onClick={() => prevSwimmer && router.push(window.location.pathname.replace(swimmerId, prevSwimmer.id))}
                title={prevSwimmer ? `${prevSwimmer.first_name} ${prevSwimmer.last_name}` : ''}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-colors max-w-[130px] sm:max-w-[160px] truncate ${
                  prevSwimmer ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer' : 'text-slate-300 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {prevSwimmer ? `${prevSwimmer.first_name} ${prevSwimmer.last_name}` : 'Předchozí'}
                </span>
              </button>

              <span className="font-bold text-slate-900 px-1 shrink-0">
                {currentSwimmerIndex + 1} / {teamSwimmers.length}
              </span>

              <button
                disabled={!nextSwimmer}
                onClick={() => nextSwimmer && router.push(window.location.pathname.replace(swimmerId, nextSwimmer.id))}
                title={nextSwimmer ? `${nextSwimmer.first_name} ${nextSwimmer.last_name}` : ''}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-colors max-w-[130px] sm:max-w-[160px] truncate ${
                  nextSwimmer ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer' : 'text-slate-300 cursor-not-allowed'
                }`}
              >
                <span className="truncate">
                  {nextSwimmer ? `${nextSwimmer.first_name} ${nextSwimmer.last_name}` : 'Další'}
                </span>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profilová hlavička */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold text-xl sm:text-2xl border border-blue-100 shadow-inner shrink-0">
            {swimmer.first_name?.[0]}{swimmer.last_name?.[0]}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {swimmer.first_name} {swimmer.last_name}
              </h1>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                {swimmer.team_name}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>Plavec {swimmer.birth_year ? `• Ročník ${swimmer.birth_year}` : ''}</span>
            </p>
          </div>
        </div>

        {/* Přepínání záložek */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl flex-wrap">
          <button
            onClick={() => setActiveTab('prehled')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'prehled' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Přehled & Plány
          </button>
          <button
            onClick={() => setActiveTab('rekordy')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'rekordy' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Osobní rekordy
          </button>
          <button
            onClick={() => setActiveTab('zavody')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'zavody' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Závody ({competitionsTotalCount})
          </button>
          {isLoggedIn && (
            <button
              onClick={() => setActiveTab('treninky')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'treninky' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tréninky & Docházka
            </button>
          )}
        </div>
      </div>

      {activeTab === 'prehled' && (
        <div className="space-y-6">
          
          {/* JEDNOTNÁ TRÉNINKOVÁ KARTA (TABULKA SE 12 SLOUPCI PRO TÝDEN, MĚSÍC, ROK) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Waves className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Tréninkové statistiky — Srovnání (Týden / Měsíc / Rok {selectedYear})
                </span>
              </div>
            </div>

            {isLoggedIn ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-center border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3 text-left" rowSpan={2}>Část dne</th>
                      <th colSpan={4} className="py-2 px-2 border-l border-slate-200 bg-blue-50/40 text-blue-800 font-bold">Týden</th>
                      <th colSpan={4} className="py-2 px-2 border-l border-slate-200 bg-indigo-50/40 text-indigo-800 font-bold">Měsíc</th>
                      <th colSpan={4} className="py-2 px-2 border-l border-slate-200 bg-emerald-50/40 text-emerald-800 font-bold">Rok ({selectedYear})</th>
                    </tr>
                    <tr className="border-b border-slate-200/80 text-slate-500 font-bold uppercase text-[9px] bg-slate-50">
                      {/* Týden */}
                      <th className="py-2 px-2 border-l border-slate-200">Jednotky plavání</th>
                      <th className="py-2 px-2">Kilometry plavání</th>
                      <th className="py-2 px-2">Jednotky suché</th>
                      <th className="py-2 px-2">Minuty suché</th>
                      {/* Měsíc */}
                      <th className="py-2 px-2 border-l border-slate-200">Jednotky plavání</th>
                      <th className="py-2 px-2">Kilometry plavání</th>
                      <th className="py-2 px-2">Jednotky suché</th>
                      <th className="py-2 px-2">Minuty suché</th>
                      {/* Rok */}
                      <th className="py-2 px-2 border-l border-slate-200">Jednotky plavání</th>
                      <th className="py-2 px-2">Kilometry plavání</th>
                      <th className="py-2 px-2">Jednotky suché</th>
                      <th className="py-2 px-2">Minuty suché</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {/* Ráno */}
                    <tr className="bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 text-left font-semibold text-slate-500 uppercase text-[10px]">Ráno</td>
                      {/* Týden ráno */}
                      <td className="py-3 px-2 border-l border-slate-200">{unitsMorningWeek}</td>
                      <td className="py-3 px-2 font-bold">{kmMorningWeek.toFixed(1)} km</td>
                      <td className="py-3 px-2 text-slate-400">—</td>
                      <td className="py-3 px-2 text-slate-400">—</td>
                      {/* Měsíc ráno */}
                      <td className="py-3 px-2 border-l border-slate-200">{unitsMorningMonth}</td>
                      <td className="py-3 px-2 font-bold">{kmMorningMonth.toFixed(1)} km</td>
                      <td className="py-3 px-2 text-slate-400">—</td>
                      <td className="py-3 px-2 text-slate-400">—</td>
                      {/* Rok ráno */}
                      <td className="py-3 px-2 border-l border-slate-200">{unitsMorningYear}</td>
                      <td className="py-3 px-2 font-bold">{kmMorningYear.toFixed(1)} km</td>
                      <td className="py-3 px-2 text-slate-400">—</td>
                      <td className="py-3 px-2 text-slate-400">—</td>
                    </tr>
                    {/* Odpoledne */}
                    <tr className="bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 text-left font-semibold text-slate-500 uppercase text-[10px]">Odpoledne</td>
                      {/* Týden odpoledne */}
                      <td className="py-3 px-2 border-l border-slate-200">{unitsAfternoonWeek}</td>
                      <td className="py-3 px-2 font-bold">{kmAfternoonWeek.toFixed(1)} km</td>
                      <td className="py-3 px-2 font-bold text-amber-700">{dryUnitsWeek}</td>
                      <td className="py-3 px-2 font-bold text-amber-600">{dryMinutesWeek} min</td>
                      {/* Měsíc odpoledne */}
                      <td className="py-3 px-2 border-l border-slate-200">{unitsAfternoonMonth}</td>
                      <td className="py-3 px-2 font-bold">{kmAfternoonMonth.toFixed(1)} km</td>
                      <td className="py-3 px-2 font-bold text-amber-700">{dryUnitsMonth}</td>
                      <td className="py-3 px-2 font-bold text-amber-600">{dryMinutesMonth} min</td>
                      {/* Rok odpoledne */}
                      <td className="py-3 px-2 border-l border-slate-200">{unitsAfternoonYear}</td>
                      <td className="py-3 px-2 font-bold">{kmAfternoonYear.toFixed(1)} km</td>
                      <td className="py-3 px-2 font-bold text-amber-700">{dryUnitsYear}</td>
                      <td className="py-3 px-2 font-bold text-amber-600">{dryMinutesYear} min</td>
                    </tr>
                    {/* Celkem */}
                    <tr className="bg-blue-50/40 font-bold text-slate-900">
                      <td className="py-3 px-3 text-left font-bold text-blue-600 uppercase text-[10px]">Celkem</td>
                      {/* Týden celkem (součet ráno + odpoledne) */}
                      <td className="py-3 px-2 border-l border-slate-200">{unitsMorningWeek + unitsAfternoonWeek}</td>
                      <td className="py-3 px-2 text-blue-700">{kmWeek.toFixed(1)} km</td>
                      <td className="py-3 px-2 text-amber-700">{dryUnitsWeek}</td>
                      <td className="py-3 px-2 text-amber-600">{dryMinutesWeek} min</td>
                      {/* Měsíc celkem (součet ráno + odpoledne) */}
                      <td className="py-3 px-2 border-l border-slate-200">{unitsMorningMonth + unitsAfternoonMonth}</td>
                      <td className="py-3 px-2 text-blue-700">{kmMonth.toFixed(1)} km</td>
                      <td className="py-3 px-2 text-amber-700">{dryUnitsMonth}</td>
                      <td className="py-3 px-2 text-amber-600">{dryMinutesMonth} min</td>
                      {/* Rok celkem (součet ráno + odpoledne) */}
                      <td className="py-3 px-2 border-l border-slate-200">{unitsMorningYear + unitsAfternoonYear}</td>
                      <td className="py-3 px-2 text-blue-700">{kmYear.toFixed(1)} km</td>
                      <td className="py-3 px-2 text-amber-700">{dryUnitsYear}</td>
                      <td className="py-3 px-2 text-amber-600">{dryMinutesYear} min</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-2 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Pouze pro přihlášené</span>
              </div>
            )}
          </div>

          {/* PLNĚNÍ PLÁNU */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                <span>Plnění plánu ({selectedYear})</span>
              </h3>
              {isLoggedIn && (
                <span className="text-xs text-slate-400 font-medium">Roční cíl: {targetYearKm} km</span>
              )}
            </div>

            {isLoggedIn ? (
              <div className="space-y-4">
                {selectedYear === currentYear && (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-600">Týden: {kmWeek.toFixed(1)} / {targetWeekKm} km</span>
                        <span className="text-slate-900">{weekPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${weekPercent}%` }}></div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-600">Měsíc: {kmMonth.toFixed(1)} / {targetMonthKm} km</span>
                        <span className="text-slate-900">{monthPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${monthPercent}%` }}></div>
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">Rok: {kmYear.toFixed(1)} / {targetYearKm} km</span>
                    <span className="text-slate-900">{yearPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${yearPercent}%` }}></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2 font-medium">
                <Lock className="w-5 h-5 text-slate-300" />
                <span>Detailní plnění tréninkového plánu je dostupné pouze po přihlášení.</span>
              </div>
            )}
          </div>

          {/* DRŽENÉ KLUBOVÉ REKORDY */}
          <div className="bg-gradient-to-br from-white via-slate-50/50 to-amber-50/20 p-6 rounded-2xl border border-amber-200/40 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
                  <Medal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Držené klubové rekordy plavce</h3>
                  <p className="text-xs text-slate-500">Aktivní platné klubové rekordy v držení tohoto plavce</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="px-3 py-1 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-600 shadow-2xs">
                  Celkem rekordů: <span className="text-amber-600 font-bold">{clubRecords.length}</span>
                </div>
              </div>
            </div>

            {clubRecords.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-1">
                {clubRecords.map((rec) => (
                  <div 
                    key={rec.id} 
                    className="relative overflow-hidden p-4 rounded-2xl bg-white border border-amber-200/60 shadow-xs hover:shadow-md hover:border-amber-300 transition-all group"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-400/10 via-amber-300/5 to-transparent rounded-bl-full pointer-events-none transition-transform group-hover:scale-110"></div>
                    
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-extrabold text-xs border border-amber-200/60 shadow-2xs">
                        <Trophy className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{rec.event}</span>
                      </span>
                      <span className="font-mono font-extrabold text-sm text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 shadow-2xs">
                        {rec.time}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2.5 border-t border-slate-100/80">
                      <span className="font-semibold text-slate-700 truncate max-w-[130px]" title={rec.category}>
                        {rec.category} leté žactvo
                      </span>
                      <span className="font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {rec.year}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 italic bg-white/50 rounded-2xl border border-dashed border-slate-200">
                V databázi nejsou pro tohoto plavce evidovány žádné klubové rekordy.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'rekordy' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden space-y-4">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-bold text-base text-slate-900">Osobní rekordy (ČSPS)</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="px-3 py-1 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-600">
                  {currentYear}: <span className="text-blue-600 font-bold">{pbCountCurrentYear}</span>
                </div>
                <div className="px-3 py-1 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-600">
                  {currentYear - 1}: <span className="text-slate-900 font-bold">{pbCountPrevYear}</span>
                </div>
                <div className="px-3 py-1 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-600">
                  Celkem: <span className="text-emerald-600 font-bold">{pbCountTotal}</span>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              {cspsPbsList.length > 0 ? (
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="py-3.5 px-6">Disciplína</th>
                      <th className="py-3.5 px-6">Krátký bazén (25m)</th>
                      <th className="py-3.5 px-6">Dlouhý bazén (50m)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cspsPbsList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-6 font-semibold text-slate-900">{item.discipline}</td>
                        <td className="py-4 px-6 font-mono text-xs">
                          {item.scTime ? (
                            <>
                              <span className="font-bold text-blue-600">{item.scTime}</span>
                              <span className="block text-[10px] text-slate-400">{item.scDate}</span>
                            </>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="py-4 px-6 font-mono text-xs">
                          {item.lcTime ? (
                            <>
                              <span className="font-bold text-emerald-600">{item.lcTime}</span>
                              <span className="block text-[10px] text-slate-400">{item.lcDate}</span>
                            </>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 italic">
                  {swimmer.csps_id ? 'Nepodařilo se načíst data z ČSPS API nebo plavec nemá žádné výstupy.' : 'Plavec nemá vyplněné csps_id v profilu.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ZÁLOŽKA: ZÁVODY */}
      {activeTab === 'zavody' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-purple-600" />
                  <span>Seznam všech závodů (ze všech let)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Kompletní historie závodů a startů z ČSPS registru.</p>
              </div>
              <div className="px-3 py-1.5 bg-purple-50 border border-purple-200/80 rounded-xl text-xs font-semibold text-purple-700 flex items-center gap-2">
                <span>V roce {currentYear}: <strong className="font-bold">{competitionsCurrentYearCount}</strong></span>
                <span className="text-purple-300">•</span>
                <span>Celkem: <strong className="font-bold">{competitionsTotalCount}</strong></span>
              </div>
            </div>

            {competitions.length > 0 ? (
              <div className="space-y-3">
                {competitions.map((comp, idx) => {
                  const compKey = comp.competitionId || idx;
                  const isExpanded = !!expandedComps[compKey];
                  const startDateStr = comp.startDate ? new Date(comp.startDate).toLocaleDateString('cs-CZ') : '';
                  const endDateStr = comp.endDate ? new Date(comp.endDate).toLocaleDateString('cs-CZ') : '';
                  const dateDisplay = startDateStr === endDateStr ? startDateStr : `${startDateStr} – ${endDateStr}`;

                  return (
                    <div 
                      key={compKey}
                      className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden transition-all shadow-2xs hover:border-purple-200"
                    >
                      <div 
                        onClick={() => setExpandedComps(prev => ({ ...prev, [compKey]: !isExpanded }))}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                              {comp.title || 'Neznámý závod'}
                            </h4>
                            {comp.competitionTags?.map((tag: any) => (
                              <span key={tag.competitionTagId} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/60">
                                {tag.title}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                            {comp.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span>{comp.location}</span>
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{dateDisplay}</span>
                            </span>
                            {comp.competitionCategories && (
                              <span className="text-purple-600 font-semibold">
                                {comp.competitionCategories.length} {comp.competitionCategories.length === 1 ? 'start' : comp.competitionCategories.length < 5 ? 'starty' : 'startů'}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3">
                          <span className="text-xs font-semibold text-slate-500">
                            {isExpanded ? 'Skrýt disciplíny' : 'Zobrazit disciplíny'}
                          </span>
                          <div className={`w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 transition-transform ${isExpanded ? 'rotate-180 bg-purple-50 text-purple-600 border-purple-200' : ''}`}>
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white space-y-3">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Absolvované disciplíny a časy</h5>
                          {comp.competitionCategories && comp.competitionCategories.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {comp.competitionCategories.map((cat: any, catIdx: number) => (
                                <div key={cat.id || catIdx} className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between gap-3">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-900 text-xs">{cat.disciplineTitle || cat.disciplineCode}</span>
                                      {cat.type && (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 uppercase">
                                          {cat.note || cat.type}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-medium">
                                      {cat.categoryText} • {cat.date ? new Date(cat.date).toLocaleDateString('cs-CZ') : ''}
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <div className="font-mono font-bold text-xs text-blue-600">
                                      {cat.time ? formatMsToTime(cat.time) : '—'}
                                    </div>
                                    {cat.points && (
                                      <div className="text-[10px] text-slate-400 font-semibold">
                                        {cat.points} b.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">Žádné zaznamenané disciplíny v tomto závodu.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-400 italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                {swimmer.csps_id ? 'V ČSPS registru nejsou pro tohoto plavce evidovány žádné závody.' : 'Plavec nemá vyplněné csps_id v profilu.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ZÁLOŽKA: Tréninky & Docházka */}
      {isLoggedIn && activeTab === 'treninky' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                <span>Tréninkové aktivity a docházka</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Kompletní přehled aktivních fází z databáze.</p>
            </div>
            <div className="px-3 py-1 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-600">
              Celkem záznamů: {validAttendance.length}
            </div>
          </div>

          {validAttendance.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {validAttendance.map((row, idx) => {
                const hasMorning = Number(row.morning_km) > 0;
                const hasAfternoon = Number(row.afternoon_km) > 0;
                const hasDry = Number(row.dry_minutes) > 0;
                const formattedDate = new Date(row.date).toLocaleDateString('cs-CZ', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });

                return (
                  <div 
                    key={idx} 
                    className="bg-gradient-to-r from-slate-50/60 to-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-200 hover:shadow-sm transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-100/80 shrink-0 shadow-inner">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 capitalize">
                          {formattedDate}
                        </div>
                        <div className="text-[10px] font-medium text-slate-400">Zaznamenaný tréninkový den</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-start md:justify-end">
                      {hasMorning && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50/80 text-blue-700 border border-blue-100">
                          <Waves className="w-4 h-4 text-blue-500" />
                          <span>Ráno: <strong>{row.morning_km} km</strong></span>
                        </div>
                      )}

                      {hasAfternoon && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50/80 text-indigo-700 border border-indigo-100">
                          <Waves className="w-4 h-4 text-indigo-500" />
                          <span>Odpoledne: <strong>{row.afternoon_km} km</strong></span>
                        </div>
                      )}

                      {hasDry && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50/80 text-amber-700 border border-amber-100">
                          <Dumbbell className="w-4 h-4 text-amber-500" />
                          <span>Suchá: <strong>{row.dry_minutes} min</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              Žádné aktivní záznamy docházky v databázi.
            </div>
          )}
        </div>
      )}

    </div>
  );
}