'use server'

import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// Inicializace admin klienta (vyžaduje proměnnou v .env.local)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

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
