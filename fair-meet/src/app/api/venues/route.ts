import { NextRequest, NextResponse } from 'next/server';
import { getVenueCounts } from '@/lib/places';

/**
 * API Route: /api/venues
 * Get venue counts near a location
 */
export async function POST(request: NextRequest) {
  try {
    const { lat, lon, radius = 400 } = await request.json();

    if (!lat || !lon) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    const counts = await getVenueCounts(lat, lon, radius);

    return NextResponse.json(counts);
  } catch (error) {
    console.error('Venues API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
