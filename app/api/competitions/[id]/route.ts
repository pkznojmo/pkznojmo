import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rozbalení params pomocí await (nutné od Next.js 15+)
  const { id } = await params;

  try {
    // 1. Paralelní stažení detailu závodu, dokumentů a přihlášek z ČSPS API
    const [compRes, docsRes, appsRes] = await Promise.all([
      fetch(`https://vysledky.czechswimming.cz/cz.zma.csps.portal.rest/api/public/competitions/${id}`),
      fetch(`https://vysledky.czechswimming.cz/cz.zma.csps.portal.rest/api/public/competitions/${id}/documents`),
      fetch(`https://vysledky.czechswimming.cz/cz.zma.csps.portal.rest/api/public/competitions/${id}/applications`)
    ]);

    // Pokud hlavní detail závodu neexistuje / vrátí chybu
    if (!compRes.ok) {
      return NextResponse.json(
        { error: 'Závod nebyl na ČSPS nalezen' },
        { status: compRes.status }
      );
    }

    const competition = await compRes.json();
    const documents = docsRes.ok ? await docsRes.json() : [];
    const applications = appsRes.ok ? await appsRes.json() : null;

    return NextResponse.json({
      competition,
      documents,
      applications
    });

  } catch (error: any) {
    console.error(`Chyba při komunikaci s ČSPS API pro ID ${id}:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}