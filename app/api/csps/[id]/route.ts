import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'outputs'; // 'outputs' nebo 'competitions'

  try {
    const response = await fetch(
      `https://vysledky.czechswimming.cz/cz.zma.csps.portal.rest/api/public/user-profiles/${id}/${type}?mastersOnly=false`
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Chyba při komunikaci s ČSPS API' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Interní chyba serveru' },
      { status: 500 }
    );
  }
}