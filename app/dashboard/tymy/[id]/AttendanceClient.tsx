'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  Calendar, 
  UserPlus, 
  Trash2, 
  Loader2,
  Check,
  SlidersHorizontal,
  AlertCircle,
  ArrowDownToLine,
  Sun,
  Sunset,
  Dumbbell,
  ClipboardList,
  LayoutGrid,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

type Swimmer = {
  id: string;
  first_name: string;
  last_name: string;
  team_id?: number | string | null;
};

type AttendanceRecord = {
  id?: number;
  swimmer_id: string;
  date: string;
  morning_km: number;
  afternoon_km: number;
  dry_minutes: number;
};

type ActiveTab = 'morning_km' | 'afternoon_km' | 'dry_minutes';
type MainView = 'input' | 'overview';

// Kalkulačková klávesnice pro zadávání hodnoty šablony
function QuickValueInput({
  value,
  onSave,
  unit,
  label,
}: {
  value: number;
  onSave: (val: number) => void;
  unit: string;
  label?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempVal, setTempVal] = useState(String(value));

  useEffect(() => {
    setTempVal(String(value));
  }, [value]);

  const handleKeyPress = (char: string) => {
    if (char === 'del') {
      setTempVal((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
    } else if (char === ',') {
      if (!tempVal.includes(',') && !tempVal.includes('.')) {
        setTempVal((prev) => prev + ',');
      }
    } else {
      setTempVal((prev) => (prev === '0' ? char : prev + char));
    }
  };

  const handleSave = () => {
    const parsed = parseFloat(tempVal.replace(',', '.')) || 0;
    setTempVal(String(parsed));
    if (parsed !== value) {
      onSave(parsed);
    }
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 hover:border-blue-400 transition-all flex items-center justify-center gap-1 min-w-[64px]"
      >
        <span>{value}</span>
        <span className="text-[10px] text-slate-400 font-normal">{unit}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-xs rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {label || 'Nastavit šablonu'} ({unit})
              </span>
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-center">
              <span className="text-2xl font-extrabold text-slate-900">{tempVal || '0'}</span>
              <span className="text-xs font-bold text-slate-400 ml-1.5">{unit}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'del'].map((btn) => (
                <button
                  key={btn}
                  type="button"
                  onClick={() => handleKeyPress(btn)}
                  className="py-3.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-base rounded-xl transition-all shadow-2xs flex items-center justify-center"
                >
                  {btn === 'del' ? '⌫' : btn}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTempVal('0');
                  onSave(0);
                  setIsOpen(false);
                }}
                className="py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl transition-all"
              >
                Nula (0)
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md"
              >
                Uložit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Vlastní číselná klávesnice pro mobilní zařízení i desktop v buňkách
function CellInput({
  swimmerId,
  field,
  value,
  onSave,
  unit,
}: {
  swimmerId: string;
  field: ActiveTab;
  value: number;
  step: string;
  onSave: (swimmerId: string, field: ActiveTab, val: number) => void;
  unit: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempVal, setTempVal] = useState(String(value));

  useEffect(() => {
    setTempVal(String(value));
  }, [value]);

  const handleKeyPress = (char: string) => {
    if (char === 'del') {
      setTempVal((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
    } else if (char === ',') {
      if (!tempVal.includes(',') && !tempVal.includes('.')) {
        setTempVal((prev) => prev + ',');
      }
    } else {
      setTempVal((prev) => (prev === '0' ? char : prev + char));
    }
  };

  const handleSave = () => {
    const parsed = parseFloat(tempVal.replace(',', '.')) || 0;
    setTempVal(String(parsed));
    if (parsed !== value) {
      onSave(swimmerId, field, parsed);
    }
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 text-center bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 hover:border-blue-400 transition-all flex items-center justify-center gap-1 min-w-[64px]"
      >
        <span>{value}</span>
        <span className="text-[10px] text-slate-400 font-normal">{unit}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-xs rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Zadat hodnotu ({unit})</span>
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-center">
              <span className="text-2xl font-extrabold text-slate-900">{tempVal || '0'}</span>
              <span className="text-xs font-bold text-slate-400 ml-1.5">{unit}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'del'].map((btn) => (
                <button
                  key={btn}
                  type="button"
                  onClick={() => handleKeyPress(btn)}
                  className="py-3.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-base rounded-xl transition-all shadow-2xs flex items-center justify-center"
                >
                  {btn === 'del' ? '⌫' : btn}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTempVal('0');
                  onSave(swimmerId, field, 0);
                  setIsOpen(false);
                }}
                className="py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl transition-all"
              >
                Nula (0)
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md"
              >
                Uložit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function AttendanceClient({
  teamId,
  initialSwimmers = [],
  initialAttendance = [],
  isAdmin = false,
  allSwimmers = [],
}: {
  teamId: string;
  initialSwimmers?: Swimmer[];
  initialAttendance?: AttendanceRecord[];
  isAdmin?: boolean;
  allSwimmers?: Swimmer[];
}) {
  const [swimmers, setSwimmers] = useState<Swimmer[]>(initialSwimmers);
  const [allAvailableSwimmers, setAllAvailableSwimmers] = useState<Swimmer[]>(allSwimmers);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialAttendance);
  
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [selectedNewSwimmer, setSelectedNewSwimmer] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const [mainView, setMainView] = useState<MainView>('input');
  const [activeTab, setActiveTab] = useState<ActiveTab>('morning_km');
  const [fieldStatuses, setFieldStatuses] = useState<{ [key: string]: 'saving' | 'saved' | 'error' | null }>({});

  const [quickValues, setQuickValues] = useState<{
    morning_km: number;
    afternoon_km: number;
    dry_minutes: number;
  }>({
    morning_km: 0,
    afternoon_km: 0,
    dry_minutes: 45,
  });

  const [weeklyAttendance, setWeeklyAttendance] = useState<AttendanceRecord[]>([]);
  const [loadingWeekly, setLoadingWeekly] = useState(false);

  const getWeekDays = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const dayOfWeek = d.getDay();
    const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(year, month - 1, diff);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const current = new Date(monday);
      current.setDate(monday.getDate() + i);
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const dayNum = String(current.getDate()).padStart(2, '0');
      days.push(`${y}-${m}-${dayNum}`);
    }
    return days;
  };

  const shiftDay = (daysCount: number) => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() + daysCount);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${dayNum}`);
  };

  const shiftWeek = (weeksCount: number) => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() + weeksCount * 7);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${dayNum}`);
  };

  const formatWeekRange = (weekDaysArray: string[]) => {
    if (!weekDaysArray || weekDaysArray.length < 7) return '';
    const start = new Date(weekDaysArray[0]);
    const end = new Date(weekDaysArray[6]);
    const startStr = `${start.getDate()}.${start.getMonth() + 1}.`;
    const endStr = `${end.getDate()}.${end.getMonth() + 1}.${end.getFullYear()}`;
    return `${startStr} - ${endStr}`;
  };

  const loadData = useCallback(async () => {
    if (!teamId) return;
    setLoadingData(true);

    try {
      const numericTeamId = Number(teamId);

      const { data: swData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, team_id')
        .eq('team_id', numericTeamId);

      const fetchedSwimmers: Swimmer[] = (swData || []).sort((a, b) => 
        (a.last_name || '').localeCompare(b.last_name || '')
      );
      setSwimmers(fetchedSwimmers);

      const { data: allData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, team_id');
      if (allData) setAllAvailableSwimmers(allData);

      const swimmerIds = fetchedSwimmers.map((s) => s.id);
      if (swimmerIds.length > 0) {
        const startOfDay = `${selectedDate}T00:00:00Z`;
        const endOfDay = `${selectedDate}T23:59:59Z`;

        const { data: attData } = await supabase
          .from('attendance')
          .select('*')
          .in('swimmer_id', swimmerIds)
          .gte('date', startOfDay)
          .lte('date', endOfDay);

        setAttendance(attData || []);

        const weekDays = getWeekDays(selectedDate);
        const firstDay = `${weekDays[0]}T00:00:00Z`;
        const lastDay = `${weekDays[6]}T23:59:59Z`;

        setLoadingWeekly(true);
        const { data: weekData } = await supabase
          .from('attendance')
          .select('*')
          .in('swimmer_id', swimmerIds)
          .gte('date', firstDay)
          .lte('date', lastDay);

        setWeeklyAttendance(weekData || []);
        setLoadingWeekly(false);
      } else {
        setAttendance([]);
        setWeeklyAttendance([]);
      }
    } catch (err) {
      console.error('Kritická chyba v loadData:', err);
    } finally {
      setLoadingData(false);
    }
  }, [teamId, selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const executeFieldSave = async (swimmerId: string, field: keyof AttendanceRecord, val: number) => {
    const statusKey = `${swimmerId}_${field}`;
    setFieldStatuses((prev) => ({ ...prev, [statusKey]: 'saving' }));

    setAttendance((prev) => {
      const list = prev || [];
      const existingIndex = list.findIndex(
        (a) => a.swimmer_id === swimmerId && a.date && a.date.startsWith(selectedDate)
      );

      if (existingIndex > -1) {
        const updated = [...list];
        updated[existingIndex] = { ...updated[existingIndex], [field]: val };
        return updated;
      } else {
        return [
          ...list,
          {
            swimmer_id: swimmerId,
            date: selectedDate,
            morning_km: field === 'morning_km' ? val : 0,
            afternoon_km: field === 'afternoon_km' ? val : 0,
            dry_minutes: field === 'dry_minutes' ? val : 0,
          },
        ];
      }
    });

    const formattedDate = `${selectedDate}T00:00:00Z`;
    const record = attendance.find(
      (a) => a.swimmer_id === swimmerId && a.date && a.date.startsWith(selectedDate)
    );

    const { error } = await supabase.from('attendance').upsert(
      {
        swimmer_id: swimmerId,
        date: formattedDate,
        morning_km: field === 'morning_km' ? val : Number(record?.morning_km) || 0,
        afternoon_km: field === 'afternoon_km' ? val : Number(record?.afternoon_km) || 0,
        dry_minutes: field === 'dry_minutes' ? val : Number(record?.dry_minutes) || 0,
      },
      { onConflict: 'swimmer_id,date' }
    );

    if (error) {
      console.error('Chyba při ukládání:', error.message);
      setFieldStatuses((prev) => ({ ...prev, [statusKey]: 'error' }));
    } else {
      setFieldStatuses((prev) => ({ ...prev, [statusKey]: 'saved' }));
      setTimeout(() => {
        setFieldStatuses((prev) => (prev[statusKey] === 'saved' ? { ...prev, [statusKey]: null } : prev));
      }, 2000);
    }
  };

  const applyQuickValueToField = (swimmerId: string, field: keyof AttendanceRecord, templateValue: number) => {
    executeFieldSave(swimmerId, field, templateValue);
  };

  const addSwimmerToTeam = async () => {
    if (!selectedNewSwimmer) return;

    const { error } = await supabase
      .from('profiles')
      .update({ team_id: Number(teamId) })
      .eq('id', selectedNewSwimmer);

    if (error) {
      alert('Chyba při přidávání plavce: ' + error.message);
    } else {
      setSelectedNewSwimmer('');
      setIsAdding(false);
      await loadData();
    }
  };

  const removeSwimmerFromTeam = async (swimmerId: string) => {
    if (!confirm('Opravdu chceš tohoto plavce vyškrtnout z týmu?')) return;

    const { error } = await supabase
      .from('profiles')
      .update({ team_id: null })
      .eq('id', swimmerId);

    if (error) {
      alert('Chyba při odstraňování: ' + error.message);
    } else {
      await loadData();
    }
  };

  const availableToAdd = allAvailableSwimmers.filter(
    (s) => !swimmers.some((ts) => ts.id === s.id)
  );

  const tabConfig = {
    morning_km: { label: 'Ranní plavání (km)', icon: Sun, color: 'text-amber-500', unit: 'km', step: '0.1' },
    afternoon_km: { label: 'Odpolední plavání (km)', icon: Sunset, color: 'text-orange-500', unit: 'km', step: '0.1' },
    dry_minutes: { label: 'Suchá příprava (min)', icon: Dumbbell, color: 'text-indigo-500', unit: 'min', step: '1' },
  };

  const ActiveIcon = tabConfig[activeTab].icon;
  const weekDays = getWeekDays(selectedDate);
  const dayNamesShort = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];

  return (
    <div className="p-3 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-4">
      {/* Hlavička */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-base sm:text-xl font-bold text-slate-900">Správa plavců a docházky</h1>
          <p className="text-[11px] sm:text-xs text-slate-500">Plavecký klub Znojmo</p>
        </div>

        <div className="flex items-center gap-2">
          {mainView === 'input' ? (
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button type="button" onClick={() => shiftDay(-1)} className="p-1 hover:bg-slate-200/70 rounded-lg text-slate-600 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5 px-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs font-semibold text-slate-800 focus:outline-none bg-transparent"
                />
              </div>
              <button type="button" onClick={() => shiftDay(1)} className="p-1 hover:bg-slate-200/70 rounded-lg text-slate-600 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button type="button" onClick={() => shiftWeek(-1)} className="p-1 hover:bg-slate-200/70 rounded-lg text-slate-600 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5 px-2 py-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-bold text-slate-800">{formatWeekRange(weekDays)}</span>
              </div>
              <button type="button" onClick={() => shiftWeek(1)} className="p-1 hover:bg-slate-200/70 rounded-lg text-slate-600 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hlavní přepínač záložek */}
      <div className="grid grid-cols-2 gap-2 bg-slate-200/70 p-1.5 rounded-2xl">
        <button
          type="button"
          onClick={() => setMainView('input')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            mainView === 'input' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Trénink (Zadávání)</span>
        </button>

        <button
          type="button"
          onClick={() => setMainView('overview')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            mainView === 'overview' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Docházka (Přehled týdne)</span>
        </button>
      </div>

      {mainView === 'input' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveTab('morning_km')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'morning_km' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">Ráno</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('afternoon_km')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'afternoon_km' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sunset className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span className="truncate">Odpoledne</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('dry_minutes')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'dry_minutes' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="truncate">Suchá</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 p-3.5 rounded-2xl shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Rychlá šablona: {tabConfig[activeTab].label}</div>
                <div className="text-[10px] text-slate-500">Hodnota pro hromadné vyplnění tlačítkem u plavce.</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <QuickValueInput
                value={quickValues[activeTab]}
                unit={tabConfig[activeTab].unit}
                label={`Šablona: ${tabConfig[activeTab].label}`}
                onSave={(val) =>
                  setQuickValues((prev) => ({
                    ...prev,
                    [activeTab]: val,
                  }))
                }
              />
            </div>
          </div>

          {isAdmin && (
            <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Správa členů týmu</div>
                  <div className="text-[10px] text-slate-500">Přidání nebo odebrání plavce</div>
                </div>
              </div>

              {!isAdding ? (
                <button
                  type="button"
                  onClick={() => setIsAdding(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Přidat plavce
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
                  <select
                    value={selectedNewSwimmer}
                    onChange={(e) => setSelectedNewSwimmer(e.target.value)}
                    className="w-full sm:w-60 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                  >
                    <option value="">Vyber plavce...</option>
                    {availableToAdd.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.last_name} {s.first_name}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={addSwimmerToTeam}
                      className="flex-1 sm:flex-none px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-all"
                    >
                      Uložit
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="flex-1 sm:flex-none px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl transition-all"
                    >
                      Zrušit
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            {loadingData ? (
              <div className="text-center py-10 text-slate-400 text-xs font-medium bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  Načítání plavců...
                </div>
              </div>
            ) : swimmers.length > 0 ? (
              swimmers.map((swimmer) => {
                const record =
                  attendance.find(
                    (a) => a.swimmer_id === swimmer.id && a.date && a.date.startsWith(selectedDate)
                  ) || {
                    swimmer_id: swimmer.id,
                    date: selectedDate,
                    morning_km: 0,
                    afternoon_km: 0,
                    dry_minutes: 0,
                  };

                const currentValue = record[activeTab];
                const statusKey = `${swimmer.id}_${activeTab}`;
                const fieldStatus = fieldStatuses[statusKey];

                return (
                  <div 
                    key={swimmer.id} 
                    className="bg-white border border-slate-200/80 rounded-xl px-3 sm:px-4 py-2.5 shadow-sm flex items-center justify-between gap-2 hover:border-slate-300 transition-all"
                  >
                    <div className="font-bold text-slate-900 text-xs sm:text-sm min-w-0 flex-1 truncate pr-2">
                      <Link 
                        href={`/dashboard/plavec/${swimmer.id}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {swimmer.last_name} {swimmer.first_name}
                      </Link>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1.5 rounded-xl border border-slate-200/80">
                        <ActiveIcon className={`w-3.5 h-3.5 ${tabConfig[activeTab].color} shrink-0`} />
                        
                        <CellInput
                          swimmerId={swimmer.id}
                          field={activeTab}
                          value={currentValue}
                          step={tabConfig[activeTab].step}
                          onSave={executeFieldSave}
                          unit={tabConfig[activeTab].unit}
                        />

                        <button
                          type="button"
                          onClick={() => applyQuickValueToField(swimmer.id, activeTab, quickValues[activeTab])}
                          className="px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                          title={`Vložit šablonu (${quickValues[activeTab]} ${tabConfig[activeTab].unit})`}
                        >
                          <ArrowDownToLine className="w-3.5 h-3.5" />
                          <span className="text-[10px] hidden sm:inline">Šablona</span>
                        </button>
                      </div>

                      <div className="w-4 flex items-center justify-center">
                        {fieldStatus === 'saving' && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />}
                        {fieldStatus === 'saved' && (
                          <span title="Uloženo" className="inline-flex items-center">
                            <Check className="w-4 h-4 text-emerald-600" />
                          </span>
                        )}
                        {fieldStatus === 'error' && (
                          <span title="Chyba" className="inline-flex items-center">
                            <AlertCircle className="w-4 h-4 text-rose-500" />
                          </span>
                        )}
                      </div>
                      
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => removeSwimmerFromTeam(swimmer.id)}
                          title="Vyškrtnout z týmu"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs font-medium bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                V tomto týmu nejsou zapsáni žádní plavci.
              </div>
            )}
          </div>
        </div>
      )}

      {mainView === 'overview' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Týdenní přehled docházky</h2>
              <p className="text-[11px] text-slate-500">Období: {formatWeekRange(weekDays)}</p>
            </div>
          </div>

          {loadingWeekly ? (
            <div className="text-center py-12 text-slate-400 text-xs font-medium">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                Načítání přehledu týdne...
              </div>
            </div>
          ) : swimmers.length > 0 ? (
            <div className="space-y-4">
              {/* SOUHRNNÝ PANEL DENNÍCH TRÉNINKŮ */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 space-y-2">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Celkový přehled tréninků v týdnu (počet zapsaných plavců)</span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {weekDays.map((dayStr, idx) => {
                    const [, m, d] = dayStr.split('-').map(Number);
                    const recordsForDay = weeklyAttendance.filter(a => a.date && a.date.startsWith(dayStr));
                    const morningCount = recordsForDay.filter(a => Number(a.morning_km) > 0).length;
                    const afternoonCount = recordsForDay.filter(a => Number(a.afternoon_km) > 0).length;
                    const dryCount = recordsForDay.filter(a => Number(a.dry_minutes) > 0).length;

                    return (
                      <div key={dayStr} className="bg-white border border-slate-200/80 rounded-lg p-1.5 shadow-2xs">
                        <div className="text-[10px] font-bold text-slate-800">{dayNamesShort[idx]}</div>
                        <div className="text-[9px] text-slate-400 mb-1">{d}.{m}.</div>
                        <div className="space-y-0.5 text-[10px]">
                          <div className={`px-1 rounded flex items-center justify-between ${morningCount > 0 ? 'bg-amber-50 text-amber-800 font-bold' : 'bg-rose-50 text-rose-600 font-bold'}`}>
                            <span>☀️</span><span>{morningCount}</span>
                          </div>
                          <div className={`px-1 rounded flex items-center justify-between ${afternoonCount > 0 ? 'bg-orange-50 text-orange-800 font-bold' : 'bg-rose-50 text-rose-600 font-bold'}`}>
                            <span>🌙</span><span>{afternoonCount}</span>
                          </div>
                          <div className={`px-1 rounded flex items-center justify-between ${dryCount > 0 ? 'bg-indigo-50 text-indigo-800 font-bold' : 'bg-rose-50 text-rose-600 font-bold'}`}>
                            <span>🏋️</span><span>{dryCount}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mobilní zobrazení (Karty pro každého plavce) */}
              <div className="block sm:hidden space-y-3">
                {swimmers.map((swimmer) => (
                  <div key={swimmer.id} className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 space-y-2">
                    <div className="font-bold text-slate-900 text-xs pb-1 border-b border-slate-200/60 flex items-center justify-between">
                      <Link 
                        href={`/dashboard/plavec/${swimmer.id}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {swimmer.last_name} {swimmer.first_name}
                      </Link>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center">
                      {weekDays.map((dayStr, idx) => {
                        const [, m, d] = dayStr.split('-').map(Number);
                        const record = weeklyAttendance.find(
                          (a) => a.swimmer_id === swimmer.id && a.date && a.date.startsWith(dayStr)
                        );
                        const morning = record ? Number(record.morning_km) || 0 : 0;
                        const afternoon = record ? Number(record.afternoon_km) || 0 : 0;
                        const dry = record ? Number(record.dry_minutes) || 0 : 0;
                        const hasAny = morning > 0 || afternoon > 0 || dry > 0;

                        return (
                          <div key={dayStr} className={`p-1 rounded-lg border ${hasAny ? 'bg-white border-blue-200 shadow-2xs' : 'bg-slate-100/50 border-transparent'}`}>
                            <div className="text-[10px] font-bold text-slate-600">{dayNamesShort[idx]}</div>
                            <div className="text-[9px] text-slate-400">{d}.{m}.</div>
                            <div className="mt-1 flex flex-col gap-0.5 items-center">
                              {morning > 0 && <span className="text-[9px] bg-amber-50 text-amber-700 px-1 rounded font-bold" title="Ráno">☀️{morning}</span>}
                              {afternoon > 0 && <span className="text-[9px] bg-orange-50 text-orange-700 px-1 rounded font-bold" title="Odpoledne">🌙{afternoon}</span>}
                              {dry > 0 && <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1 rounded font-bold" title="Suchá">🏋️{dry}</span>}
                              {!hasAny && <span className="text-[10px] text-slate-300">—</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Stolní zobrazení (Tabulka pro širší obrazovky) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/70">
                      <th className="py-2.5 px-3 rounded-l-xl">Plavec</th>
                      {weekDays.map((dayStr, idx) => {
                        const [, m, d] = dayStr.split('-').map(Number);
                        return (
                          <th key={dayStr} className="py-2.5 px-2 text-center">
                            <div className="font-bold text-slate-800">{dayNamesShort[idx]}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{d}.{m}.</div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {swimmers.map((swimmer) => (
                      <tr key={swimmer.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-3 truncate max-w-[140px]">
                          <Link 
                            href={`/dashboard/plavec/${swimmer.id}`}
                            className="font-bold text-slate-900 hover:text-blue-600 transition-colors block truncate"
                          >
                            {swimmer.last_name} {swimmer.first_name}
                          </Link>
                        </td>

                        {weekDays.map((dayStr) => {
                          const record = weeklyAttendance.find(
                            (a) => a.swimmer_id === swimmer.id && a.date && a.date.startsWith(dayStr)
                          );

                          const morning = record ? Number(record.morning_km) || 0 : 0;
                          const afternoon = record ? Number(record.afternoon_km) || 0 : 0;
                          const dry = record ? Number(record.dry_minutes) || 0 : 0;
                          const hasAny = morning > 0 || afternoon > 0 || dry > 0;

                          return (
                            <td key={dayStr} className="py-2.5 px-1.5 text-center align-middle">
                              {hasAny ? (
                                <div className="flex flex-col gap-1 items-center justify-center">
                                  {morning > 0 && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60 whitespace-nowrap shadow-2xs" title={`Ráno: ${morning} km`}>
                                      <span>☀️</span> {morning} km
                                    </span>
                                  )}
                                  {afternoon > 0 && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200/60 whitespace-nowrap shadow-2xs" title={`Odpoledne: ${afternoon} km`}>
                                      <span>🌙</span> {afternoon} km
                                    </span>
                                  )}
                                  {dry > 0 && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 whitespace-nowrap shadow-2xs" title={`Suchá: ${dry} min`}>
                                      <span>🏋️</span> {dry} m
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-300 text-xs font-medium">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs font-medium">
              V tomto týmu nejsou zapsáni žádní plavci.
            </div>
          )}
        </div>
      )}
    </div>
  );
}