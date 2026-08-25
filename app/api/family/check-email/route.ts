import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Nutné použít Admin Service Role Key
);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'E-mail je povinný.' }, { status: 400 });
    }

    // Ověříme v Supabase Auth, zda e-mail existuje
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) throw error;

    const exists = users.users.some(
      (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
    );

    return NextResponse.json({ exists });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Chyba při kontrole' }, { status: 500 });
  }
}