import { NextRequest, NextResponse } from 'next/server';
import { geocodeLocation } from '@/lib/geocode';

/**
 * API Route: /api/geocode
 * Converts postcode or location name to coordinates
 */
export async function POST(request: NextRequest) {
  try {
    const { location } = await request.json();

    if (!location || typeof location !== 'string') {
      return NextResponse.json(
        { error: 'Location is required' },
        { status: 400 }
      );
    }

    const coords = await geocodeLocation(location);

    if (!coords) {
      return NextResponse.json(
        { error: 'Could not geocode location. Please check the postcode or location name.' },
        { status: 404 }
      );
    }

    return NextResponse.json(coords);
  } catch (error) {
    console.error('Geocode API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
