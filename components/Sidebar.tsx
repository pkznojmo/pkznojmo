'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/components/ProfileContext'; // <-- 1. Import kontextu
import { 
  Users, 
  Trophy, 
  BarChart2, 
  User, 
  Settings, 
  CheckSquare, 
  Activity, 
  ChevronDown, 
  Waves,
  ShieldCheck,
  UserCheck,
  Loader2,
  Menu,
  X,
  LogIn
} from 'lucide-react';

const ROLE_NAV_ITEMS: Record<string, Array<{ name: string; href: string; icon: any }>> = {
  admin: [
    { name: 'Týmy', href: '/dashboard/tymy', icon: Users },
    { name: 'Závody', href: '/dashboard/zavody', icon: Trophy },
    { name: 'Žebříčky', href: '/dashboard/zebricky', icon: BarChart2 },
    { name: 'Správa uživatelů', href: '/dashboard/sprava', icon: Settings },
    { name: 'Úkoly', href: '/dashboard/ukoly', icon: CheckSquare },
    { name: 'Můj účet', href: '/dashboard', icon: User },
  ],
  trainer: [
    { name: 'Týmy', href: '/dashboard/tymy', icon: Users },
    { name: 'Závody', href: '/dashboard/zavody', icon: Trophy },
    { name: 'Žebříčky', href: '/dashboard/zebricky', icon: BarChart2 },
    { name: 'Můj účet', href: '/dashboard', icon: User },
  ],
  marketing: [
    { name: 'Úkoly', href: '/dashboard/ukoly', icon: CheckSquare },
    { name: 'Můj účet', href: '/dashboard', icon: User },
  ],
  swimmer: [
    { name: 'Statistika', href: '/dashboard/statistika', icon: Activity },
    { name: 'Závody', href: '/dashboard/zavody', icon: Trophy },
    { name: 'Žebříčky', href: '/dashboard/zebricky', icon: BarChart2 },
    { name: 'Můj účet', href: '/dashboard', icon: User },
  ],
  parent: [
    { name: 'Závody', href: '/dashboard/zavody', icon: Trophy },
    { name: 'Žebříčky', href: '/dashboard/zebricky', icon: BarChart2 },
    { name: 'Můj účet', href: '/dashboard', icon: User },
  ],
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  trainer: 'Trenér',
  marketing: 'Marketing',
  swimmer: 'Plavec',
  parent: 'Rodič',
};

