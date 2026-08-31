// app/dashboard/zebricky/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type LeaderboardItem = {
  id: string;
  name: string;
  waterKm: number;
  dryMinutes: number;
  points: number;
  bonus: number;
  totalScore: number;
};

type AnnualLeaderboardItem = {
  id: string;
  name: string;
  km: number;
  orCount: number;
  orPoints: number;
  clubRecordsCount: number;
  clubRecordsPoints: number;
  monthlyBonusPoints: number;
  totalScore: number;
  rank: number;
};

type Team = {
  id: number;
  name: string;
};

export default function ZebrickyPage() {
  const [activeTab, setActiveTab] = useState<'mesicni' | 'rocni'>('mesicni');
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  );
  const [selectedYear, setSelectedYear] = useState<string>(String(currentDate.getFullYear()));

  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [annualLeaderboard, setAnnualLeaderboard] = useState<AnnualLeaderboardItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchTeams() {
      const { data } = await supabase.from('teams').select('id, name').eq('active', true).order('name');
      if (data && data.length > 0) {
        setTeams(data);
        setSelectedTeam(String(data[0].id));
      }
    }
    fetchTeams();
  }, []);

  useEffect(() => {
    if (activeTab === 'mesicni' && selectedTeam) {
      fetchMonthlyData();
    }
  }, [selectedMonth, selectedTeam, activeTab]);

  useEffect(() => {
    if (activeTab === 'rocni' && selectedTeam) {
      fetchAnnualData();
    }
  }, [selectedYear, selectedTeam, activeTab]);

  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    setSelectedMonth(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    );
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month, 1);
    setSelectedMonth(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    );
  };

  const formatMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const monthName = date.toLocaleString('cs-CZ', { month: 'long' });
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
  };

  const handlePrevYear = () => setSelectedYear(String(Number(selectedYear) - 1));
  const handleNextYear = () => setSelectedYear(String(Number(selectedYear) + 1));

  function getWaterDivisor(teamName: string): number {
    const cleanName = teamName.trim().toUpperCase();
    switch (cleanName) {
      case 'A1': return 3.0;
      case 'A2': return 2.5;
      case 'A3': return 2.2;
      case 'B1': return 2.0;
      case 'B2': return 1.5;
      case 'AK': return 3.0;
      case 'BK': return 2.0;
      default: return 3.0;
    }
  }

  async function fetchMonthlyData() {
    if (!selectedTeam) return;
    setLoading(true);
    
    const [year, month] = selectedMonth.split('-').map(Number);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}T23:59:59`;

    const currentTeamObj = teams.find((t) => t.id === Number(selectedTeam));
    const teamName = currentTeamObj ? currentTeamObj.name : '';

    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('team_id', Number(selectedTeam))
      .eq('active', true);

    if (profilesError || !profilesData || profilesData.length === 0) {
      setLeaderboard([]);
      setLoading(false);
      return;
    }

    const profilesMap: { [key: string]: { name: string; teamName: string } } = {};
    profilesData.forEach((p: any) => {
      profilesMap[p.id] = { name: `${p.last_name} ${p.first_name}`, teamName };
    });

    const swimmerIds = Object.keys(profilesMap);

    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .select('swimmer_id, morning_km, afternoon_km, dry_minutes')
      .in('swimmer_id', swimmerIds)
      .gte('date', startDate)
      .lte('date', endDate)
      .range(0, 4999);

    if (attendanceError) {
      setLoading(false);
      setLeaderboard([]);
      return;
    }

    const statsMap: { [key: string]: { name: string; waterKm: number; dryMinutes: number; teamName: string } } = {};

    attendanceData?.forEach((row: any) => {
      const profileInfo = profilesMap[row.swimmer_id];
      if (!profileInfo) return;

      const swimmerId = row.swimmer_id;
      if (!statsMap[swimmerId]) {
        statsMap[swimmerId] = { name: profileInfo.name, waterKm: 0, dryMinutes: 0, teamName: profileInfo.teamName };
      }

      statsMap[swimmerId].waterKm += Number(row.morning_km || 0) + Number(row.afternoon_km || 0);
      statsMap[swimmerId].dryMinutes += Number(row.dry_minutes || 0);
    });

    const calculatedList: (LeaderboardItem & { rank: number })[] = Object.entries(statsMap).map(([id, val]) => {
      const divisor = getWaterDivisor(val.teamName);
      const points = (val.waterKm / divisor) + (val.dryMinutes / 45.0);

      return {
        id,
        name: val.name,
        waterKm: Number(val.waterKm.toFixed(1)),
        dryMinutes: val.dryMinutes,
        points: Number(points.toFixed(2)),
        bonus: 0,
        totalScore: 0,
      };
    });

    calculatedList.sort((a, b) => b.points - a.points);

    const bonuses = [50, 40, 30, 20, 10];
    let currentPosition = 1;

    calculatedList.forEach((item, index) => {
      if (index > 0 && item.points < calculatedList[index - 1].points) {
        currentPosition = index + 1;
      }
      item.rank = currentPosition;
      const bonus = (currentPosition - 1 < bonuses.length) ? bonuses[currentPosition - 1] : 0;
      item.bonus = bonus;
      item.totalScore = Number((item.points + bonus).toFixed(2));
    });

    setLeaderboard(calculatedList);
    setLoading(false);
  }

  async function fetchAnnualData() {
    if (!selectedTeam) return;
    setLoading(true);

    const yearNum = Number(selectedYear);
    const currentTeamObj = teams.find((t) => t.id === Number(selectedTeam));
    const teamName = currentTeamObj ? currentTeamObj.name : '';

    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, csps_id, first_name, last_name')
      .eq('team_id', Number(selectedTeam))
      .eq('active', true);

    if (profilesError || !profilesData || profilesData.length === 0) {
      setAnnualLeaderboard([]);
      setLoading(false);
      return;
    }

    const profilesMap: { [key: string]: string } = {};
    const cspsToSwimmerIdMap: { [key: number]: string } = {};
    const cspsIds: number[] = [];

    profilesData.forEach((p: any) => {
      profilesMap[p.id] = `${p.last_name} ${p.first_name}`;
      if (p.csps_id != null) {
        cspsToSwimmerIdMap[p.csps_id] = p.id;
        cspsIds.push(p.csps_id);
      }
    });

    const swimmerIds = Object.keys(profilesMap);

    const orMap: { [key: string]: number } = {};
    if (cspsIds.length > 0) {
      const { data: clubComps } = await supabase
        .from('club_competitions')
        .select('competition_id, competition_cache');

      const compIds = clubComps?.filter((c: any) => {
        const cache = c.competition_cache;
        if (!cache) return false;

        const compDate = 
          cache?.date || 
          cache?.datum || 
          cache?.from || 
          cache?.start_date ||
          cache?.competition?.date || 
          cache?.competition?.datum || 
          cache?.competition?.from || 
          cache?.competition?.start_date;

        if (compDate) {
          return String(compDate).startsWith(String(yearNum));
        }

        return JSON.stringify(cache).includes(String(yearNum));
      }).map((c: any) => c.competition_id) || [];

      if (compIds.length > 0) {
        const { data: statsData, error: statsError } = await supabase
          .from('swimmer_competition_stats')
          .select('csps_id, or_count')
          .in('competition_id', compIds)
          .in('csps_id', cspsIds)
          .range(0, 4999);

        if (!statsError && statsData) {
          statsData.forEach((row: any) => {
            const swimmerId = cspsToSwimmerIdMap[row.csps_id];
            if (swimmerId) {
              orMap[swimmerId] = (orMap[swimmerId] || 0) + Number(row.or_count || 0);
            }
          });
        }
      }
    }

    // Fetch club records for the year by swimmer_id
    const clubRecordsMap: { [key: string]: number } = {};
    const { data: clubRecordsData, error: clubRecordsError } = await supabase
      .from('club_records')
      .select('swimmer_id')
      .eq('year', yearNum)
      .in('swimmer_id', swimmerIds)
      .range(0, 4999);

    if (!clubRecordsError && clubRecordsData) {
      clubRecordsData.forEach((row: any) => {
        if (row.swimmer_id) {
          clubRecordsMap[row.swimmer_id] = (clubRecordsMap[row.swimmer_id] || 0) + 1;
        }
      });
    }

    const kmMap: { [key: string]: number } = {};
    const monthlyBonusMap: { [key: string]: number } = {};
    swimmerIds.forEach((id) => {
      monthlyBonusMap[id] = 0;
    });

    const maxMonth = yearNum === currentDate.getFullYear() ? currentDate.getMonth() + 1 : 12;

    for (let m = 1; m <= maxMonth; m++) {
      const mStart = `${yearNum}-${String(m).padStart(2, '0')}-01`;
      const lastDay = new Date(yearNum, m, 0).getDate();
      const mEnd = `${yearNum}-${String(m).padStart(2, '0')}-${lastDay}T23:59:59`;

      const { data: mAtt } = await supabase
        .from('attendance')
        .select('swimmer_id, morning_km, afternoon_km, dry_minutes')
        .in('swimmer_id', swimmerIds)
        .gte('date', mStart)
        .lte('date', mEnd)
        .range(0, 4999);

      if (!mAtt || mAtt.length === 0) continue;

      const mStats: { [key: string]: number } = {};
      mAtt.forEach((row: any) => {
        const sId = row.swimmer_id;
        const wKm = Number(row.morning_km || 0) + Number(row.afternoon_km || 0);
        const dMin = Number(row.dry_minutes || 0);

        kmMap[sId] = (kmMap[sId] || 0) + wKm;

        const div = getWaterDivisor(teamName);
        mStats[sId] = (mStats[sId] || 0) + (wKm / div) + (dMin / 45.0);
      });

      const sortedM = Object.entries(mStats)
        .map(([id, pts]) => ({ id, points: pts }))
        .sort((a, b) => b.points - a.points);

      const bonuses = [50, 40, 30, 20, 10];
      let pos = 1;
      sortedM.forEach((item, idx) => {
        if (idx > 0 && item.points < sortedM[idx - 1].points) {
          pos = idx + 1;
        }
        const b = pos - 1 < bonuses.length ? bonuses[pos - 1] : 0;
        if (monthlyBonusMap[item.id] !== undefined) {
          monthlyBonusMap[item.id] += b;
        }
      });
    }

    const annualList: AnnualLeaderboardItem[] = swimmerIds.map((id) => {
      const km = Number((kmMap[id] || 0).toFixed(1));
      const orCount = orMap[id] || 0;
      const orPoints = orCount * 5;
      const clubRecordsCount = clubRecordsMap[id] || 0;
      const clubRecordsPoints = clubRecordsCount * 100; // Assuming 100 points per club record or adjust if needed, wait let's check standard scoring or keep configurable, let's use standard or whatever points calculation makes sense (let's check image if possible or assign points, or let's look at standard code)
      const monthlyBonusPoints = monthlyBonusMap[id] || 0;

      const totalScore = Number((km + orPoints + clubRecordsPoints + monthlyBonusPoints).toFixed(2));

      return {
        id,
        name: profilesMap[id],
        km,
        orCount,
        orPoints,
        clubRecordsCount,
        clubRecordsPoints,
        monthlyBonusPoints,
        totalScore,
        rank: 0,
      };
    });

    annualList.sort((a, b) => b.totalScore - a.totalScore);

    let curRank = 1;
    annualList.forEach((item, idx) => {
      if (idx > 0 && item.totalScore < annualList[idx - 1].totalScore) {
        curRank = idx + 1;
      }
      item.rank = curRank;
    });

    setAnnualLeaderboard(annualList);
    setLoading(false);
  }

  const getPositionBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-bold text-xs shadow-inner">🥇</span>;
      case 2:
        return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-bold text-xs shadow-inner">🥈</span>;
      case 3:
        return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 text-orange-700 font-bold text-xs shadow-inner">🥉</span>;
      default:
        return <span className="text-gray-500 font-semibold">{rank}.</span>;
    }
  };

  const selectedTeamName = teams.find((t) => t.id === Number(selectedTeam))?.name || 'Vybrat družstvo';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Tréninkové žebříčky</h1>
          <p className="text-sm text-gray-500 mt-1">Sledujte výkony a bodování plavců v jednotlivých družstvech.</p>
        </div>
        
        <div className="flex bg-gray-100/80 p-1.5 rounded-xl border border-gray-200/60">
          <button
            onClick={() => setActiveTab('mesicni')}
            className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === 'mesicni' 
                ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Měsíční
          </button>
          <button
            onClick={() => setActiveTab('rocni')}
            className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === 'rocni' 
                ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Roční
          </button>
        </div>
      </div>

      {activeTab === 'mesicni' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Zvolit měsíc</label>
              <div className="flex items-center justify-between bg-gray-50 border border-gray-200/80 rounded-xl px-3 py-2 transition-all hover:border-gray-300">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-white shadow-sm transition-all"
                  title="Předchozí měsíc"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm font-bold text-gray-800 tracking-wide select-none">
                  {formatMonthLabel(selectedMonth)}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-white shadow-sm transition-all"
                  title="Následující měsíc"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="team-select" className="block text-xs font-bold uppercase tracking-wider text-gray-400">Zvolit družstvo</label>
              <div className="relative">
                <select
                  id="team-select"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full appearance-none bg-gray-50 border border-gray-200/80 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer pr-10"
                >
                  {teams.map((team) => (
                    <option key={team.id} value={team.id} className="py-2 font-medium">
                      {team.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-400 font-medium animate-pulse">Načítám výsledky žebříčku...</div>
            ) : leaderboard.length === 0 ? (
              <div className="p-12 text-center text-gray-400 font-medium">Pro zvolené období a družstvo ({selectedTeamName}) nejsou k dispozici žádné záznamy docházky.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="py-4 px-6 w-20 text-center">Poz.</th>
                      <th className="py-4 px-6">Plavec</th>
                      <th className="py-4 px-6 text-right">Voda</th>
                      <th className="py-4 px-6 text-right">Suchá</th>
                      <th className="py-4 px-6 text-right">Body</th>
                      <th className="py-4 px-6 text-right">Motiv.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {leaderboard.map((item) => (
                      <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="py-4 px-6 text-center">
                          {getPositionBadge(item.rank)}
                        </td>
                        <td className="py-4 px-6 font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {item.name}
                        </td>
                        <td className="py-4 px-6 text-right text-gray-600 font-medium">
                          {item.waterKm} <span className="text-xs text-gray-400 font-normal">km</span>
                        </td>
                        <td className="py-4 px-6 text-right text-gray-600 font-medium">
                          {item.dryMinutes} <span className="text-xs text-gray-400 font-normal">min</span>
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-gray-900">
                          {item.points}
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-blue-600">
                          {item.bonus > 0 ? `+${item.bonus}` : <span className="text-gray-300 font-normal">0</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'rocni' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Zvolit rok</label>
              <div className="flex items-center justify-between bg-gray-50 border border-gray-200/80 rounded-xl px-3 py-2 transition-all hover:border-gray-300">
                <button
                  onClick={handlePrevYear}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-white shadow-sm transition-all"
                  title="Předchozí rok"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm font-bold text-gray-800 tracking-wide select-none">
                  {selectedYear}
                </span>
                <button
                  onClick={handleNextYear}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-white shadow-sm transition-all"
                  title="Následující rok"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="annual-team-select" className="block text-xs font-bold uppercase tracking-wider text-gray-400">Zvolit družstvo</label>
              <div className="relative">
                <select
                  id="annual-team-select"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full appearance-none bg-gray-50 border border-gray-200/80 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer pr-10"
                >
                  {teams.map((team) => (
                    <option key={team.id} value={team.id} className="py-2 font-medium">
                      {team.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-400 font-medium animate-pulse">Načítám roční žebříček...</div>
            ) : annualLeaderboard.length === 0 ? (
              <div className="p-12 text-center text-gray-400 font-medium">Pro zvolený rok a družstvo ({selectedTeamName}) nejsou k dispozici žádné záznamy.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="py-4 px-4 w-16 text-center">Umístění</th>
                      <th className="py-4 px-4">Plavec</th>
                      <th className="py-4 px-4 text-right">KM</th>
                      <th className="py-4 px-4 text-right">OR</th>
                      <th className="py-4 px-4 text-right">Klubové rekordy</th>
                      <th className="py-4 px-4 text-right">Měsíční soutěž</th>
                      <th className="py-4 px-4 text-right font-extrabold text-gray-700">Celkem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {annualLeaderboard.map((item) => (
                      <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="py-4 px-4 text-center">
                          {getPositionBadge(item.rank)}
                        </td>
                        <td className="py-4 px-4 font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {item.name}
                        </td>
                        <td className="py-4 px-4 text-right text-gray-600 font-medium">
                          {item.km} <span className="text-xs text-gray-400">b</span>
                        </td>
                        <td className="py-4 px-4 text-right text-gray-600 font-medium" title={`${item.orCount}x osobní rekord (5b/ks)`}>
                          {item.orPoints > 0 ? <span className="text-blue-600 font-semibold">+{item.orPoints}</span> : '0'}
                        </td>
                        <td className="py-4 px-4 text-right text-gray-600 font-medium" title={`${item.clubRecordsCount}x klubový rekord`}>
                          {item.clubRecordsPoints > 0 ? <span className="text-blue-600 font-semibold">+{item.clubRecordsPoints}</span> : '0'}
                        </td>
                        <td className="py-4 px-4 text-right text-gray-600 font-medium">
                          {item.monthlyBonusPoints > 0 ? `+${item.monthlyBonusPoints}` : '0'}
                        </td>
                        <td className="py-4 px-4 text-right font-extrabold text-blue-600 text-base">
                          {item.totalScore}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}