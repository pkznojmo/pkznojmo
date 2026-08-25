import Sidebar from '@/components/Sidebar';

export default function ProfilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      {/* Sidebar po celé výšce */}
      <Sidebar />

      {/* Hlavní obsahová část */}
      <div className="flex-1 p-6 lg:p-10 min-w-0">
        {children}
      </div>
    </div>
  );
}