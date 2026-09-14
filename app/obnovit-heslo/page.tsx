'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { KeyRound, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Supabase automaticky zpracuje token z URL (hash) a přihlásí uživatele do dočasné session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setError('Odkaz pro obnovu hesla vypršel nebo je neplatný. Požádejte prosím o nový.');
      }
      setCheckingSession(false);
    };

    checkSession();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Zadaná hesla se neshodují.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Heslo musí mít alespoň 6 znaků.');
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      
      // Po chvíli uživatele přesměrujeme na dashboard nebo přihlášení
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Při změně hesla došlo k chybě.');
    } finally {
      setLoading(false);
    }
  };

  // Zobrazit loader během ověřování odkazu z mailu
  if (checkingSession) {
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
          Nové heslo
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-slate-600">
          Zadejte své nové heslo pro přístup do systému
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl sm:px-10 border border-slate-100">
          
          {/* CHYBOVÁ HLÁŠKA (např. expirovaný odkaz) */}
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 border border-red-200/60 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-sm font-semibold text-red-800">
                <p>{error}</p>
                {error.includes('vypršel') && (
                  <Link href="/zapomenute-heslo" className="block mt-2 text-blue-600 hover:underline">
                    &larr; Požádat o nový odkaz
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* ÚSPĚŠNÁ ZMĚNA HESLA */}
          {success ? (
            <div className="space-y-6">
              <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200/60 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-sm font-semibold text-emerald-900">
                  <p>Heslo bylo úspěšně změněno!</p>
                  <p className="mt-1 font-normal text-emerald-700">
                    Budete automaticky přesměrováni do systému...
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700"
              >
                <span>Přejít do dashboardu</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            !error && (
              <form className="space-y-5" onSubmit={handleUpdatePassword}>
                {/* NOVÉ HESLO */}
                <div>
                  <label 
                    htmlFor="password" 
                    className="block text-sm font-bold text-slate-700 mb-1.5"
                  >
                    Nové heslo
                  </label>
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

                {/* KONTROLA HESLA */}
                <div>
                  <label 
                    htmlFor="confirmPassword" 
                    className="block text-sm font-bold text-slate-700 mb-1.5"
                  >
                    Potvrzení nového hesla
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <KeyRound className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                      <span>Ukládání hesla...</span>
                    </>
                  ) : (
                    <>
                      <span>Uložit nové heslo</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )
          )}

        </div>
      </div>
    </div>
  );
}