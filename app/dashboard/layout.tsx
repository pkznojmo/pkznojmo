import Sidebar from '@/components/Sidebar';
import { ProfileProvider } from '@/components/ProfileContext';

export default function ProfilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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