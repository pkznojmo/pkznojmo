import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Pomocná funkce pro normalizaci názvů disciplín pro spolehlivé párování osobáků
const normalizeDiscipline = (title: string) => {
  if (!title) return '';
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // odstranění diakritiky
    .replace(/[\s\-\.]/g, '');       // odstranění mezer, pomlček a teček
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const competitionId = Number(id);

  try {
    const { data: clubData } = await supabase
      .from('club_competitions')
      .select('results_cache')
      .eq('competition_id', competitionId)
      .maybeSingle();

    if (clubData && clubData.results_cache) {
      return NextResponse.json(clubData.results_cache);
    }

    return NextResponse.json({ competition: null, results: {}, clubSwimmers: [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const competitionId = Number(id);

  try {
    const compRes = await fetch(`https://vysledky.czechswimming.cz/cz.zma.csps.portal.rest/api/public/competitions/${competitionId}`);
    if (!compRes.ok) {
      return NextResponse.json({ error: 'Závod nebyl nalezen na ČSPS' }, { status: 404 });
    }
    const competition = await compRes.json();
    const poolLength = competition.poolLength || 25;

    // Datum 1 den před začátkem závodu pro výpočet osobáků
    let dateTo = '2033-05-04';
    if (competition.competitionStartDate) {
      const startDate = new Date(competition.competitionStartDate);
      startDate.setDate(startDate.getDate() - 1);
      dateTo = startDate.toISOString().split('T')[0];
    }

    const resultsMap: Record<string, any> = {};
    const pkznResultsMap: Record<string, any> = {};

    if (competition.halfDayDtos && Array.isArray(competition.halfDayDtos)) {
      for (const hd of competition.halfDayDtos) {
        if (hd.categoryDtos && Array.isArray(hd.categoryDtos)) {
          for (const cat of hd.categoryDtos) {
            const catId = cat.id || cat.competitionCategoryId;
            if (catId) {
              try {
                const res = await fetch(`https://vysledky.czechswimming.cz/cz.zma.csps.portal.rest/api/public/competitions/categories/${catId}/outputs`);
                if (res.ok) {
                  const data = await res.json();
                  resultsMap[catId] = data;

                  const outputs = data.singleOutputs || [];
                  for (const item of outputs) {
                    if (item.clubAbbrev === 'PKZn') {
                      const swimmerId = item.userId || item.personId || item.swimmerId;
                      const swimmerName = `${item.firstName} ${item.lastName}`;
                      const key = swimmerId || swimmerName;

                      if (!pkznResultsMap[key]) {
                        pkznResultsMap[key] = {
                          swimmerId,
                          firstName: item.firstName,
                          lastName: item.lastName,
                          birthYear: item.birthYear,
                          clubAbbrev: item.clubAbbrev,
                          results: []
                        };
                      }

                      pkznResultsMap[key].results.push({
                        disciplineTitle: cat.title || cat.disciplineTitle || 'Disciplína',
                        time: item.time,
                        order: item.order,
                        points: item.points,
                        categoryTitle: cat.title || ''
                      });
                    }
                  }
                }
              } catch (e) {
                console.error(`Chyba stahování kategorie ${catId}:`, e);
              }
            }
          }
        }
      }
    }

    // Stažení osobáků pro každého PKZn plavce z intranet API a robustní porovnání
    const processedClubSwimmers = await Promise.all(
      Object.values(pkznResultsMap).map(async (swimmer: any) => {
        let personalBests: any[] = [];
        if (swimmer.swimmerId) {
          try {
            const pbRes = await fetch(`https://vysledky.czechswimming.cz/cz.zma.csps.portal.rest/api/public/user-profiles/${swimmer.swimmerId}/outputs?dateTo=${dateTo}&mastersOnly=false`);
            if (pbRes.ok) {
              personalBests = await pbRes.json();
            }
          } catch (e) {
            console.error(`Chyba stahování osobáků pro plavce ${swimmer.swimmerId}:`, e);
          }
        }

        const evaluatedResults = swimmer.results.map((res: any) => {
          // 1. Kontrola platnosti času (vyřazení DSQ, DNS, null, záporných nebo neplatných hodnot)
          const rawTime = res.time;
          const isDsq = rawTime === 'DSQ' || rawTime === '100:39.99' || rawTime === '99:99.99' || !rawTime || rawTime === '-' || (typeof rawTime === 'number' && (rawTime <= 0 || rawTime > 6000000));
          
          // Párování s osobáky pomocí normalizovaného názvu disciplíny a délky bazénu
          const normalizedResDisc = normalizeDiscipline(res.disciplineTitle);
          const matchingPbs = personalBests.filter((pb: any) => {
            const pbTitle = pb.disciplineTitle || pb.disciplineName || '';
            const matchesDiscipline = normalizeDiscipline(pbTitle) === normalizedResDisc;
            const matchesPool = pb.poolLength === poolLength || pb.course === poolLength || (poolLength === 25 ? pb.is25m : pb.is50m);
            return matchesDiscipline && matchesPool;
          });

          let bestTime = null;
          if (matchingPbs.length > 0) {
            const times = matchingPbs.map((pb: any) => pb.time).filter((t: number) => t > 0);
            if (times.length > 0) {
              bestTime = Math.min(...times);
            }
          }

          // Pokud plavec plaval DSQ nebo neplatný čas, osobák to nikdy není
          if (isDsq) {
            return {
              ...res,
              personalBestTime: bestTime,
              isPersonalBest: false
            };
          }

          // 3. Vyhodnocení osobáku: Nový čas musí být přísně menší než dosavadní osobák
          const isPersonalBest = bestTime !== null && res.time < bestTime;

          return {
            ...res,
            personalBestTime: bestTime,
            isPersonalBest
          };
        });

        return {
          ...swimmer,
          results: evaluatedResults
        };
      })
    );

    const payload = {
      competition,
      results: resultsMap,
      clubSwimmers: processedClubSwimmers,
      updatedAt: new Date().toISOString()
    };

    await supabase
      .from('club_competitions')
      .upsert({
        competition_id: competitionId,
        results_cache: payload,
        updated_at: new Date().toISOString()
      }, { onConflict: 'competition_id' });

    return NextResponse.json(payload);

  } catch (error: any) {
    console.error('Chyba při aktualizaci výsledků:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}