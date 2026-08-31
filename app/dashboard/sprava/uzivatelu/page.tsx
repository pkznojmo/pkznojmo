'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function SpravaUzivateluPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtry, vyhledávání a řazení
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedTeam, setSelectedTeam] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortField, setSortField] = useState<'last_name' | 'birth_year' | 'created_at'>('last_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Stránkování
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Hromadný výběr
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Stavy modálních oken
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

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

  const loadData = async () => {
    setLoading(true);
    const [usersRes, teamsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, first_name, last_name, email, username, roles, birth_year, team_id, active, created_at, csps_id, teams!profiles_team_id_fkey(id, name)')
        .order(sortField, { ascending: sortDirection === 'asc' }),
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

    if (usersRes.data) setUsers(usersRes.data);
    if (teamsRes.data) setTeams(teamsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [sortField, sortDirection]);

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

  // Stránkovaná data
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;

  const handleSort = (field: 'last_name' | 'birth_year' | 'created_at') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
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
      const defaultPassword = 'Plaveme2026!';

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
    if (selectedUserIds.length === paginatedUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(paginatedUsers.map(u => u.id));
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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Horní záhlaví a akce */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Správa členů a uživatelů</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Kompletní administrace databáze plavců, trenérů a administrátorů klubu.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={exportToCSV}
            className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-700 rounded-md transition shadow-sm"
          >
            Export do CSV
          </button>
          <button 
            onClick={handleOpenCreate}
            className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition shadow-sm"
          >
            + Přidat člena
          </button>
          <Link 
            href="/dashboard/sprava" 
            className="px-3 py-1.5 text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md transition"
          >
            ← Zpět
          </Link>
        </div>
      </div>

      {/* Statistiky */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-zinc-200 shadow-sm">
          <div className="text-xs text-zinc-500 font-medium">Celkem členů</div>
          <div className="text-xl font-bold text-zinc-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-zinc-200 shadow-sm">
          <div className="text-xs text-zinc-500 font-medium">Aktivních</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{stats.active}</div>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-zinc-200 shadow-sm">
          <div className="text-xs text-zinc-500 font-medium">Plavců v evidenci</div>
          <div className="text-xl font-bold text-blue-600 mt-1">{stats.swimmers}</div>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-zinc-200 shadow-sm">
          <div className="text-xs text-zinc-500 font-medium">Trenérů</div>
          <div className="text-xl font-bold text-indigo-600 mt-1">{stats.trainers}</div>
        </div>
      </div>

      {/* Vyhledávání a filtry */}
      <div className="bg-white p-3.5 rounded-lg border border-zinc-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Hledat podle jména, username nebo e-mailu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-900"
          />
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-900"
          >
            <option value="ALL">Všechny role</option>
            {availableRoles.map((role) => (
              <option key={role} value={role}>Role: {role}</option>
            ))}
          </select>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-900"
          >
            <option value="ALL">Všechny týmy</option>
            {teams.map((team) => (
              <option key={team.id} value={String(team.id)}>Tým: {team.name}</option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-900"
          >
            <option value="ALL">Všechny stavy</option>
            <option value="active">Pouze aktivní</option>
            <option value="inactive">Pouze neaktivní</option>
          </select>
        </div>

        {/* Hromadné akce lišta */}
        {selectedUserIds.length > 0 && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 px-3 py-2 rounded-md">
            <span className="text-xs font-medium text-blue-800">
              Vybráno záznamů: {selectedUserIds.length}
            </span>
            <button
              onClick={handleBulkDelete}
              className="px-2.5 py-1 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded transition shadow-sm"
            >
              Smazat vybrané
            </button>
          </div>
        )}
      </div>

      {/* Tabulka */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-zinc-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase text-zinc-500 font-semibold">
                <th className="py-2.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={paginatedUsers.length > 0 && selectedUserIds.length === paginatedUsers.length}
                    onChange={toggleSelectAll}
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="py-2.5 px-3 cursor-pointer hover:text-zinc-900" onClick={() => handleSort('last_name')}>
                  Jméno {sortField === 'last_name' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th className="py-2.5 px-3">Username</th>
                <th className="py-2.5 px-3">E-mail</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Tým</th>
                <th className="py-2.5 px-3 cursor-pointer hover:text-zinc-900" onClick={() => handleSort('birth_year')}>
                  Ročník {sortField === 'birth_year' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th className="py-2.5 px-3">Stav</th>
                <th className="py-2.5 px-3 text-right">Akce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-xs">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-zinc-500">
                    Žádní uživatelé neodpovídají zadaným kritériím.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const isSelected = selectedUserIds.includes(user.id);
                  const isActive = user.active !== false;
                  return (
                    <tr key={user.id} className={`hover:bg-zinc-50/75 transition ${isSelected ? 'bg-blue-50/40' : ''}`}>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectUser(user.id)}
                          className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2 px-3 font-medium text-zinc-900">
                        {user.last_name} {user.first_name}
                      </td>
                      <td className="py-2 px-3 text-zinc-600 font-mono">
                        {user.username || '-'}
                      </td>
                      <td className="py-2 px-3 text-zinc-600">
                        {user.email || '-'}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex gap-1 flex-wrap">
                          {user.roles?.map((role: string) => (
                            <span key={role} className="px-1.5 py-0.5 text-[10px] font-medium bg-zinc-100 text-zinc-700 rounded border border-zinc-200">
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-zinc-600">
                        {user.teams?.name || '-'}
                      </td>
                      <td className="py-2 px-3 text-zinc-600">
                        {user.birth_year || '-'}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-zinc-100 text-zinc-600 border border-zinc-200'}`}>
                          {isActive ? 'Aktivní' : 'Neaktivní'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right space-x-1">
                        <button 
                          onClick={() => handleOpenEdit(user)}
                          className="px-2 py-1 font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded transition"
                        >
                          Upravit
                        </button>
                        <button 
                          onClick={() => {
                            setUserToDelete(user.id);
                            setIsDeleteConfirmOpen(true);
                          }}
                          className="px-2 py-1 font-medium bg-red-50 hover:bg-red-100 text-red-600 rounded transition"
                        >
                          Smazat
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Stránkování */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 border-t border-zinc-200 text-xs text-zinc-500">
          <div>
            Zobrazeno {paginatedUsers.length} z {filteredUsers.length} výsledků (celkem v databázi: {users.length})
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 bg-white border border-zinc-300 rounded text-zinc-700 disabled:opacity-40"
            >
              Předchozí
            </button>
            <span className="px-2 font-medium text-zinc-700">
              Strana {currentPage} z {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 bg-white border border-zinc-300 rounded text-zinc-700 disabled:opacity-40"
            >
              Další
            </button>
          </div>
        </div>
      </div>

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
                  className="w-full px-3 py-1.5 text-xs bg-zinc-100 border border-zinc-300 rounded-md text-zinc-500 font-mono cursor-not-allowed"
                />
              </div>

              {/* Automaticky generované pole: Email (read-only) */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">E-mail (generuje se automaticky)</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={calculatedEmail}
                  placeholder="prijmeni.jmeno.rocnik@internal.pkznojmo.cz"
                  className="w-full px-3 py-1.5 text-xs bg-zinc-100 border border-zinc-300 rounded-md text-zinc-500 font-mono cursor-not-allowed"
                />
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
                  ℹ️ Výchozí heslo pro přihlášení bude nastaveno na <code className="font-semibold">Plaveme2026!</code>.
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