import { NextRequest, NextResponse } from 'next/server';
import { getJourneyTime } from '@/lib/tfl';

/**
 * API Route: /api/journey
 * Calculate journey time between two stations/locations
 */
export async function POST(request: NextRequest) {
  try {
    const { from, to } = await request.json();

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Both from and to locations are required' },
        { status: 400 }
      );
    }

    const journey = await getJourneyTime(from, to);

    if (!journey) {
      return NextResponse.json(
        { error: 'Could not calculate journey time' },
        { status: 404 }
      );
    }

    return NextResponse.json(journey);
  } catch (error) {
    console.error('Journey API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
