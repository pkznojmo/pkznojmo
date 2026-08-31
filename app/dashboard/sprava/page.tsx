import Link from 'next/link';

export default function SpravaPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Administrace systému</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link 
          href="/dashboard/sprava/uzivatelu"
          className="p-6 bg-white dark:bg-zinc-800 rounded-lg shadow border border-zinc-200 dark:border-zinc-700 hover:border-blue-500 transition block"
        >
          <h2 className="text-xl font-semibold text-white mb-2">Správa uživatelů</h2>
          <p className="text-zinc-600 dark:text-zinc-400">Přehled, editace a správa uživatelských účtů a oprávnění.</p>
        </Link>

        <Link 
          href="/dashboard/sprava/tymu"
          className="p-6 bg-white dark:bg-zinc-800 rounded-lg shadow border border-zinc-200 dark:border-zinc-700 hover:border-blue-500 transition block"
        >
          <h2 className="text-xl text-white font-semibold mb-2">Správa týmů</h2>
          <p className="text-zinc-600 dark:text-zinc-400">Správa sportovních týmů, členů, soupisek a přiřazení.</p>
        </Link>
      </div>
    </div>
  );
}