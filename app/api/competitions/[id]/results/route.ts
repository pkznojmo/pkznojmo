import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const normalizeDiscipline = (title: string) => {
  if (!title) return '';
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s\-\.]/g, '');
};

async function fetchAndCacheResults(competitionId: number) {
  const compRes = await fetch(`https://vysledky.czechswimming.cz/cz.zma.csps.portal.rest/api/public/competitions/${competitionId}`, {
    cache: 'no-store'
  });
  if (!compRes.ok) {
    throw new Error('Závod nebyl nalezen na ČSPS');
  }
  const competition = await compRes.json();
  const poolLength = competition.poolLength || 25;

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
      const categories = hd.categoryDtos || hd.competitionCategories || [];
      for (const cat of categories) {
        const catId = cat.id || cat.competitionCategoryId;
        if (!catId) continue;

        resultsMap[catId] = {
          startList: [],
          singleOutputs: [],
          title: cat.title || cat.disciplineTitle || ''
        };

        // 1. STAŽENÍ ŽIVÉ STARTOVNÍ LISTINY
        try {
          let startListData = null;
          // Zkusíme nejdříve novou cestu (korespondující s import-results)
          const startListRes = await fetch(
            `https://vysledky.czechswimming.cz/cz.zma.csps.portal.rest/api/public/competitions/${competitionId}/start-lists/categories/${catId}`,
            { cache: 'no-store' }
          );
          
          if (startListRes.ok) {
            startListData = await startListRes.json();
          } else {
            // Fallback na starší formát cesty pro některé závody
            const fallbackRes = await fetch(
              `https://vysledky.czechswimming.cz/cz.zma.csps.portal.rest/api/public/competitions/${competitionId}/category/${catId}/start-list`,
              { cache: 'no-store' }
            );
            if (fallbackRes.ok) {
              startListData = await fallbackRes.json();
            }
          }

          if (startListData) {
            resultsMap[catId].startList = Array.isArray(startListData) ? startListData : (startListData.startList || startListData.items || []);
          }
        } catch (e) {
          console.error(`Chyba při stahování startovní listiny pro kategorii ${catId}:`, e);
        }

        // 2. STAŽENÍ ŽIVÝCH VÝSLEDKŮ (import-results) S FALLBACKEM NA OFFICIAL OUTPUTS
        let rawOutputs: any[] = [];
        try {
          const liveRes = await fetch(
            `https://vysledky.czechswimming.cz/cz.zma.csps.portal.rest/api/public/competitions/${competitionId}/import-results/categories/${catId}`,
            { cache: 'no-store' }
          );
          
          if (liveRes.ok) {
            const liveData = await liveRes.json();
            rawOutputs = Array.isArray(liveData) ? liveData : (liveData.singleOutputs || liveData.results || []);
          }

          if (!rawOutputs || rawOutputs.length === 0) {
            const officialRes = await fetch(
              `https://vysledky.czechswimming.cz/cz.zma.csps.portal.rest/api/public/competitions/categories/${catId}/outputs`,
              { cache: 'no-store' }
            );
            if (officialRes.ok) {
              const officialData = await officialRes.json();
              rawOutputs = officialData.singleOutputs || (Array.isArray(officialData) ? officialData : []);
            }
          }
        } catch (e) {
          console.error(`Chyba stahování výsledků pro kategorii ${catId}:`, e);
        }

        resultsMap[catId].singleOutputs = rawOutputs;

        // Agregace výsledků pro plavce klubu PKZn
        for (const item of rawOutputs) {
          const clubAbbrev = item.clubAbbrev || item.club || '';
          const isPkzn = ['PKZN'].includes(clubAbbrev.trim().toUpperCase());

          if (isPkzn) {
            const swimmerId = item.userId || item.personId || item.swimmerId || item.competitorId;
            const swimmerName = item.firstName && item.lastName ? `${item.firstName} ${item.lastName}` : (item.user || item.name);
            const key = swimmerId || swimmerName;

            if (!pkznResultsMap[key]) {
              pkznResultsMap[key] = {
                swimmerId,
                firstName: item.firstName || (item.user ? item.user.split(' ')[0] : ''),
                lastName: item.lastName || (item.user ? item.user.split(' ').slice(1).join(' ') : ''),
                birthYear: item.birthYear,
                clubAbbrev: clubAbbrev,
                results: []
              };
            }

            pkznResultsMap[key].results.push({
              catId,
              disciplineTitle: cat.title || cat.disciplineTitle || 'Disciplína',
              time: item.time,
              order: item.order,
              points: item.points,
              heat: item.group || item.heat,
              lane: item.line || item.lane,
              categoryTitle: cat.title || ''
            });
          }
        }
      }
    }
  }

  // Vyhodnocení osobních rekordů pro PKZn plavce
  const processedClubSwimmers = await Promise.all(
    Object.values(pkznResultsMap).map(async (swimmer: any) => {
      let personalBests: any[] = [];
      if (swimmer.swimmerId) {
        try {
          const pbRes = await fetch(
            `https://vysledky.czechswimming.cz/cz.zma.csps.portal.rest/api/public/user-profiles/${swimmer.swimmerId}/outputs?dateTo=${dateTo}&mastersOnly=false`,
            { cache: 'no-store' }
          );
          if (pbRes.ok) {
            personalBests = await pbRes.json();
          }
        } catch (e) {
          console.error(`Chyba stahování osobáků pro plavce ${swimmer.swimmerId}:`, e);
        }
      }

      const evaluatedResults = swimmer.results.map((res: any) => {
        const rawTime = res.time;
        const isDsq = rawTime === 'DSQ' || rawTime === '100:39.99' || rawTime === '99:99.99' || !rawTime || rawTime === '-' || (typeof rawTime === 'number' && (rawTime <= 0 || rawTime > 6000000));
        
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

        if (isDsq) {
          return {
            ...res,
            personalBestTime: bestTime,
            isPersonalBest: false
          };
        }

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

  return payload;
}

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

    const livePayload = await fetchAndCacheResults(competitionId);
    return NextResponse.json(livePayload);
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
    const payload = await fetchAndCacheResults(competitionId);
    return NextResponse.json(payload);
  } catch (error: any) {
    console.error('Chyba při aktualizaci výsledků:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}