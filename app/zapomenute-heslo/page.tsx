'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { User, ArrowRight, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [loginInput, setLoginInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Zpracování vstupu (stejná logika jako u přihlášení pro uživatelská jména)
      let email = loginInput.trim();
      if (!email.includes('@')) {
        email = `${email}@internal.pkznojmo.cz`;
      }

      // Odeslání požadavku na obnovu hesla přes Supabase
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/obnovit-heslo`, // Stránka, kam se uživatel vrátí po kliknutí na email
      });

      if (resetError) {
        throw resetError;
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Při odesílání žádosti o nové heslo došlo k chybě.');
    } finally {
      setLoading(false);
    }
  };

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
          Zapomenuté heslo
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-slate-600">
          Zadejte své uživatelské jméno nebo e-mail a pošleme vám instrukce k obnově
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

          {/* ÚSPĚŠNÉ ODESLÁNÍ */}
          {success ? (
            <div className="space-y-6">
              <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200/60 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-sm font-semibold text-emerald-900">
                  <p>Žádost byla odeslána.</p>
                  <p className="mt-1 font-normal text-emerald-700">
                    Pokud zadaný účet existuje, odeslali jsme na něj instrukce pro resetování hesla. Zkontrolujte svou e-mailovou schránku.
                  </p>
                </div>
              </div>

              <Link
                href="/prihlaseni"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition-all hover:bg-slate-800 active:scale-[0.98]"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Zpět na přihlášení</span>
              </Link>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handlePasswordReset}>
              {/* UŽIVATELSKÉ JMÉNO / EMAIL */}
              <div>
                <label 
                  htmlFor="login" 
                  className="block text-sm font-bold text-slate-700 mb-1.5"
                >
                  E-mail
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

              {/* ODESÍLACÍ TLAČÍTKO */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Odesílání...</span>
                  </>
                ) : (
                  <>
                    <span>Obnovit heslo</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* ZPĚT NA PŘIHLÁŠENÍ */}
              <div className="text-center pt-2">
                <Link
                  href="/prihlaseni"
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Zpět na přihlášení
                </Link>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}