export default function Sidebar() {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // <-- 2. Použití globálního stavu z kontextu místo lokálního useState
  const { activeProfile, setActiveProfile, availableProfiles, setAvailableProfiles } = useProfile();

  useEffect(() => {
    const fetchUserDataAndProfiles = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoggedIn(false);
          setLoading(false);
          return;
        }

        setIsLoggedIn(true);
        const fallbackName = user.user_metadata?.full_name || user.user_metadata?.name || 'Můj účet';

        const { data: profileData } = await supabase
          .from('profiles')
          .select('roles, first_name, last_name')
          .eq('id', user.id)
          .single();

        const userRoles: string[] = profileData?.roles || ['swimmer'];
        const displayName = (profileData?.first_name || profileData?.last_name)
          ? `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim()
          : fallbackName;

        const selfProfiles = userRoles.map((role) => ({
          id: `self-${role}`,
          label: displayName,
          subtitle: `Moje role: ${ROLE_LABELS[role] || role}`,
          role: role,
          type: 'self' as const,
        }));

        const { data: linkData } = await supabase
          .from('parent_swimmers')
          .select(`
            swimmer_id,
            swimmers:swimmer_id (
              id,
              first_name,
              last_name
            )
          `)
          .eq('parent_id', user.id);

        const childProfiles = (linkData || [])
          .map((item: any) => item.swimmers)
          .filter(Boolean)
          .map((child: any) => ({
            id: `child-${child.id}`,
            label: `${child.first_name || ''} ${child.last_name || ''}`.trim() || 'Dítě',
            subtitle: 'Dítě (Plavec)',
            role: 'parent',
            type: 'child' as const,
            childId: child.id,
          }));

        const combined = [...selfProfiles, ...childProfiles];
        
        // <-- 3. Uložení do globálního kontextu
        setAvailableProfiles(combined);

        if (combined.length > 0 && !activeProfile) {
          setActiveProfile(combined[0]);
        }
      } catch (err) {
        console.error('Chyba při načítání profilů v Sidebaru:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDataAndProfiles();
  }, [activeProfile, setActiveProfile, setAvailableProfiles]);

  const currentNavItems = activeProfile ? (ROLE_NAV_ITEMS[activeProfile.role] || []) : [];
  const primaryMobileNav = currentNavItems.slice(0, 3);

  return (
    <>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 15s linear infinite;
        }
      `}</style>

      {/* DESKTOPOVÝ SIDEBAR */}
      <aside className="hidden md:flex w-64 min-h-screen bg-white text-slate-700 flex-col border-r border-slate-200/80 shrink-0 select-none relative overflow-hidden">
        
        {loading ? (
          <div className="flex items-center justify-center h-full p-6 text-xs text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2 text-blue-600" />
            Načítám...
          </div>
        ) : !isLoggedIn ? (
          <>

            {/* Obsah pro nepřihlášené */}
            <div className="flex-1 flex flex-col items-center justify-top pt-20 p-6 z-10 text-center space-y-4 my-auto">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 shadow-inner">
                <User className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-900">Jste člen klubu?</h4>
                <p className="text-xs text-slate-500">Přihlaste se pro zobrazení tréninků a osobního plánu.</p>
              </div>
              <Link
                href="/prihlaseni"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Přihlásit se</span>
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* PŘEPÍNAČ PROFILU */}
            <div className="p-3 border-b border-slate-100 relative">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-2">
                Aktivní pohled
              </label>

              {activeProfile && (
                <>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className={`p-1.5 rounded-lg shrink-0 ${activeProfile.type === 'child' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {activeProfile.type === 'child' ? <UserCheck className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-900 truncate">{activeProfile.label}</div>
                        <div className="text-[10px] font-medium text-slate-500 truncate">{activeProfile.subtitle}</div>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute top-full left-3 right-3 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                      {availableProfiles.map((profile) => (
                        <button
                          key={profile.id}
                          onClick={() => {
                            setActiveProfile(profile);
                            setDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                            activeProfile?.id === profile.id ? 'bg-blue-50/60' : ''
                          }`}
                        >
                          <div className={`p-1 rounded-md shrink-0 ${profile.type === 'child' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                            {profile.type === 'child' ? <UserCheck className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                          </div>
                          <div className="truncate">
                            <div className={`text-xs font-bold ${activeProfile?.id === profile.id ? 'text-blue-600' : 'text-slate-800'}`}>
                              {profile.label}
                            </div>
                            <div className="text-[10px] text-slate-400">{profile.subtitle}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* NAVIGACE */}
            <nav className="flex-1 px-3 py-4 space-y-1">
              {currentNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </>
        )}
      </aside>

      {/* MOBILNÍ BOTTOM NAVIGACE (< md) - Zobrazuje se pouze přihlášeným */}
      {isLoggedIn && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 z-40 px-2 py-1 flex items-center justify-around shadow-lg">
          {primaryMobileNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl min-h-[48px] transition-colors ${
                  isActive ? 'text-blue-600 font-bold' : 'text-slate-500 font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="text-[10px] mt-1">{item.name}</span>
              </Link>
            );
          })}

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl min-h-[48px] text-slate-500 font-medium cursor-pointer"
          >
            <Menu className="w-5 h-5 text-slate-400" />
            <span className="text-[10px] mt-1">Více</span>
          </button>
        </div>
      )}

      {/* MOBILNÍ OVERLAY MENU */}
      {mobileMenuOpen && isLoggedIn && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-150">
          <div className="bg-white rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Waves className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-sm text-slate-900">Menu a Profily</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeProfile && (
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                  Aktivní pohled
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {availableProfiles.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => {
                        setActiveProfile(profile);
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors min-h-[48px] cursor-pointer ${
                        activeProfile?.id === profile.id 
                          ? 'bg-blue-50 border-blue-200 text-blue-900 font-bold' 
                          : 'bg-slate-50 border-slate-200/80 text-slate-700'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${profile.type === 'child' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {profile.type === 'child' ? <UserCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>
                      <div className="truncate">
                        <div className="text-xs">{profile.label}</div>
                        <div className="text-[10px] text-slate-500">{profile.subtitle}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">
                Navigace
              </label>
              {currentNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold min-h-[44px] transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}