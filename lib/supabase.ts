import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Vytvoří se pouze jediná instance pro celý prohlížeč
export const supabase = createClient(supabaseUrl, supabaseAnonKey);