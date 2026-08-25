import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
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
      currentUserId, 
      email, 
      password, 
      firstName, 
      lastName, 
      targetSwimmerId, 
      targetParentEmail 
    } = body;

    if (!currentUserId) {
      return NextResponse.json({ error: 'Neautorizovaný požadavek' }, { status: 401 });
    }

    // =========================================================
    // A) RODIČ ZŘIZUJE / NASTAVUJE E-MAIL A HESLO PRO DÍTĚ
    // =========================================================
    if (action === 'create_swimmer_credentials') {
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

      // 2. Synchronizace do tabulek profiles i swimmers
      await supabaseAdmin.from('profiles').update({ email: cleanEmail }).eq('id', targetSwimmerId);
      await supabaseAdmin.from('swimmers').update({ email: cleanEmail }).eq('id', targetSwimmerId);

      return NextResponse.json({ 
        success: true, 
        message: 'Přihlašovací údaje dítěte byly úspěšně nastaveny.' 
      });
    }

    // =========================================================
    // B) VYTVOŘENÍ NOVÉHO RODIČE (Iniciováno plavcem)
    // =========================================================
    if (action === 'create_parent') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Zadejte e-mail a heslo rodiče' }, { status: 400 });
      }

      const cleanEmail = email.trim().toLowerCase();

      // 1. Zajištění existence profilu pro plavce
      const { data: swimmerAuth } = await supabaseAdmin.auth.admin.getUserById(currentUserId);
      const swimmerMeta = swimmerAuth?.user?.user_metadata || {};

      const swimmerFirstName = swimmerMeta.first_name || swimmerMeta.full_name?.split(' ')[0] || 'Plavec';
      const swimmerLastName = swimmerMeta.last_name || swimmerMeta.full_name?.split(' ').slice(1).join(' ') || 'Neznámé';

      await supabaseAdmin.from('profiles').upsert([{ 
        id: currentUserId,
        first_name: swimmerFirstName,
        last_name: swimmerLastName
      }], { onConflict: 'id' });

      // 2. Příprava jména pro nového rodiče
      const pFirstName = firstName?.trim() || 'Rodič';
      const pLastName = lastName?.trim() || cleanEmail.split('@')[0];
      const pFullName = `${pFirstName} ${pLastName}`.trim();

      // 3. Vytvoření / získání Auth účtu rodiče
      let parentId: string;

      const { data: parentAuth, error: parentAuthErr } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,
        user_metadata: { 
          is_parent: true,
          first_name: pFirstName,
          last_name: pLastName,
          full_name: pFullName
        }
      });

      if (parentAuthErr) {
        if (parentAuthErr.message.includes('already been registered') || parentAuthErr.status === 422) {
          const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = usersData.users.find(u => u.email?.toLowerCase() === cleanEmail);
          
          if (!existingUser) {
            return NextResponse.json({ error: 'Uživatel s tímto e-mailem již existuje, ale nelze načíst jeho ID.' }, { status: 400 });
          }
          parentId = existingUser.id;
        } else {
          throw parentAuthErr;
        }
      } else {
        parentId = parentAuth.user.id;
      }

      // 4. Vložení/aktualizace profilu rodiče do tabulky profiles
      const { error: profileDbErr } = await supabaseAdmin
        .from('profiles')
        .upsert([{ 
          id: parentId, 
          first_name: pFirstName,
          last_name: pLastName,
          email: cleanEmail
        }], { onConflict: 'id' });

      if (profileDbErr) throw profileDbErr;

      await supabaseAdmin
        .from('parents')
        .upsert([{ id: parentId, email: cleanEmail }], { onConflict: 'id' });
        
      // 5. Propojení v parent_swimmers
      const { error: linkErr } = await supabaseAdmin
        .from('parent_swimmers')
        .upsert([{ parent_id: parentId, swimmer_id: currentUserId }], { onConflict: 'parent_id,swimmer_id' });

      if (linkErr) {
        if (linkErr.code === '23505') {
          return NextResponse.json({ error: 'Tento rodič už je k vašemu účtu připojen.' }, { status: 400 });
        }
        throw linkErr;
      }

      return NextResponse.json({ success: true, message: 'Rodičovský účet byl vytvořen a propojen.' });
    }

    // =========================================================
    // C) PROPOJENÍ S EXISTUJÍCÍM RODIČEM (+ OVĚŘENÍ HESLA)
    // =========================================================
    if (action === 'link_existing_parent') {
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
      const targetSwimmer = targetSwimmerId || currentUserId;

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
        .eq('parent_id', currentUserId)
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
      const targetId = targetSwimmerId || currentUserId;

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

    return NextResponse.json({ error: 'Neznámá akce' }, { status: 400 });

  } catch (err: any) {
    console.error('API Error (/api/family):', err);
    return NextResponse.json({ error: err.message || 'Chyba na serveru' }, { status: 500 });
  }
}