import { supabase } from '@/lib/supabase';
import AttendanceClient from './AttendanceClient';

export default async function TeamAttendancePage({ 
  params 
}: { 
  params: Promise<{ id: string }> | { id: string } 
}) {
  const resolvedParams = await params;
  const teamId = resolvedParams.id;

  // 1. Zjištění přihlášeného uživatele a jeho role
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, roles')
      .eq('id', user.id)
      .single();
    
    if (profile?.role === 'admin' || (profile as any)?.roles?.includes('admin')) {
      isAdmin = true;
    }
  }

  // 2. Načtení plavců přímo z tabulky profiles podle team_id
  const { data: swimmersData, error: swimmersError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, team_id')
    .eq('team_id', Number(teamId));

  if (swimmersError) {
    console.error('Chyba při načítání plavců pro tým:', swimmersError);
  }

  const swimmers = swimmersData || [];

  // 3. Načtení docházky pro plavce v tomto týmu
  const swimmerIds = swimmers.map((s) => s.id);
  let initialAttendance: any[] = [];

  if (swimmerIds.length > 0) {
    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('*')
      .in('swimmer_id', swimmerIds);

    initialAttendance = attendanceData || [];
  }

  // 4. Načtení všech profilů pro administrátora (pro možnost přidání do týmu)
  let allSwimmers: any[] = [];
  if (isAdmin) {
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, team_id');
    
    allSwimmers = allProfiles || [];
  }

  return (
    <AttendanceClient
      teamId={teamId}
      initialSwimmers={swimmers}
      initialAttendance={initialAttendance}
      isAdmin={isAdmin}
      allSwimmers={allSwimmers}
    />
  );
}