'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { KeyRound, User, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // KONTROLA PŘIHLÁŠENÉHO UŽIVATELE
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Pokud je uživatel přihlášen, přesměrujeme ho pryč (např. na dashboard)
        router.replace('/dashboard');
      } else {
        setCheckingAuth(false);
      }
    };

    checkUser();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Pokud uživatel zadal pouze uživatelské jméno (bez @), zformátujeme na e-mail
      let email = loginInput.trim();
      if (!email.includes('@')) {
        email = `${email}@internal.pkznojmo.cz`;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error('Nespávné uživatelské jméno nebo heslo.');
        }
        throw signInError;
      }

      if (data.user) {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Při přihlašování došlo k chybě.');
    } finally {
      setLoading(false);
    }
  };

  // Zobrazit loader během kontroly přihlášení, aby stránka neproblikla
  if (checkingAuth) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* LOGO KLUBU */}
        <div className="flex justify-center">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="PK Znojmo"
              width={1024}
              height={1024}
              className="h-20 w-auto object-contain transition-transform hover:scale-105"
              priority
            />
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-black tracking-tight text-slate-900">
          Přihlášení do klubu
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-slate-600">
          Vstup pro plavce, rodiče a trenéry PK Znojmo
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl sm:px-10 border border-slate-100">
          
          {/* CHYBOVÁ HLÁŠKA */}
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 border border-red-200/60 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-red-800">{error}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            {/* UŽIVATELSKÉ JMÉNO / EMAIL */}
            <div>
              <label 
                htmlFor="login" 
                className="block text-sm font-bold text-slate-700 mb-1.5"
              >
                Uživatelské jméno nebo E-mail
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="login"
                  name="login"
                  type="text"
                  required
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  placeholder="např. novak.jan.2010"
                  className="block w-full rounded-xl border border-slate-200 pl-11 pr-4 py-2.5 text-slate-900 text-sm font-medium placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
                />
              </div>
            </div>

            {/* HESLO */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label 
                  htmlFor="password" 
                  className="block text-sm font-bold text-slate-700"
                >
                  Heslo
                </label>
                <Link
                  href="/zapomenute-heslo"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Zapomněli jste heslo?
                </Link>
              </div>
              <div className="relative rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <KeyRound className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-slate-200 pl-11 pr-4 py-2.5 text-slate-900 text-sm font-medium placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
                />
              </div>
            </div>

            {/* ODESÍLACÍ TLAČÍTKO */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Přihlašování...</span>
                </>
              ) : (
                <>
                  <span>Přihlásit se</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}