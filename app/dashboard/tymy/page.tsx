'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  Loader2, 
  Power,
  ShieldCheck,
  ShieldAlert,
  X,
  AlertCircle
} from 'lucide-react';

interface Team {
  id: number;
  name: string;
  active: boolean;
  membersCount: number;
  trainers?: { id: string; first_name: string; last_name: string }[];
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  roles: string[];
}

export default function TymyPage() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTrainer, setIsTrainer] = useState(false);

  const [teams, setTeams] = useState<Team[]>([]);
  const [allTrainers, setAllTrainers] = useState<Profile[]>([]);

  // Modal pro nový/upravený tým
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({ name: '', active: true, selectedTrainerIds: [] as string[] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    initPage();
  }, []);

  const initPage = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, roles')
      .eq('id', user.id)
      .single();

    if (!profile) {
      setLoading(false);
      return;
    }

    setCurrentUser(profile);
    const hasAdmin = profile.roles?.includes('admin') || false;
    const hasTrainer = profile.roles?.includes('trainer') || false;

    setIsAdmin(hasAdmin);
    setIsTrainer(hasTrainer);

    if (hasAdmin || hasTrainer) {
      await loadData(user.id, hasAdmin);
    }

    setLoading(false);
  };

  const loadData = async (userId: string, adminRole: boolean) => {
    if (adminRole) {
      const { data: trainersData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, roles')
        .contains('roles', ['trainer']);

      setAllTrainers(trainersData || []);
    }

    let teamsQuery = supabase.from('teams').select(`
      id,
      name,
      active,
      team_trainers (
        trainer_id,
        profiles:trainer_id (id, first_name, last_name)
      )
    `);

    if (!adminRole) {
      const { data: trainerTeams } = await supabase
        .from('team_trainers')
        .select('team_id')
        .eq('trainer_id', userId);

      const teamIds = (trainerTeams || []).map(tt => tt.team_id);
      teamsQuery = teamsQuery.in('id', teamIds.length > 0 ? teamIds : [-1]);
    }

    const { data: teamsData, error } = await teamsQuery.order('id', { ascending: true });

    if (error) {
      console.error('Chyba při načítání týmů:', error.message);
      setLoading(false);
      return;
    }

    const { data: profileCounts, error: countError } = await supabase
      .from('profiles')
      .select('team_id');

    const memberCountsMap: Record<number, number> = {};
    if (!countError && profileCounts) {
      profileCounts.forEach((p: { team_id: number | null }) => {
        if (p.team_id !== null) {
          memberCountsMap[p.team_id] = (memberCountsMap[p.team_id] || 0) + 1;
        }
      });
    }

    const formattedTeams: Team[] = (teamsData || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      active: t.active,
      membersCount: memberCountsMap[t.id] || 0,
      trainers: t.team_trainers?.map((tt: any) => tt.profiles).filter(Boolean) || []
    }));

    setTeams(formattedTeams);
  };

  const handleOpenCreateModal = () => {
    setEditingTeam(null);
    setFormData({ name: '', active: true, selectedTrainerIds: [] });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      active: team.active,
      selectedTrainerIds: team.trainers?.map(t => t.id) || []
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    let teamId = editingTeam?.id;

    if (editingTeam) {
      const { error } = await supabase
        .from('teams')
        .update({ name: formData.name.trim(), active: formData.active })
        .eq('id', editingTeam.id);

      if (error) {
        alert('Chyba při úpravě týmu: ' + error.message);
        setSaving(false);
        return;
      }
    } else {
      const { data: newTeam, error } = await supabase
        .from('teams')
        .insert([{ name: formData.name.trim(), active: formData.active }])
        .select()
        .single();

      if (error || !newTeam) {
        alert('Chyba při vytváření týmu: ' + error?.message);
        setSaving(false);
        return;
      }
      teamId = newTeam.id;
    }

    if (isAdmin && teamId) {
      await supabase.from('team_trainers').delete().eq('team_id', teamId);

      if (formData.selectedTrainerIds.length > 0) {
        const inserts = formData.selectedTrainerIds.map(trainerId => ({
          team_id: teamId,
          trainer_id: trainerId
        }));
        await supabase.from('team_trainers').insert(inserts);
      }
    }

    setSaving(false);
    setIsModalOpen(false);
    if (currentUser) loadData(currentUser.id, isAdmin);
  };

  const handleToggleActive = async (team: Team) => {
    if (!isAdmin) return;
    const { error } = await supabase
      .from('teams')
      .update({ active: !team.active })
      .eq('id', team.id);

    if (error) {
      alert('Chyba při změně stavu: ' + error.message);
    } else {
      setTeams(teams.map(t => t.id === team.id ? { ...t, active: !t.active } : t));
    }
  };

  const handleDelete = async (id: number) => {
    if (!isAdmin) return;
    if (!confirm('Opravdu chceš tento tým smazat?')) return;

    const { error } = await supabase.from('teams').delete().eq('id', id);

    if (error) {
      alert('Chyba při mazání týmu: ' + error.message);
    } else {
      setTeams(teams.filter(t => t.id !== id));
    }
  };

  const toggleTrainerSelection = (trainerId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTrainerIds: prev.selectedTrainerIds.includes(trainerId)
        ? prev.selectedTrainerIds.filter(id => id !== trainerId)
        : [...prev.selectedTrainerIds, trainerId]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 gap-2 p-4">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="text-sm font-medium">Načítám týmy...</span>
      </div>
    );
  }

  if (!isAdmin && !isTrainer) {
    return (
      <div className="p-6 max-w-md mx-auto mt-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
        <h2 className="text-lg font-bold text-rose-900">Přístup odepřen</h2>
        <p className="text-xs text-rose-700">
          Tato stránka je přístupná pouze pro **Trenéry** a **Administrátory**[cite: 12].
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-5 pb-24 md:pb-8">
      {/* Hlavička */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Users className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 shrink-0" />
            {isAdmin ? 'Správa týmů' : 'Moje tréninkové týmy'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isAdmin 
              ? 'Kompletní přehled týmů a přiřazení trenérů.' 
              : 'Seznam týmů, které trénuješ.'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all active:scale-95 shrink-0 min-h-[48px]"
          >
            <Plus className="w-5 h-5" />
            Přidat nový tým
          </button>
        )}
      </div>

      {/* Přehledové karty (pro admina detailní, pro trenéra pouze Moje týmy a číslo) */}
      {isAdmin ? (
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-slate-900">{teams.length}</div>
              <div className="text-[11px] sm:text-xs text-slate-500 font-medium">Všechny</div>
            </div>
          </div>

          <div className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-slate-900">{teams.filter(t => t.active).length}</div>
              <div className="text-[11px] sm:text-xs text-slate-500 font-medium">Aktivní</div>
            </div>
          </div>

          <div className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-slate-100 text-slate-500 rounded-xl shrink-0">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-slate-900">{teams.filter(t => !t.active).length}</div>
              <div className="text-[11px] sm:text-xs text-slate-500 font-medium">Neaktivní</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5 max-w-xs">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{teams.length}</div>
            <div className="text-xs text-slate-500 font-medium">Moje týmy</div>
          </div>
        </div>
      )}

      {/* SEZNAM TÝMŮ - ČTVEREČKY */}
      <div className="space-y-3">
        {teams.length === 0 ? (
          <div className="p-8 sm:p-12 text-center bg-white border border-slate-200/80 rounded-2xl shadow-sm">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">Žádné týmy nenalezeny</h3>
            <p className="text-xs text-slate-400 mt-1">
              {isAdmin ? 'Začni vytvořením prvního týmu[cite: 12].' : 'Zatím nemáš přiřazeny žádné týmy.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <Link
                key={team.id}
                href={`/dashboard/tymy/${team.id}`}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                      #{team.id}
                    </span>
                    {isAdmin && (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        team.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${team.active ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        {team.active ? 'Aktivní' : 'Neaktivní'}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                      {team.name}
                    </h3>
                  </div>

                  <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Počet členů:</span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold bg-slate-100 text-slate-700">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        {team.membersCount}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-slate-400 font-medium">Trenéři:</span>
                      <div className="flex flex-wrap gap-1">
                        {team.trainers && team.trainers.length > 0 ? (
                          team.trainers.map((tr) => (
                            <span 
                              key={tr.id} 
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/50"
                            >
                              {tr.first_name} {tr.last_name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">Bez trenéra</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleToggleActive(team);
                      }}
                      title={team.active ? 'Vypnout' : 'Zapnout'}
                      className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleOpenEditModal(team);
                      }}
                      title="Upravit"
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(team.id);
                      }}
                      title="Smazat"
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl max-w-lg w-full border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-base text-slate-900">
                {editingTeam ? 'Upravit tým' : 'Přidat nový tým'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Název týmu *
                </label>
                <input
                  type="text"
                  required
                  placeholder="např. Družstvo A, Přípravka 1..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Přiřazení trenéři
                </label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50">
                  {allTrainers.length === 0 ? (
                    <div className="text-xs text-slate-400 p-3 text-center">
                      Nenalezeni žádní uživatelé s rolí `trainer`
                    </div>
                  ) : (
                    allTrainers.map((tr) => {
                      const isSelected = formData.selectedTrainerIds.includes(tr.id);
                      return (
                        <div
                          key={tr.id}
                          onClick={() => toggleTrainerSelection(tr.id)}
                          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer text-xs font-medium transition-all min-h-[44px] ${
                            isSelected 
                              ? 'bg-blue-600 text-white font-semibold shadow-xs' 
                              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/60'
                          }`}
                        >
                          <span>{tr.first_name} {tr.last_name}</span>
                          {isSelected && <ShieldCheck className="w-4 h-4 text-white" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <div className="text-xs font-bold text-slate-900">Aktivní stav</div>
                  <div className="text-[11px] text-slate-500">Zda se tým zobrazuje v nabídkách</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-6 h-6 sm:w-5 sm:h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 pb-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors min-h-[44px]"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all disabled:opacity-50 min-h-[44px]"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingTeam ? 'Uložit změny' : 'Vytvořit tým'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}