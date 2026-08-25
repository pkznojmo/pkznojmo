'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, 
  Loader2, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  ExternalLink, 
  Bus, 
  Users, 
  FileText, 
  Trophy, 
  Edit3, 
  Save, 
  Star,
  Clock
} from 'lucide-react';

interface CompetitionDetail {
  competitionId: number;
  title: string;
  description?: string;
  sportTitle?: string;
  poolLength?: number;
  location?: string;
  locationRegionName?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  competitionStartDate?: string;
  competitionEndDate?: string;
  registrationEndDate?: string;
  halfDayDtos?: any[];
}

interface CompetitionDocument {
  type: string;
  fileName: string;
}

export default function ZavodDetailPage() {
  const router = useRouter();
  const params = useParams();
  const competitionId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'documents' | 'applications' | 'results'>('info');

  // Data
  const [competition, setCompetition] = useState<CompetitionDetail | null>(null);
  const [documents, setDocuments] = useState<CompetitionDocument[]>([]);
  const [applicationsData, setApplicationsData] = useState<any>(null);

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
      // 1. Zjištění oprávnění uživatele
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: myProfile } = await supabase
          .from('profiles')
          .select('roles')
          .eq('id', session.user.id)
          .single();
        
        if (myProfile && Array.isArray(myProfile.roles)) {
          const lowerRoles = myProfile.roles.map((r: string) => r.toLowerCase());
          if (lowerRoles.some(r => ['coach', 'admin', 'trenér', 'trainer'].includes(r))) {
            setIsCoachOrAdmin(true);
          }
        }
      }

      // 2. Načtení klubových doplňků z DB (použito maybeSingle() proti 406 chybě, pokud záznam neexistuje)
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
      }

      // 3. Načtení dat přes interní API route (obchází CORS)
      const res = await fetch(`/api/competitions/${competitionId}`);
      if (res.ok) {
        const json = await res.json();
        setCompetition(json.competition);
        setDocuments(json.documents || []);
        setApplicationsData(json.applications);
      }

    } catch (err) {
      console.error('Chyba při načítání detailu závodu:', err);
    } finally {
      setLoading(false);
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

      {/* KLÍČOVÁ SEKCE: Logistika (Hromadný odjezd & Sraz na místě) */}
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

      {/* ZÁLOŽKY PRO JEDNOTLIVÉ SEKCE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="flex items-center border-b border-slate-200 overflow-x-auto bg-slate-50/50">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'info' ? 'border-blue-600 text-blue-600 bg-white shadow-2xs' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Detaily a kontakt</span>
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'documents' ? 'border-blue-600 text-blue-600 bg-white shadow-2xs' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Propozice a dokumenty ({documents.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'applications' ? 'border-blue-600 text-blue-600 bg-white shadow-2xs' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Přihlášky / Nominace</span>
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'results' ? 'border-blue-600 text-blue-600 bg-white shadow-2xs' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Výsledky</span>
          </button>
        </div>

        <div className="p-5">
          {activeTab === 'info' && (
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Kontaktní osoby pořadatele</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-lg"><User className="w-4 h-4" /></div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Pořadatel / Osoba</span>
                    <span className="text-xs font-extrabold text-slate-800">{competition.contactName || 'Neuvedeno'}</span>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg"><Phone className="w-4 h-4" /></div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Telefon</span>
                    <a href={`tel:${competition.contactPhone}`} className="text-xs font-extrabold text-blue-600 hover:underline">
                      {competition.contactPhone || 'Neuvedeno'}
                    </a>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center gap-3">
                  <div className="p-2 bg-purple-100 text-purple-700 rounded-lg"><Mail className="w-4 h-4" /></div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">E-mail</span>
                    <a href={`mailto:${competition.contactEmail}`} className="text-xs font-extrabold text-blue-600 hover:underline truncate block max-w-[200px]">
                      {competition.contactEmail || 'Neuvedeno'}
                    </a>
                  </div>
                </div>
              </div>

              {competition.halfDayDtos && competition.halfDayDtos.length > 0 && (
                <div className="space-y-2 pt-3">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Harmonogram / Půldny závodů</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {competition.halfDayDtos.map((hd: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">
                          {new Date(hd.date).toLocaleDateString('cs-CZ')} (Půlden {idx + 1})
                        </span>
                        <span className="text-slate-500 font-medium">
                          Kategorie: {hd.categoryDtos?.length || 0} disciplín
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Oficiální dokumenty ČSPS</h3>
              {documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {documents.map((doc, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100"><FileText className="w-4 h-4" /></div>
                        <div>
                          <span className="text-[10px] font-bold text-blue-600 uppercase block">{doc.type}</span>
                          <span className="text-xs font-extrabold text-slate-800">{doc.fileName}</span>
                        </div>
                      </div>
                      <a
                        href={`https://vysledky.czechswimming.cz/souteze/${competitionId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <span>Stáhnout</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Pro tento závod nejsou nahrány žádné doplňkové dokumenty.
                </div>
              )}
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Přihlášení plavci</h3>
              {applicationsData && applicationsData.halfDays ? (
                <div className="space-y-4">
                  {applicationsData.halfDays.map((hd: any, idx: number) => (
                    <div key={idx} className="space-y-2">
                      <h4 className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                        {new Date(hd.date).toLocaleDateString('cs-CZ')}
                      </h4>
                      <div className="space-y-1.5">
                        {hd.competitionCategories?.map((cat: any, cIdx: number) => (
                          <div key={cIdx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                            <span className="text-xs font-extrabold text-slate-800 block">
                              {cat.disciplineTitle} ({cat.gender === 'MALE' ? 'Muži' : 'Ženy'})
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {cat.applications?.map((app: any, aIdx: number) => (
                                <div key={aIdx} className="bg-white p-2 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                                  <div>
                                    <span className="font-bold text-slate-800">{app.firstName} {app.lastName}</span>
                                    <span className="text-[10px] text-slate-400 block">Klub: {app.clubAbbrev}</span>
                                  </div>
                                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                                    {app.birthYear}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Data přihlášek nejsou pro tento závod k dispozici nebo ještě nebyly zveřejněny.
                </div>
              )}
            </div>
          )}

          {activeTab === 'results' && (
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Výsledky závodu</h3>
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                <Trophy className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">Výsledky závodu lze detailně sledovat přímo na oficiálním portálu ČSPS.</p>
                <a
                  href={`https://vysledky.czechswimming.cz/souteze/${competitionId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  <span>Přejít na výsledky ČSPS</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}