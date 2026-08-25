import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ cspsId: string }> }
) {
  // V Next.js 15 je params Promise, musíme počkat na vyřešení
  const { cspsId } = await params;

  if (!cspsId) {
    return NextResponse.json({ error: 'Missing CSPS ID' }, { status: 400 });
  }

  try {
    const targetUrl = `https://vysledky.czechswimming.cz/cz.zma.csps.portal.rest/api/public/user-profiles/${cspsId}/outputs?mastersOnly=false`;

    const res = await fetch(targetUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      next: { revalidate: 3600 }, // Cache na 1 hodinu
    });

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json([]);
      }
      return NextResponse.json(
        { error: `CSPS API status: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching CSPS outputs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CSPS data', details: error?.message },
      { status: 500 }
    );
  }
}