'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { changeUserEmailAndSendReset, getAuthLastSignIns, sendUserPasswordReset } from '@/app/actions/adminUsers';
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Filter, Mail, Plus, Search, ShieldCheck, Users, UserRound, UserRoundCog, RefreshCw } from 'lucide-react';

type UserSortField = 'last_sign_in_at' | 'last_name' | 'email' | 'team' | 'birth_year' | 'created_at';

export default function SpravaUzivateluPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtry, vyhledávání a řazení
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedTeam, setSelectedTeam] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortField, setSortField] = useState<UserSortField>('last_sign_in_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Stránkování
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Hromadný výběr
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Stavy modálních oken
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [passwordResetUserId, setPasswordResetUserId] = useState<string | null>(null);

  // Formulářová data
  const [formData, setFormData] = useState({
    id: '',
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    birth_year: '',
    team_id: '',
    csps_id: '',
    roles: [] as string[],
    active: true,
  });

  const availableRolesList = [
    { id: 'admin', label: 'Administrátor' },
    { id: 'trainer', label: 'Trenér' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'parent', label: 'Rodič' },
    { id: 'swimmer', label: 'Plavec' },
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    const [usersRes, teamsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, first_name, last_name, email, username, roles, birth_year, team_id, active, created_at, csps_id, teams!profiles_team_id_fkey(id, name)')
        .order('last_name', { ascending: true }),
      supabase
        .from('teams')
        .select('id, name')
        .order('name', { ascending: true })
    ]);

    if (usersRes.error) {
      console.error('Chyba načítání profilů:', usersRes.error);
      alert('Chyba načítání profilů: ' + usersRes.error.message);
    }
    if (teamsRes.error) {
      console.error('Chyba načítání týmů:', teamsRes.error);
    }

    if (usersRes.data) {
      const authDetails = await getAuthLastSignIns(usersRes.data.map((user) => user.id));
      setUsers(usersRes.data.map((user) => ({
        ...user,
        last_sign_in_at: authDetails.success ? authDetails.times[user.id] ?? null : null,
        last_sign_in_loaded: authDetails.success,
      })));
    }
    if (teamsRes.data) setTeams(teamsRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Statistiky
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.active !== false).length;
    const swimmers = users.filter(u => u.roles?.includes('swimmer')).length;
    const trainers = users.filter(u => u.roles?.includes('trainer')).length;
    return { total, active, swimmers, trainers };
  }, [users]);

  // Dynamické role pro filtr
  const availableRoles = useMemo(() => {
    const rolesSet = new Set<string>();
    users.forEach((user) => {
      user.roles?.forEach((role: string) => rolesSet.add(role));
    });
    return Array.from(rolesSet);
  }, [users]);

  // Pomocná funkce pro normalizaci diakritiky
  const normalizeString = (str: string) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '');
  };

  // Automaticky vypočítané hodnoty pro username a email v reálném čase
  const calculatedUsername = useMemo(() => {
    const cleanLastName = normalizeString(formData.last_name);
    const cleanFirstName = normalizeString(formData.first_name);
    if (cleanLastName && cleanFirstName && formData.birth_year) {
      return `${cleanLastName}.${cleanFirstName}.${formData.birth_year}`;
    }
    return formData.username || '';
  }, [formData.last_name, formData.first_name, formData.birth_year, formData.username]);

  const calculatedEmail = useMemo(() => {
    return calculatedUsername ? `${calculatedUsername}@internal.pkznojmo.cz` : (formData.email || '');
  }, [calculatedUsername, formData.email]);

  // Filtrování a řazení
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
      const email = (user.email || '').toLowerCase();
      const username = (user.username || '').toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch = fullName.includes(query) || email.includes(query) || username.includes(query);
      const matchesRole = selectedRole === 'ALL' || (user.roles && user.roles.includes(selectedRole));
      const matchesTeam = selectedTeam === 'ALL' || String(user.team_id) === selectedTeam;
      const matchesStatus = selectedStatus === 'ALL' || (selectedStatus === 'active' ? user.active !== false : user.active === false);

      return matchesSearch && matchesRole && matchesTeam && matchesStatus;
    });
  }, [users, searchQuery, selectedRole, selectedTeam, selectedStatus]);

  const sortedUsers = useMemo(() => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    return [...filteredUsers].sort((a, b) => {
      let left: string | number | null;
      let right: string | number | null;
      if (sortField === 'last_sign_in_at') {
        left = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : null;
        right = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : null;
        if (left === null) return right === null ? 0 : 1;
        if (right === null) return -1;
      } else if (sortField === 'team') {
        left = a.teams?.name || '';
        right = b.teams?.name || '';
      } else {
        left = a[sortField] ?? '';
        right = b[sortField] ?? '';
      }
      if (typeof left === 'number' && typeof right === 'number') return (left - right) * direction;
      return String(left).localeCompare(String(right), 'cs', { numeric: true, sensitivity: 'base' }) * direction;
    });
  }, [filteredUsers, sortDirection, sortField]);

  // Stránkovaná data
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedUsers.slice(start, start + itemsPerPage);
  }, [sortedUsers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage) || 1;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedRole, selectedTeam, selectedStatus, sortField, sortDirection, itemsPerPage]);

  const toggleSortDirection = () => setSortDirection((previous) => previous === 'asc' ? 'desc' : 'asc');
  const handleSort = (field: UserSortField) => {
    if (sortField === field) toggleSortDirection();
    else {
      setSortField(field);
      setSortDirection(field === 'last_sign_in_at' || field === 'created_at' ? 'desc' : 'asc');
    }
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({
      id: '',
      first_name: '',
      last_name: '',
      email: '',
      username: '',
      birth_year: '',
      team_id: '',
      csps_id: '',
      roles: ['swimmer'],
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: any) => {
    setModalMode('edit');
    setFormData({
      id: user.id,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      username: user.username || '',
      birth_year: user.birth_year ? String(user.birth_year) : '',
      team_id: user.team_id ? String(user.team_id) : '',
      csps_id: user.csps_id ? String(user.csps_id) : '',
      roles: user.roles ? user.roles : ['swimmer'],
      active: user.active ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (modalMode === 'create') {
      const generatedUsername = calculatedUsername;
      const generatedEmail = calculatedEmail;
      const passwordBytes = crypto.getRandomValues(new Uint8Array(24));
      const defaultPassword = Array.from(passwordBytes, (value) => value.toString(16).padStart(2, '0')).join('');

      if (!generatedUsername) {
        alert('Vyplňte jméno, příjmení a ročník narození pro vygenerování přihlašovacích údajů.');
        return;
      }

      // 1. Uložíme si aktuální session administrátora před registrací nového uživatele
      const { data: currentSessionData } = await supabase.auth.getSession();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: generatedEmail,
        password: defaultPassword,
        options: {
          data: {
            first_name: formData.first_name,
            last_name: formData.last_name,
          }
        }
      });

      if (authError) {
        alert('Chyba při vytváření auth účtu: ' + authError.message);
        return;
      }

      // 2. Okamžitě obnovíme administrátorskou session, aby signUp nepřepsal přihlášení administrátora
      if (currentSessionData.session) {
        await supabase.auth.setSession({
          access_token: currentSessionData.session.access_token,
          refresh_token: currentSessionData.session.refresh_token,
        });
      }

      const newUserId = authData.user?.id;
      if (!newUserId) {
        alert('Nepodařilo se získat ID nového uživatele.');
        return;
      }

      const payload = {
        id: newUserId,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: generatedEmail,
        username: generatedUsername,
        birth_year: formData.birth_year ? parseInt(formData.birth_year) : null,
        team_id: formData.team_id ? parseInt(formData.team_id) : 99,
        csps_id: formData.csps_id ? parseInt(formData.csps_id) : null,
        roles: formData.roles.length > 0 ? formData.roles : ['swimmer'],
        active: formData.active,
        updated_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(payload);

      if (profileError) {
        alert('Chyba při zápisu profilu: ' + profileError.message);
        return;
      }

    } else {
      const originalUser = users.find((user) => user.id === formData.id);
      const newEmail = formData.email.trim().toLowerCase();
      if (newEmail !== (originalUser?.email || '').trim().toLowerCase()) {
        const emailResult = await changeUserEmailAndSendReset(formData.id, newEmail);
        if (!emailResult.success) {
          alert(emailResult.message);
          return;
        }
        alert(emailResult.message);
      }

      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        birth_year: formData.birth_year ? parseInt(formData.birth_year) : null,
        team_id: formData.team_id ? parseInt(formData.team_id) : 99,
        csps_id: formData.csps_id ? parseInt(formData.csps_id) : null,
        roles: formData.roles.length > 0 ? formData.roles : ['swimmer'],
        active: formData.active,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', formData.id);

      if (error) {
        alert('Chyba při úpravě: ' + error.message);
        return;
      }
    }

    setIsModalOpen(false);
    loadData();
  };

  const handleSendPasswordReset = async (user: any) => {
    setPasswordResetUserId(user.id);
    try {
      const result = await sendUserPasswordReset(user.id);
      alert(result.message);
    } catch {
      alert('E-mail s odkazem se nepodařilo odeslat.');
    } finally {
      setPasswordResetUserId(null);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) {
      alert('Chyba při mazání: ' + error.message);
    } else {
      setSelectedUserIds(prev => prev.filter(item => item !== id));
      loadData();
    }
    setIsDeleteConfirmOpen(false);
    setUserToDelete(null);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Opravdu chcete smazat ${selectedUserIds.length} vybraných členů?`)) return;
    const { error } = await supabase.from('profiles').delete().in('id', selectedUserIds);
    if (error) {
      alert('Chyba při hromadném mazání: ' + error.message);
    } else {
      setSelectedUserIds([]);
      loadData();
    }
  };

  const exportToCSV = () => {
    const headers = ['Jmeno', 'Prijmeni', 'Username', 'Email', 'Rocnik', 'Tim', 'Role', 'Aktivni'];
    const rows = filteredUsers.map(u => [
      u.first_name,
      u.last_name,
      u.username || '',
      u.email || '',
      u.birth_year || '',
      u.teams?.name || '',
      (u.roles || []).join(';'),
      u.active !== false ? 'Ano' : 'Ne'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `klub_uzivatele_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSelectAll = () => {
    const visibleIds = paginatedUsers.map((user) => user.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedUserIds.includes(id));
    if (allVisibleSelected) {
      setSelectedUserIds((previous) => previous.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedUserIds((previous) => Array.from(new Set([...previous, ...visibleIds])));
    }
  };

  const toggleSelectUser = (id: string) => {
    setSelectedUserIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleRoleCheckboxChange = (roleId: string) => {
    setFormData(prev => {
      const exists = prev.roles.includes(roleId);
      const updatedRoles = exists 
        ? prev.roles.filter(r => r !== roleId)
        : [...prev.roles, roleId];
      return { ...prev, roles: updatedRoles };
    });
  };

  if (loading) return <div className="p-12 text-center text-sm text-zinc-500 font-medium">Načítání komplexního modulu správy...</div>;

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 px-5 py-6 text-white shadow-xl shadow-blue-950/10 sm:px-8 sm:py-8">
        <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100"><ShieldCheck size={14} /> Administrace klubu</div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Uživatelé a členové</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/80">Přehled účtů, přístupů a poslední aktivity na jednom místě.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button onClick={exportToCSV} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/20"><Download size={16} /> Export CSV</button>
            <button onClick={handleOpenCreate} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-blue-950 shadow-sm transition hover:bg-blue-50"><Plus size={17} /> Přidat člena</button>
            <Link href="/dashboard/sprava" className="col-span-2 inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-medium text-blue-100 transition hover:bg-white/10 sm:col-span-1">← Zpět do správy</Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: 'Všichni uživatelé', value: stats.total, icon: Users, tone: 'text-blue-700 bg-blue-50' },
          { label: 'Aktivní účty', value: stats.active, icon: UserRound, tone: 'text-emerald-700 bg-emerald-50' },
          { label: 'Plavci', value: stats.swimmers, icon: UserRoundCog, tone: 'text-violet-700 bg-violet-50' },
          { label: 'Trenéři', value: stats.trainers, icon: ShieldCheck, tone: 'text-amber-700 bg-amber-50' },
        ].map((stat) => {
          const Icon = stat.icon;
          return <div key={stat.label} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5"><div className="flex items-center justify-between gap-2"><span className="text-xs font-medium text-slate-500 sm:text-sm">{stat.label}</span><span className={`grid h-9 w-9 place-items-center rounded-xl ${stat.tone}`}><Icon size={17} /></span></div><div className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{stat.value}</div></div>;
        })}
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900"><Filter size={16} className="text-blue-700" /> Vyhledávání a filtry</div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-12">
          <label className="relative col-span-2 lg:col-span-4"><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" placeholder="Jméno, e-mail nebo uživatelské jméno" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" /></label>
          <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="h-11 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 lg:col-span-2"><option value="ALL">Všechny role</option>{availableRoles.map((role) => <option key={role} value={role}>Role: {role}</option>)}</select>
          <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} className="h-11 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 lg:col-span-2"><option value="ALL">Všechny týmy</option>{teams.map((team) => <option key={team.id} value={String(team.id)}>{team.name}</option>)}</select>
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="h-11 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 lg:col-span-2"><option value="ALL">Všechny stavy</option><option value="active">Pouze aktivní</option><option value="inactive">Pouze neaktivní</option></select>
          <div className="col-span-2 flex gap-2 lg:col-span-2"><select aria-label="Řadit uživatele podle" value={sortField} onChange={(e) => setSortField(e.target.value as UserSortField)} className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"><option value="last_sign_in_at">Posledního přihlášení</option><option value="email">E-mailu</option><option value="last_name">Jména</option><option value="team">Týmu</option><option value="birth_year">Ročníku</option><option value="created_at">Data vytvoření</option></select><button type="button" onClick={toggleSortDirection} aria-label={sortDirection === 'asc' ? 'Řadit sestupně' : 'Řadit vzestupně'} title={sortDirection === 'asc' ? 'Vzestupně' : 'Sestupně'} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 hover:text-blue-700">{sortDirection === 'asc' ? <ArrowUp size={17} /> : <ArrowDown size={17} />}</button></div>
        </div>
        {selectedUserIds.length > 0 && <div className="mt-4 flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 sm:flex-row sm:items-center sm:justify-between"><span className="text-sm font-medium text-blue-900">Vybráno {selectedUserIds.length} uživatelů</span><button onClick={handleBulkDelete} className="min-h-10 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700">Smazat vybrané</button></div>}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><h2 className="font-semibold text-slate-950">Seznam uživatelů</h2><p className="mt-0.5 text-xs text-slate-500">{sortedUsers.length} odpovídajících záznamů · celkem {users.length} účtů</p></div><button onClick={loadData} className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 sm:self-auto"><RefreshCw size={15} /> Obnovit</button></div>
        <div className="hidden overflow-x-auto lg:block"><table className="w-full min-w-[1120px] text-left text-sm"><thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="w-12 px-4 py-3 text-center"><input type="checkbox" checked={paginatedUsers.length > 0 && paginatedUsers.every((user) => selectedUserIds.includes(user.id))} onChange={toggleSelectAll} aria-label="Vybrat všechny zobrazené" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" /></th><th onClick={() => handleSort('last_name')} className="cursor-pointer px-4 py-3 hover:text-blue-700">Člen <ArrowUpDown size={13} className="ml-1 inline" /></th><th className="px-4 py-3">Přihlašovací jméno</th><th onClick={() => handleSort('email')} className="cursor-pointer px-4 py-3 hover:text-blue-700">E-mail <ArrowUpDown size={13} className="ml-1 inline" /></th><th onClick={() => handleSort('last_sign_in_at')} className="cursor-pointer px-4 py-3 hover:text-blue-700">Poslední přihlášení <ArrowUpDown size={13} className="ml-1 inline" /></th><th className="px-4 py-3">Role / tým</th><th onClick={() => handleSort('birth_year')} className="cursor-pointer px-4 py-3 hover:text-blue-700">Ročník <ArrowUpDown size={13} className="ml-1 inline" /></th><th className="px-4 py-3">Stav</th><th className="px-4 py-3 text-right">Akce</th></tr></thead><tbody className="divide-y divide-slate-100">{paginatedUsers.length === 0 ? <tr><td colSpan={9} className="px-4 py-14 text-center text-sm text-slate-500">Žádní uživatelé neodpovídají zadaným kritériím.</td></tr> : paginatedUsers.map((user) => {const active = user.active !== false; return <tr key={user.id} className={`transition hover:bg-slate-50/80 ${selectedUserIds.includes(user.id) ? 'bg-blue-50/50' : ''}`}><td className="px-4 py-3 text-center"><input type="checkbox" checked={selectedUserIds.includes(user.id)} onChange={() => toggleSelectUser(user.id)} aria-label={`Vybrat ${user.first_name} ${user.last_name}`} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" /></td><td className="px-4 py-3"><div className="font-semibold text-slate-900">{user.first_name} {user.last_name}</div><div className="mt-0.5 text-xs text-slate-400">Člen klubu</div></td><td className="px-4 py-3 font-mono text-xs text-slate-500">{user.username || '—'}</td><td className="px-4 py-3 text-slate-600">{user.email || '—'}</td><td className="whitespace-nowrap px-4 py-3 text-slate-600">{user.last_sign_in_at ? new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(user.last_sign_in_at)) : user.last_sign_in_loaded === false ? 'Nelze načíst' : 'Nikdy'}</td><td className="px-4 py-3"><div className="flex max-w-48 flex-wrap gap-1">{user.roles?.map((role: string) => <span key={role} className="rounded-md bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-800">{role}</span>)}</div><div className="mt-1.5 text-xs text-slate-500">{user.teams?.name || 'Bez týmu'}</div></td><td className="px-4 py-3 text-slate-600">{user.birth_year || '—'}</td><td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}><span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />{active ? 'Aktivní' : 'Neaktivní'}</span></td><td className="px-4 py-3 text-right"><div className="inline-flex items-center gap-1"><button onClick={() => handleOpenEdit(user)} className="rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">Upravit</button><button onClick={() => handleSendPasswordReset(user)} disabled={passwordResetUserId === user.id} title="Poslat odkaz pro změnu hesla" className="grid h-9 w-9 place-items-center rounded-lg text-blue-700 hover:bg-blue-50 disabled:opacity-50"><Mail size={16} /></button><button onClick={() => {setUserToDelete(user.id);setIsDeleteConfirmOpen(true);}} aria-label="Smazat uživatele" className="rounded-lg px-2 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">Smazat</button></div></td></tr>;})}</tbody></table></div>
        <div className="grid gap-3 p-3 lg:hidden">
          {paginatedUsers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-12 text-center text-sm text-slate-500">Žádní uživatelé neodpovídají zadaným kritériím.</div>
          ) : paginatedUsers.map((user) => (
            <article key={user.id} className={`rounded-2xl border p-4 ${selectedUserIds.includes(user.id) ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={selectedUserIds.includes(user.id)} onChange={() => toggleSelectUser(user.id)} aria-label={`Vybrat ${user.first_name} ${user.last_name}`} className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0"><h3 className="break-words font-semibold text-slate-950">{user.first_name} {user.last_name}</h3><p className="mt-0.5 break-all text-xs text-slate-500">{user.email || 'Bez e-mailu'}</p></div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${user.active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{user.active !== false ? 'Aktivní' : 'Neaktivní'}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                    <div><span className="text-slate-400">Přihlašovací jméno</span><div className="mt-0.5 break-all font-mono text-slate-700">{user.username || '—'}</div></div>
                    <div><span className="text-slate-400">Poslední přihlášení</span><div className="mt-0.5 text-slate-700">{user.last_sign_in_at ? new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(user.last_sign_in_at)) : user.last_sign_in_loaded === false ? 'Nelze načíst' : 'Nikdy'}</div></div>
                    <div><span className="text-slate-400">Tým · ročník</span><div className="mt-0.5 text-slate-700">{user.teams?.name || 'Bez týmu'}{user.birth_year ? ` · ${user.birth_year}` : ''}</div></div>
                    <div><span className="text-slate-400">Role</span><div className="mt-1 flex flex-wrap gap-1">{user.roles?.length ? user.roles.map((role: string) => <span key={role} className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-800">{role}</span>) : <span className="text-slate-500">—</span>}</div></div>
                  </div>
                  <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                    <button onClick={() => handleOpenEdit(user)} className="min-h-10 flex-1 rounded-lg bg-slate-100 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-200">Upravit</button>
                    <button onClick={() => handleSendPasswordReset(user)} disabled={passwordResetUserId === user.id} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-blue-50 px-3 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"><Mail size={15} />{passwordResetUserId === user.id ? 'Odesílám…' : 'Reset hesla'}</button>
                    <button onClick={() => {setUserToDelete(user.id);setIsDeleteConfirmOpen(true);}} aria-label="Smazat uživatele" className="min-h-10 rounded-lg px-3 text-sm font-semibold text-red-600 hover:bg-red-50">Smazat</button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500"><span>{sortedUsers.length ? `${(currentPage - 1) * itemsPerPage + 1}–${Math.min(currentPage * itemsPerPage, sortedUsers.length)}` : '0'} z {sortedUsers.length} uživatelů</span><label className="flex items-center gap-2">Zobrazit<select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium text-slate-700"><option value={15}>15</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option><option value={200}>200</option></select></label><span>na stránku</span></div><div className="flex items-center justify-between gap-3 sm:justify-end"><span className="text-xs font-medium text-slate-600">Strana {currentPage} z {totalPages}</span><div className="flex gap-2"><button onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage <= 1} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-40">Předchozí</button><button onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage >= totalPages} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-40">Další</button></div></div></div>
      </section>

      {/* Modální okno pro vytvoření / úpravu člena */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-zinc-200 w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 bg-zinc-50 border-b border-zinc-200">
              <h2 className="text-sm font-bold text-zinc-900">
                {modalMode === 'create' ? 'Přidat nového člena' : 'Upravit člena'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Jméno *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Příjmení *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Ročník narození *</label>
                  <input
                    type="number"
                    required
                    value={formData.birth_year}
                    onChange={(e) => setFormData({ ...formData, birth_year: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">ČSPS ID</label>
                  <input
                    type="number"
                    value={formData.csps_id}
                    onChange={(e) => setFormData({ ...formData, csps_id: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Tým</label>
                <select
                  value={formData.team_id}
                  onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-900"
                >
                  <option value="">Bez týmu</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>

              {/* Automaticky generované pole: Username (read-only) */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Username (generuje se automaticky)</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={calculatedUsername}
                  placeholder="prijmeni.jmeno.rocnik"
                  className={`w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-md font-mono ${modalMode === 'create' ? 'bg-zinc-100 text-zinc-500 cursor-not-allowed' : 'bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500'}`}
                />
              </div>

              {/* Účet v Auth se po změně e-mailu synchronizuje a přijde resetovací odkaz. */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  {modalMode === 'create' ? 'Přihlašovací e-mail (generuje se automaticky)' : 'Přihlašovací e-mail'}
                </label>
                <input
                  type="email"
                  required
                  readOnly={modalMode === 'create'}
                  disabled={modalMode === 'create'}
                  value={modalMode === 'create' ? calculatedEmail : formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="prijmeni.jmeno.rocnik@internal.pkznojmo.cz"
                  className="w-full px-3 py-1.5 text-xs bg-zinc-100 border border-zinc-300 rounded-md text-zinc-500 font-mono cursor-not-allowed"
                />
                {modalMode === 'edit' && (
                  <p className="mt-1 text-[11px] text-zinc-500">Po změně odešleme na novou adresu odkaz pro nastavení hesla.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Role uživatele</label>
                <div className="grid grid-cols-3 gap-2 bg-zinc-50 p-2.5 rounded-md border border-zinc-200">
                  {availableRolesList.map((r) => (
                    <label key={r.id} className="flex items-center gap-1.5 text-xs text-zinc-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.roles.includes(r.id)}
                        onChange={() => handleRoleCheckboxChange(r.id)}
                        className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                      />
                      {r.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="active_status"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="active_status" className="text-xs font-medium text-zinc-700 cursor-pointer">
                  Aktivní člen klubu
                </label>
              </div>

              {modalMode === 'create' && (
                <p className="text-[11px] text-zinc-500 bg-blue-50/50 p-2 rounded border border-blue-100">
                  ℹ️ Po vytvoření účtu lze uživateli odeslat odkaz pro nastavení hesla tlačítkem „Poslat reset hesla“.
                </p>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md transition"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition shadow-sm"
                >
                  Uložit záznam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modální okno pro potvrzení smazání */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-zinc-200 w-full max-w-sm p-4 space-y-3">
            <h3 className="text-sm font-bold text-zinc-900">Potvrzení smazání</h3>
            <p className="text-xs text-zinc-600">Opravdu chcete tohoto člena trvale odstranit z databáze? Tuto akci nelze vrátit zpět.</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setUserToDelete(null);
                }}
                className="px-3 py-1.5 text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md transition"
              >
                Zrušit
              </button>
              <button
                onClick={() => userToDelete && handleDelete(userToDelete)}
                className="px-3 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded-md transition shadow-sm"
              >
                Smazat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
