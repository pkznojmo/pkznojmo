import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const competitionId = Number(id);

  try {
    // 1. Zkusíme VŽDY stáhnout nejnovější strukturu z ČSPS API (aby nechyběly nově přidané disciplíny jako Mix)
    const compRes = await fetch(`https://vysledky.czechswimming.cz/cz.zma.csps.portal.rest/api/public/competitions/${competitionId}`, {
      cache: 'no-store' // Vynucení aktuálních dat
    });

    if (compRes.ok) {
      const competition = await compRes.json();
      const documents = competition.documents || competition.files || [];

      let applications = null;
      try {
        const appRes = await fetch(`https://vysledky.czechswimming.cz/cz.zma.csps.portal.rest/api/public/competitions/${competitionId}/applications`, {
          cache: 'no-store'
        });
        if (appRes.ok) {
          applications = await appRes.json();
        }
      } catch (e) {
        // Ignorovat, pokud přihlášky nejsou dostupné
      }

      const payload = {
        competition,
        documents,
        applications
      };

      // 2. Uložíme stažená, čerstvá data do vaší databáze na pozadí pro případný fallback v budoucnu
      await supabase
        .from('club_competitions')
        .upsert({
          competition_id: competitionId,
          competition_cache: payload,
          updated_at: new Date().toISOString()
        }, { onConflict: 'competition_id' });

      return NextResponse.json(payload);
    }

    // 3. FALLBACK: Pokud server ČSPS neodpovídá, sáhneme do naší databáze
    const { data: cachedData } = await supabase
      .from('club_competitions')
      .select('competition_cache')
      .eq('competition_id', competitionId)
      .maybeSingle();

    if (cachedData && cachedData.competition_cache) {
      return NextResponse.json(cachedData.competition_cache);
    }

    return NextResponse.json({ error: 'Závod nebyl nalezen na ČSPS ani v lokální databázi' }, { status: 404 });

  } catch (error: any) {
    console.error('Chyba při načítání detailu závodu:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}