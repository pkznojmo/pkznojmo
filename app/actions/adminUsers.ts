'use server'

import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// Inicializace admin klienta (vyžaduje proměnnou v .env.local)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const supabaseAuthMailer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function isAdmin() {
  const authClient = await createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return false;
  const { data: profile } = await authClient.from('profiles').select('roles').eq('id', user.id).maybeSingle();
  return !!profile?.roles?.includes('admin');
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function passwordResetUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  return siteUrl ? `${siteUrl}/obnovit-heslo` : null;
}

export async function getAuthLastSignIns(userIds: string[]) {
  if (!(await isAdmin())) return { success: false as const, message: 'Nemáte oprávnění.', times: {} };
  if (!Array.isArray(userIds) || userIds.length > 1000 || userIds.some((id) => !isUuid(id))) {
    return { success: false as const, message: 'Neplatný seznam uživatelů.', times: {} };
  }
  if (userIds.length === 0) return { success: true as const, times: {} };

  const requested = new Set(userIds);
  const times: Record<string, string | null> = {};
  let page = 1;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return { success: false as const, message: 'Nepodařilo se načíst přihlášení.', times: {} };
    for (const authUser of data.users) {
      if (requested.has(authUser.id)) times[authUser.id] = authUser.last_sign_in_at || null;
    }
    if (data.users.length < 1000) break;
    page += 1;
  }

  for (const id of requested) if (!(id in times)) times[id] = null;
  return { success: true as const, times };
}

export async function sendUserPasswordReset(userId: string) {
  if (!(await isAdmin())) return { success: false, message: 'Nemáte oprávnění.' };
  if (!isUuid(userId)) return { success: false, message: 'Neplatný uživatel.' };
  const redirectTo = passwordResetUrl();
  if (!redirectTo) return { success: false, message: 'Chybí nastavení adresy webu.' };

  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error || !data.user?.email) return { success: false, message: 'Uživatel nemá použitelný e-mail.' };
  if (data.user.email.toLowerCase().endsWith('@internal.pkznojmo.cz')) {
    return { success: false, message: 'Nejdřív nastavte uživateli osobní e-mail.' };
  }

  const { error: resetError } = await supabaseAuthMailer.auth.resetPasswordForEmail(data.user.email, { redirectTo });
  if (resetError) return { success: false, message: 'E-mail s odkazem se nepodařilo odeslat.' };
  return { success: true, message: `Odkaz pro změnu hesla byl odeslán na ${data.user.email}.` };
}

export async function changeUserEmailAndSendReset(userId: string, requestedEmail: string) {
  if (!(await isAdmin())) return { success: false, message: 'Nemáte oprávnění.' };
  if (typeof userId !== 'string' || !isUuid(userId)) return { success: false, message: 'Neplatný uživatel.' };
  if (typeof requestedEmail !== 'string') return { success: false, message: 'Zadejte platnou e-mailovou adresu.' };

  const email = requestedEmail.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: 'Zadejte platnou e-mailovou adresu.' };
  }
  const redirectTo = passwordResetUrl();
  if (!redirectTo) return { success: false, message: 'Chybí nastavení adresy webu.' };

  const { data: current, error: currentError } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (currentError || !current.user?.email) return { success: false, message: 'Původní e-mail uživatele se nepodařilo načíst.' };
  const oldEmail = current.user.email;

  const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    email,
    email_confirm: true,
  });
  if (authUpdateError) return { success: false, message: 'E-mail se nepodařilo změnit.' };

  const { error: profileUpdateError } = await supabaseAdmin.from('profiles').update({ email }).eq('id', userId);
  if (profileUpdateError) {
    await supabaseAdmin.auth.admin.updateUserById(userId, { email: oldEmail, email_confirm: true });
    return { success: false, message: 'E-mail profilu se nepodařilo synchronizovat; změna byla vrácena.' };
  }

  const { error: resetError } = await supabaseAuthMailer.auth.resetPasswordForEmail(email, { redirectTo });
  if (resetError) {
    await Promise.all([
      supabaseAdmin.auth.admin.updateUserById(userId, { email: oldEmail, email_confirm: true }),
      supabaseAdmin.from('profiles').update({ email: oldEmail }).eq('id', userId),
    ]);
    return { success: false, message: 'Odkaz se nepodařilo odeslat, proto byla změna e-mailu vrácena.' };
  }

  return { success: true, message: `E-mail byl změněn a odkaz pro nastavení nového hesla odeslán na ${email}.` };
}

export async function inviteClubMember(prevState: any, formData: FormData) {
  const authClient = await createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return { success: false, message: 'Je nutné se přihlásit.' };

  const { data: profile } = await authClient.from('profiles').select('roles').eq('id', user.id).maybeSingle();
  if (!profile?.roles?.includes('admin')) return { success: false, message: 'Nemáte oprávnění.' };

  const email = formData.get('email') as string;
  const firstName = formData.get('first_name') as string;
  const lastName = formData.get('last_name') as string;

  if (!email || !email.includes('@')) return { success: false, message: 'Zadejte platný e-mail.' };

  // Create/invite only after server-side admin authorization.
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: {
      first_name: firstName,
      last_name: lastName,
    },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  // Trigger automaticky vytvoří profil, zde můžeme doplnit doplňkové údaje (tým, ročník atd.)
  if (data.user) {
    await supabaseAdmin
      .from('profiles')
      .update({
        birth_year: formData.get('birth_year') ? parseInt(formData.get('birth_year') as string) : null,
        team_id: formData.get('team_id') ? parseInt(formData.get('team_id') as string) : null,
        roles: formData.get('role') as string || 'swimmer',
      })
      .eq('id', data.user.id);
  }

  return { success: true, message: 'Pozvánka byla úšpěšně odeslána na e-mail uživatele.' };
}
