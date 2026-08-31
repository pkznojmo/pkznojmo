'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { 
  User, 
  Mail, 
  ShieldAlert, 
  LogOut, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Users,
  KeyRound,
  UserCheck,
  UserPlus,
  ArrowRight,
  RefreshCw,
  Lock,
  UserMinus,
  X
} from 'lucide-react';

interface SwimmerChild {
  id: string;
  full_name: string;
  username: string;
  birth_year: number | null;
  email: string | null;
  hasRealEmail: boolean;
}

interface ParentInfo {
  id: string;
  email: string;
  full_name?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Status rolí uživatele
  const [roles, setRoles] = useState<string[]>([]);
  const [isParent, setIsParent] = useState(false);

  // Data načtená z databáze
  const [children, setChildren] = useState<SwimmerChild[]>([]);
  const [parents, setParents] = useState<ParentInfo[]>([]);

  // Dynamický stav formuláře pro rodiče (připojení rodiče k plavci)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [parentFirstName, setParentFirstName] = useState('');
  const [parentLastName, setParentLastName] = useState('');
  const [selectedSwimmerId, setSelectedSwimmerId] = useState<string | null>(null);

  // Stav pro modal okno spravování údajů dítěte rodičem
  const [childModalOpen, setChildModalOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<SwimmerChild | null>(null);
  const [childEmail, setChildEmail] = useState('');
  const [childPassword, setChildPassword] = useState('');
  const [childFormLoading, setChildFormLoading] = useState(false);
  const [childFormError, setChildFormError] = useState<string | null>(null);
  const [childFormSuccess, setChildFormSuccess] = useState<string | null>(null);

  // Stav pro odebrání dítěte rodičem
  const [removingChildId, setRemovingChildId] = useState<string | null>(null);

  // Stav formuláře pro vlastní e-mail plavce
  const [selfEmail, setSelfEmail] = useState('');
  const [selfPassword, setSelfPassword] = useState('');
  const [selfFormLoading, setSelfFormLoading] = useState(false);
  const [selfFormError, setSelfFormError] = useState<string | null>(null);
  const [selfFormSuccess, setSelfFormSuccess] = useState<string | null>(null);

  // Stav verifikace e-mailu rodiče
  const [emailChecked, setEmailChecked] = useState(false);
  const [accountExists, setAccountExists] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Pomocná funkce pro kontrolu, zda jde o reálný e-mail
  const isRealEmail = (emailStr: string | null | undefined) => {
    if (!emailStr) return false;
    return !emailStr.endsWith('@internal.pkznojmo.cz');
  };

  // Načtení profilu a vazeb
  const loadUserData = useCallback(async (authUser: SupabaseUser) => {
    // 1. Načtení pole 'roles' z tabulky public.profiles
    const { data: profileData } = await supabase
      .from('profiles')
      .select('roles')
      .eq('id', authUser.id)
      .single();

    const userRoles: string[] = profileData?.roles || ['swimmer'];
    setRoles(userRoles);

    // Test, zda uživatel vystupuje jako rodič
    const isParentRole = userRoles.includes('parent') || authUser.user_metadata?.is_parent || false;
    setIsParent(isParentRole);

    if (isParentRole) {
      // REŽIM RODIČ: načítáme jeho děti
      const { data: linkData, error } = await supabase
        .from('parent_swimmers')
        .select(`
          swimmer_id,
          swimmers:swimmer_id (
            id,
            first_name,
            last_name,
            email,
            username,
            birth_year
          )
        `)
        .eq('parent_id', authUser.id);

      if (error) {
        console.error('Chyba načítání dětí:', error.message || error);
      }

      if (linkData) {
        const fetchedChildren = linkData
          .map((item: any) => item.swimmers)
          .filter(Boolean)
          .map((swimmer: any) => {
            const hasReal = isRealEmail(swimmer.email);
            return {
              ...swimmer,
              full_name: `${swimmer.first_name || ''} ${swimmer.last_name || ''}`.trim(),
              hasRealEmail: hasReal,
              email: hasReal ? swimmer.email : null
            };
          }) as SwimmerChild[];

        setChildren(fetchedChildren);
      }
    }

    // Předvyplnění vlastního e-mailu (pokud není reálný, necháme prázdné nebo upravitelné)
    if (authUser.email && isRealEmail(authUser.email)) {
      setSelfEmail(authUser.email);
    }

    // Načtení rodičů (pokud je plavec)
    const { data: linkData, error } = await supabase
      .from('parent_swimmers')
      .select(`
        parent_id,
        parents:parent_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('swimmer_id', authUser.id);

    if (error) {
      console.error('Chyba načítání rodičů:', error.message || error);
    }

    if (linkData) {
      const fetchedParents = linkData
        .map((item: any) => {
          const p = item.parents;
          if (!p) return null;
          
          const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim();
          return {
            id: p.id,
            email: p.email || 'E-mail nedostupný',
            full_name: fullName || 'Rodič bez jména',
          };
        })
        .filter(Boolean) as ParentInfo[];

      setParents(fetchedParents);
    }
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        router.push('/prihlaseni');
      } else {
        setUser(authUser);
        await loadUserData(authUser);
      }
      setLoading(false);
    };

    checkUser();
  }, [router, loadUserData]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  // KROK 1: Kontrola existence e-mailu na backendu (pro rodiče)
  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (user?.email && email.toLowerCase() === user.email.toLowerCase()) {
      setFormError('Nemůžete zadat svůj vlastní e-mail. Nemůžete být sám sobě rodičem / dítětem.');
      return;
    }

    setCheckingEmail(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const res = await fetch('/api/family/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Nepodařilo se ověřit e-mail.');

      setAccountExists(data.exists);
      setEmailChecked(true);
    } catch (err: any) {
      setFormError(err.message || 'Chyba při kontrole e-mailu.');
    } finally {
      setCheckingEmail(false);
    }
  };

  const resetEmailCheck = () => {
    setEmailChecked(false);
    setAccountExists(null);
    setPassword('');
    setParentFirstName('');
    setParentLastName('');
    setFormError(null);
    setFormSuccess(null);
  };

  // KROK 2: Dokončení akce správy rodičů plavcem
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (user?.email && email.toLowerCase() === user.email.toLowerCase()) {
      setFormError('Nemůžete použít svůj vlastní e-mail.');
      return;
    }

    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      if (!user) return;

      const payload: any = { 
        currentUserId: user.id,
        email,
        password,
        action: accountExists ? 'link_existing_parent' : 'create_parent',
        targetSwimmerId: user.id
      };

      if (!accountExists) {
        payload.firstName = parentFirstName;
        payload.lastName = parentLastName;
      }

      const res = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Operace se nezdařila.');

      setFormSuccess(data.message || 'Úspěšně uloženo!');
      setEmail('');
      setPassword('');
      resetEmailCheck();
      
      await loadUserData(user);
    } catch (err: any) {
      setFormError(err.message || 'Nepodařilo se zpracovat požadavek.');
    } finally {
      setFormLoading(false);
    }
  };

  // AKCE: Rodič nastavit/mění e-mail a heslo dítěte v modalu
  const handleSwimmerCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild || !user) return;

    setChildFormLoading(true);
    setChildFormError(null);
    setChildFormSuccess(null);

    try {
      const res = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_swimmer_credentials',
          currentUserId: user.id,
          targetSwimmerId: selectedChild.id,
          email: childEmail,
          password: childPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Nastavení přihlašovacích údajů dítěte selhalo.');

      setChildFormSuccess(data.message || 'Přihlašovací údaje byly úspěšně uloženy.');
      setTimeout(() => {
        setChildModalOpen(false);
        setChildFormSuccess(null);
      }, 1500);

      await loadUserData(user);
    } catch (err: any) {
      setChildFormError(err.message || 'Chyba při ukládání údajů.');
    } finally {
      setChildFormLoading(false);
    }
  };

  // AKCE: Rodič odebírá dítě
  const handleRemoveChild = async (child: SwimmerChild) => {
    if (!user) return;

    if (!child.hasRealEmail) {
      alert('Nelze odebrat dítě, které nemá zřízený vlastní e-mail a heslo. Dítě by ztratilo možnost se přihlásit.');
      return;
    }

    if (!confirm(`Opravdu chcete odebrat dítě ${child.full_name} ze svého profilu?`)) {
      return;
    }

    setRemovingChildId(child.id);

    try {
      const res = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove_child',
          currentUserId: user.id,
          targetSwimmerId: child.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Odebrání dítěte se nezdařilo.');

      await loadUserData(user);
    } catch (err: any) {
      alert(err.message || 'Chyba při odebrání dítěte.');
    } finally {
      setRemovingChildId(null);
    }
  };

  // SAMOSTATNÁ AKCE: Uživatel (plavec / rodič) si sám nastavuje e-mail a heslo
  const handleSwimmerSelfUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (selfEmail.endsWith('@internal.pkznojmo.cz')) {
      setSelfFormError('Zadejte prosím reálnou e-mailovou adresu.');
      return;
    }

    setSelfFormLoading(true);
    setSelfFormError(null);
    setSelfFormSuccess(null);

    try {
      const res = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_swimmer_self_credentials',
          currentUserId: user.id,
          targetSwimmerId: user.id,
          email: selfEmail,
          password: selfPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Nastavení e-mailu se nezdařilo.');

      setSelfFormSuccess(data.message || 'Váš e-mail a přístupové údaje byly úspěšně aktualizovány!');
      setSelfPassword('');

      const { data: { user: updatedUser } } = await supabase.auth.getUser();
      if (updatedUser) {
        setUser(updatedUser);
        await loadUserData(updatedUser);
      }
    } catch (err: any) {
      setSelfFormError(err.message || 'Chyba při ukládání e-mailu.');
    } finally {
      setSelfFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) return null;

  const fullName = user.user_metadata?.full_name || user.user_metadata?.name || 'Klubový člen';
  const username = user.user_metadata?.username || 'clen';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* HLAVNÍ HLAVIČKA PROFILU */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 ${isParent ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
              {isParent ? <Users className="h-8 w-8" /> : <User className="h-8 w-8" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {fullName}
                </h1>
                
                {/* DYNAMICKÝ VÝPIS VŠECH ROLÍ Z DATABÁZE */}
                <div className="flex flex-wrap items-center gap-1.5 ml-1">
                  {roles.map((role) => {
                    const roleConfig: Record<string, { label: string; className: string }> = {
                      swimmer: { label: 'Plavec', className: 'bg-blue-100 text-blue-800 border-blue-200' },
                      parent: { label: 'Rodič', className: 'bg-amber-100 text-amber-800 border-amber-200' },
                      trainer: { label: 'Trenér', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
                      admin: { label: 'Admin', className: 'bg-purple-100 text-purple-800 border-purple-200' },
                      marketing: { label: 'Marketing', className: 'bg-pink-100 text-pink-800 border-pink-200' },
                    };

                    const config = roleConfig[role] || { label: role, className: 'bg-slate-100 text-slate-800 border-slate-200' };

                    return (
                      <span 
                        key={role} 
                        className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${config.className}`}
                      >
                        {config.label}
                      </span>
                    );
                  })}
                </div>
              </div>
              <p className="text-sm font-semibold text-slate-500 mt-1">
                {isRealEmail(user.email) ? user.email : `@${username}`}
              </p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all active:scale-95"
          >
            <LogOut className="h-4 w-4" />
            <span>Odhlásit se</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* POVINNÁ / UNIVERZÁLNÍ KARTA: ZMĚNA INTERNÍHO E-MAILU NA REÁLNÝ */}
        {/* Zobrazuje se VŽDY, KDYKOLIV je aktuální e-mail typu @internal.pkznojmo.cz */}
        {/* ========================================================= */}
        {!isRealEmail(user.email) && (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-6 sm:p-8 shadow-md space-y-4">
            <div className="border-b border-blue-200 pb-3">
              <h2 className="text-lg font-bold text-blue-950 flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <span>Nastavte si svůj osobní e-mail a heslo</span>
              </h2>
              <p className="text-xs text-blue-800 mt-1">
                Váš účet používá výchozí interní adresu (<code className="font-mono bg-blue-100 px-1 py-0.5 rounded">@internal.pkznojmo.cz</code>). Pro plné zabezpečení a možnost obnovy hesla je nutné si nastavit vlastní osobní e-mail a nové heslo.
              </p>
            </div>

            {selfFormSuccess && (
              <div className="p-3 bg-green-100 border border-green-300 text-green-800 rounded-xl text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <span>{selfFormSuccess}</span>
              </div>
            )}

            {selfFormError && (
              <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-xl text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                <span>{selfFormError}</span>
              </div>
            )}

            <form onSubmit={handleSwimmerSelfUpdate} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-blue-950 uppercase tracking-wider mb-1">
                  Osobní e-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400" />
                  <input
                    type="email"
                    required
                    value={selfEmail}
                    onChange={(e) => setSelfEmail(e.target.value)}
                    placeholder="např. jan.novak@gmail.com"
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-blue-300 bg-white text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-950 uppercase tracking-wider mb-1">
                  Nové heslo
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400" />
                  <input
                    type="password"
                    required
                    value={selfPassword}
                    onChange={(e) => setSelfPassword(e.target.value)}
                    placeholder="Zvolte heslo (min. 6 znaků)"
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-blue-300 bg-white text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={selfFormLoading || !selfEmail}
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-blue-600/20 disabled:opacity-70"
              >
                {selfFormLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>Uložit e-mail a heslo</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* REŽIM A: PŘIHLÁŠENÝ RODIČ (Správa dětí) */}
        {/* ========================================================= */}
        {isParent && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Users className="h-5 w-5 text-amber-600" />
                    <span>Spravované děti ({children.length})</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Seznam plavců propojených s tímto rodičovským účtem.
                  </p>
                </div>
              </div>

              {children.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-xl text-center text-slate-500 text-sm font-medium">
                  Zatím nemáte připojené žádné dítě.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {children.map((child) => (
                    <div key={child.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="font-bold text-slate-900 text-base">{child.full_name}</span>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                          {child.hasRealEmail ? (
                            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              E-mail: {child.email}
                            </span>
                          ) : (
                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Pouze interní účet (bez e-mailu)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedChild(child);
                            setChildEmail(child.email || '');
                            setChildPassword('');
                            setChildFormError(null);
                            setChildFormSuccess(null);
                            setChildModalOpen(true);
                          }}
                          className="px-3.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0"
                        >
                          <KeyRound className="h-4 w-4 text-amber-600" />
                          <span>{child.hasRealEmail ? 'Změnit přístup' : 'Zřídit e-mail a heslo'}</span>
                        </button>

                        <button
                          onClick={() => handleRemoveChild(child)}
                          disabled={removingChildId === child.id || !child.hasRealEmail}
                          title={!child.hasRealEmail ? 'Dítě bez e-mailu nelze odebrat' : 'Odebrat dítě'}
                          className="p-2 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                        >
                          {removingChildId === child.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                          ) : (
                            <UserMinus className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL PRO SPRAVOVÁNÍ ÚDAJŮ DÍTĚTE RODIČEM */}
        {childModalOpen && selectedChild && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-amber-600" />
                  <span>Přístup pro: {selectedChild.full_name}</span>
                </h3>
                <button 
                  onClick={() => setChildModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {childFormSuccess && (
                <div className="p-3 bg-green-100 border border-green-300 text-green-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  <span>{childFormSuccess}</span>
                </div>
              )}

              {childFormError && (
                <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                  <span>{childFormError}</span>
                </div>
              )}

              <form onSubmit={handleSwimmerCredentialsSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    E-mail dítěte
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={childEmail}
                      onChange={(e) => setChildEmail(e.target.value)}
                      placeholder="např. dite@seznam.cz"
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nové heslo pro dítě
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={childPassword}
                      onChange={(e) => setChildPassword(e.target.value)}
                      placeholder="Heslo (min. 6 znaků)"
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setChildModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Zrušit
                  </button>
                  <button
                    type="submit"
                    disabled={childFormLoading || !childEmail || !childPassword}
                    className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2 rounded-xl text-xs transition-all disabled:opacity-70"
                  >
                    {childFormLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Uložit údaje'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* REŽIM B: PŘIHLÁŠENÝ PLAVEC (Správa rodičů a připojení) */}
        {/* ========================================================= */}
        {!isParent && (
          <div className="space-y-6">

            {/* KARTA 2: SEZNAM PŘIPOJENÝCH RODIČŮ */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-4">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Připojení rodiče ({parents.length})</span>
              </h2>

              {parents.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
                  <span>K vašemu účtu zatím není připojen žádný rodič. Přidejte rodiče níže.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {parents.map((parent, idx) => (
                    <div key={parent.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                      <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                        <UserCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 block uppercase">
                          {idx === 0 ? '1. Rodič' : '2. Rodič'}
                        </span>
                        <span className="text-sm font-bold text-slate-800 block">{parent.full_name}</span>
                        <span className="text-xs text-slate-500 font-medium">{parent.email}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* KARTA 3: FORMULÁŘ PRO PŘIPOJENÍ/REGISTRACI RODIČE */}
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 shadow-md space-y-4">
              <div>
                <h3 className="text-lg font-bold text-amber-900">
                  Připojit nebo vytvořit rodičovský účet
                </h3>
                <p className="text-xs font-medium text-amber-800 mt-1">
                  Zadejte e-mail rodiče. Systém automaticky zjistí, zda rodič již má účet, nebo vytvoří nový.
                </p>
              </div>

              {formSuccess && (
                <div className="p-3 bg-green-100 border border-green-300 text-green-800 rounded-xl text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {formError && (
                <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-xl text-sm font-semibold flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* KROK 1: VSTUP PRO E-MAIL RODIČE */}
              {!emailChecked ? (
                <form onSubmit={handleCheckEmail} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="E-mail rodiče (např. rodic@seznam.cz)"
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-amber-300 bg-white text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={checkingEmail || !email}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-amber-600/20 disabled:opacity-70"
                  >
                    {checkingEmail ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span>Ověřit e-mail</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* KROK 2: DYNAMICKÉ REAGOVÁNÍ NA NAČTENÝ STAV */
                <form onSubmit={handleFinalSubmit} className="space-y-4 pt-1 animate-fadeIn">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-amber-100/70 border border-amber-300">
                    <div className="flex items-center gap-2 text-amber-950 font-semibold text-xs">
                      <Mail className="h-4 w-4 text-amber-700" />
                      <span>{email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={resetEmailCheck}
                      className="text-xs font-bold text-amber-800 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Změnit e-mail
                    </button>
                  </div>

                  {accountExists ? (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs font-medium space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-blue-900">
                        <UserCheck className="h-4 w-4 text-blue-600" /> Nalezen existující rodičovský účet!
                      </p>
                      <p className="text-blue-700">Pro bezpečnost zadejte heslo k tomuto rodičovskému účtu pro potvrzení propojení.</p>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-medium space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                        <UserPlus className="h-4 w-4 text-emerald-600" /> Nový rodičovský účet
                      </p>
                      <p className="text-emerald-700">Tento e-mail zatím nemá účet. Zadáním údajů níže vytvoříte nový účet rodiče.</p>
                    </div>
                  )}

                  {!accountExists && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                          Jméno rodiče
                        </label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500" />
                          <input
                            type="text"
                            required
                            value={parentFirstName}
                            onChange={(e) => setParentFirstName(e.target.value)}
                            placeholder="Jméno (např. Petr)"
                            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-amber-300 bg-white text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                          Příjmení rodiče
                        </label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500" />
                          <input
                            type="text"
                            required
                            value={parentLastName}
                            onChange={(e) => setParentLastName(e.target.value)}
                            placeholder="Příjmení (např. Novák)"
                            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-amber-300 bg-white text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                      {accountExists ? "Heslo k rodičovskému účtu" : "Zvolte heslo pro rodiče"}
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={accountExists ? "Heslo k rodičovskému účtu" : "Zvolte nové heslo (min. 6 znaků)"}
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-amber-300 bg-white text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={formLoading}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-amber-600/20 disabled:opacity-70"
                  >
                    {formLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <span>{accountExists ? 'Propojit s účtem rodiče' : 'Vytvořit a propojit rodiče'}</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}