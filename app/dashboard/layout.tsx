import Sidebar from '@/components/Sidebar';
import { ProfileProvider } from '@/components/ProfileContext';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function ProfilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/prihlaseni');

  return (
    <ProfileProvider>
      <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
        <Sidebar />
        <div className="flex-1 p-6 lg:p-10 min-w-0">
          {children}
        </div>
      </div>
    </ProfileProvider>
  );
}
