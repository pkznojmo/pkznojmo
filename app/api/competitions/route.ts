import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year') || '2026';

  try {
    const response = await fetch(`https://vysledky.czechswimming.cz/cz.zma.csps.portal.rest/api/public/competitions?year=${year}`, {
      next: { revalidate: 3600 }, // Mezipaměť na 1 hodinu (volitelné)
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Chyba při komunikaci s ČSPS API' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Interní chyba serveru' }, { status: 500 });
  }
}