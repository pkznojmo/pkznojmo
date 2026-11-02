import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const authClient = await createSupabaseServerClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Je nutné se přihlásit.' }, { status: 401 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Serverová konfigurace Supabase není kompletní (chybí SERVICE_ROLE_KEY).' },
        { status: 500 }
      );
    }

    // Admin klient pro privilegiované operace v DB i Auth
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { 
      action, 
      email, 
      password, 
      firstName, 
      lastName, 
      targetSwimmerId, 
      targetParentEmail,
      cspsId,
      csps_id
    } = body;

    // Never trust a caller supplied ID. The verified Supabase session is authoritative.
    const verifiedUserId = user.id;
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles').select('roles').eq('id', verifiedUserId).maybeSingle();
    const callerRoles: string[] = callerProfile?.roles || [];
    const isParent = callerRoles.includes('parent');
    const isSwimmer = callerRoles.includes('swimmer');
    const hasParentLink = async (swimmerId: string) => {
      const { data } = await supabaseAdmin.from('parent_swimmers').select('id')
        .eq('parent_id', verifiedUserId).eq('swimmer_id', swimmerId).maybeSingle();
      return !!data;
    };

    // =========================================================
    // A) RODIČ ZŘIZUJE / NASTAVUJE E-MAIL A HESLO PRO DÍTĚ
    // =========================================================
    if (action === 'create_swimmer_credentials') {
      if (!targetSwimmerId || !isParent || !(await hasParentLink(targetSwimmerId))) {
        return NextResponse.json({ error: 'Nemáte oprávnění spravovat tohoto plavce.' }, { status: 403 });
      }
      if (!targetSwimmerId || !email || !password) {
        return NextResponse.json({ error: 'Chybí povinné údaje (dítě, e-mail nebo heslo).' }, { status: 400 });
      }

      if (password.length < 6) {
        return NextResponse.json({ error: 'Heslo musí mít minimálně 6 znaků.' }, { status: 400 });
      }

      const cleanEmail = email.trim().toLowerCase();

      // 1. Aktualizace v Supabase Auth
      const { error: updateAuthErr } = await supabaseAdmin.auth.admin.updateUserById(
        targetSwimmerId,
        { email: cleanEmail, password: password.trim(), email_confirm: true }
      );
      if (updateAuthErr) throw updateAuthErr;

      // 2. Synchronizace do tabulek profiles i swimmers (pouze e-mail, zachováváme jména!)
      await supabaseAdmin.from('profiles').update({ email: cleanEmail }).eq('id', targetSwimmerId);
      await supabaseAdmin.from('swimmers').update({ email: cleanEmail }).eq('id', targetSwimmerId);

      return NextResponse.json({ 
        success: true, 
        message: 'Přihlašovací údaje dítěte byly úspěšně nastaveny.' 
      });
    }

    // =========================================================
    // B) POZVÁNÍ NOVÉHO RODIČE (e-mail ověřuje vlastník účtu)
    // =========================================================
    if (action === 'create_parent') {
      if (!isSwimmer) return NextResponse.json({ error: 'Tuto akci může provést pouze plavec.' }, { status: 403 });
      if (!email || !firstName?.trim() || !lastName?.trim()) {
        return NextResponse.json({ error: 'Zadejte platný e-mail a jméno rodiče.' }, { status: 400 });
      }

      const cleanEmail = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return NextResponse.json({ error: 'Zadejte platnou e-mailovou adresu.' }, { status: 400 });
      }

      const { data: existingLinks } = await supabaseAdmin
        .from('parent_swimmers').select('id').eq('swimmer_id', verifiedUserId).limit(2);
      if ((existingLinks || []).length >= 2) {
        return NextResponse.json({ error: 'K účtu lze připojit nejvýše dva rodiče.' }, { status: 429 });
      }

      const pFirstName = firstName.trim();
      const pLastName = lastName.trim();
      const pFullName = `${pFirstName} ${pLastName}`;

      const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(cleanEmail, {
        data: { is_parent: true, first_name: pFirstName, last_name: pLastName, full_name: pFullName },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      });
      if (inviteError || !invited.user) {
        return NextResponse.json({ success: true, message: 'Pokud lze pro tuto adresu založit účet, dorazí pozvánka. Je-li účet již založen, zvolte propojení s existujícím účtem.' });
      }

      const parentId = invited.user.id;
      const { error: profileDbErr } = await supabaseAdmin
        .from('profiles')
        .upsert([{ 
          id: parentId, 
          first_name: pFirstName,
          last_name: pLastName,
          email: cleanEmail,
          roles: ['parent']
        }], { onConflict: 'id' });

      if (profileDbErr) throw profileDbErr;

      const { error: linkErr } = await supabaseAdmin
        .from('parent_swimmers')
        .upsert([{ parent_id: parentId, swimmer_id: verifiedUserId }], { onConflict: 'parent_id,swimmer_id' });

      if (linkErr) {
        if (linkErr.code === '23505') {
          return NextResponse.json({ error: 'Tento rodič už je k vašemu účtu připojen.' }, { status: 400 });
        }
        throw linkErr;
      }

      return NextResponse.json({ success: true, message: 'Pozvánka byla odeslána. Rodič si účet aktivuje a nastaví heslo přes e-mail.' });
    }

    // =========================================================
    // C) PROPOJENÍ S EXISTUJÍCÍM RODIČEM (+ OVĚŘENÍ HESLA A Nastavení Role)
    // =========================================================
    if (action === 'link_existing_parent') {
      if (!isSwimmer) return NextResponse.json({ error: 'Tuto akci může provést pouze plavec.' }, { status: 403 });
      const parentEmailToUse = (targetParentEmail || email)?.trim().toLowerCase();
      
      if (!parentEmailToUse) {
        return NextResponse.json({ error: 'Zadejte e-mail rodiče.' }, { status: 400 });
      }

      if (!password) {
        return NextResponse.json({ error: 'Pro ověření stávajícího rodičovského účtu zadejte jeho heslo.' }, { status: 400 });
      }

      // 1. Ověření hesla vůči Supabase Auth skrze klientského klienta
      if (!anonKey) {
        return NextResponse.json({ error: 'Chybí NEXT_PUBLIC_SUPABASE_ANON_KEY v prostředí.' }, { status: 500 });
      }
      const supabaseClient = createClient(supabaseUrl, anonKey);

      const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
        email: parentEmailToUse,
        password: password,
      });

      if (authError || !authData.user) {
        return NextResponse.json({ error: 'Zadané heslo k rodičovskému účtu není správné.' }, { status: 400 });
      }

      const parentUserId = authData.user.id;
      const targetSwimmer = verifiedUserId;

      // Zajištění, že rodič má v profilu roli 'parent'
      const { data: existingParentProf } = await supabaseAdmin
        .from('profiles')
        .select('roles')
        .eq('id', parentUserId)
        .maybeSingle();

      let parentRoles: string[] = existingParentProf?.roles || [];
      if (!parentRoles.includes('parent')) {
        parentRoles = [...parentRoles, 'parent'];
        await supabaseAdmin
          .from('profiles')
          .update({ roles: parentRoles })
          .eq('id', parentUserId);
      }

      // 2. Vytvoření vazby v DB
      const { error: linkErr } = await supabaseAdmin
        .from('parent_swimmers')
        .insert([{ parent_id: parentUserId, swimmer_id: targetSwimmer }]);

      if (linkErr) {
        if (linkErr.code === '23505') {
          return NextResponse.json({ error: 'Tento plavec již k tomuto rodiči spadá.' }, { status: 400 });
        }
        throw linkErr;
      }

      return NextResponse.json({ success: true, message: 'Úspěšně ověřeno a propojeno s rodičem.' });
    }

    // =========================================================
    // D) ODEBRÁNÍ DÍTĚTE RODIČEM (Ochrana: Dítě musí mít e-mail)
    // =========================================================
    if (action === 'remove_child') {
      if (!targetSwimmerId || !isParent || !(await hasParentLink(targetSwimmerId))) {
        return NextResponse.json({ error: 'Nemáte oprávnění odebrat tohoto plavce.' }, { status: 403 });
      }
      if (!targetSwimmerId) {
        return NextResponse.json({ error: 'Chybí ID dítěte k odebrání.' }, { status: 400 });
      }

      // 1. Načtení e-mailu dítěte
      const { data: swimmer, error: swimmerErr } = await supabaseAdmin
        .from('swimmers')
        .select('email')
        .eq('id', targetSwimmerId)
        .single();

      if (swimmerErr || !swimmer) {
        return NextResponse.json({ error: 'Plavec nebyl nalezen.' }, { status: 404 });
      }

      // 2. Bezpečnostní kontrola – nesmí jít o interní generovaný e-mail bez přístupu
      const swimmerEmail = swimmer.email || '';
      const isInternalEmail = swimmerEmail.endsWith('@internal.pkznojmo.cz') || !swimmerEmail;

      if (isInternalEmail) {
        return NextResponse.json(
          { error: 'Nelze odebrat dítě, které nemá zřízený vlastní e-mail a heslo. Dítě by ztratilo možnost se přihlásit.' },
          { status: 400 }
        );
      }

      // 3. Odstranění vazby rodič-dítě
      const { error: deleteErr } = await supabaseAdmin
        .from('parent_swimmers')
        .delete()
        .eq('parent_id', verifiedUserId)
        .eq('swimmer_id', targetSwimmerId);

      if (deleteErr) throw deleteErr;

      return NextResponse.json({
        success: true,
        message: 'Dítě bylo úspěšně odebráno ze skupiny.'
      });
    }

    // =========================================================
    // E) PLAVEC SI SÁM NASTAVUJE/MĚNÍ SŮJ E-MAIL A HESLO
    // =========================================================
    if (action === 'update_swimmer_self_credentials') {
      const targetId = verifiedUserId;
      if (targetSwimmerId && targetSwimmerId !== verifiedUserId) {
        return NextResponse.json({ error: 'Můžete měnit pouze vlastní přihlašovací údaje.' }, { status: 403 });
      }

      if (!targetId || !email) {
        return NextResponse.json({ error: 'Chybí povinné údaje (e-mail).' }, { status: 400 });
      }

      const cleanEmail = email.trim().toLowerCase();

      const updateData: { email: string; email_confirm: boolean; password?: string } = {
        email: cleanEmail,
        email_confirm: true,
      };

      if (password && password.trim().length >= 6) {
        updateData.password = password.trim();
      }

      // 1. Změna v Supabase Auth
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        targetId,
        updateData
      );

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }

      // 2. Aktualizace v aplikaci
      await supabaseAdmin.from('profiles').update({ email: cleanEmail }).eq('id', targetId);
      await supabaseAdmin.from('swimmers').update({ email: cleanEmail }).eq('id', targetId);

      return NextResponse.json({
        success: true,
        message: 'Váš osobní e-mail a přihlašovací údaje byly úspěšně uloženy.'
      });
    }

    // =========================================================
    // F) ÚPRAVA ČSPS_ID (PLAVEC PRO SEBE / RODIČ PRO SVÉ DÍTĚ)
    // =========================================================
    if (action === 'update_csps_id') {
      const targetId = targetSwimmerId || verifiedUserId;
      const rawCsps = cspsId !== undefined ? cspsId : csps_id;
      const cleanCspsId = rawCsps !== undefined && rawCsps !== null && rawCsps !== '' 
        ? rawCsps.toString().trim() 
        : null;

      // Ochrana oprávnění: buď upravuje sám sebe, nebo je prokazatelným rodičem plavce
      if (targetId !== verifiedUserId) {
        if (!isParent) return NextResponse.json({ error: 'Nemáte oprávnění.' }, { status: 403 });
        const { data: isParentLink } = await supabaseAdmin
          .from('parent_swimmers')
          .select('id')
          .eq('parent_id', verifiedUserId)
          .eq('swimmer_id', targetId)
          .maybeSingle();

        if (!isParentLink) {
          return NextResponse.json(
            { error: 'Nemáte oprávnění upravovat ČSPS ID tohoto plavce.' },
            { status: 403 }
          );
        }
      }

      // 1. Aktualizace v tabulce profiles
      const { error: profErr } = await supabaseAdmin
        .from('profiles')
        .update({ csps_id: cleanCspsId })
        .eq('id', targetId);

      if (profErr) throw profErr;

      // 2. Synchronizace do tabulky swimmers (pokud existuje)
      try {
        await supabaseAdmin
          .from('swimmers')
          .update({ csps_id: cleanCspsId })
          .eq('id', targetId);
      } catch (e) {
        // Pokud tabulka swimmers nemá sloupec csps_id, tiše ignorujeme
      }

      return NextResponse.json({
        success: true,
        message: 'Registrační číslo ČSPS ID bylo úspěšně uloženo.'
      });
    }

    return NextResponse.json({ error: 'Neznámá akce' }, { status: 400 });

  } catch (err: any) {
    console.error('API Error (/api/family):', err);
    return NextResponse.json({ error: err.message || 'Chyba na serveru' }, { status: 500 });
  }
}
