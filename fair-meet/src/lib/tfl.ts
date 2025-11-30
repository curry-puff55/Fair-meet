/**
 * TfL (Transport for London) API Client
 * Documentation: https://api.tfl.gov.uk
 */

const TFL_API_BASE = 'https://api.tfl.gov.uk';

export interface JourneyResult {
  duration: number; // Duration in minutes
  startPoint: string;
  endPoint: string;
}

export interface Station {
  id: string;
  name: string;
  lat: number;
  lon: number;
  modes: string[]; // e.g., ['tube', 'elizabeth-line']
}

/**
 * Calculate journey time between two points
 */
export async function getJourneyTime(
  from: string,
  to: string
): Promise<JourneyResult | null> {
  try {
    const url = `${TFL_API_BASE}/Journey/JourneyResults/${encodeURIComponent(from)}/to/${encodeURIComponent(to)}?mode=tube,elizabeth-line`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error('TfL API error:', response.statusText);
      return null;
    }

    const data = await response.json();

    // Extract the fastest journey duration
    if (data.journeys && data.journeys.length > 0) {
      const journey = data.journeys[0];
      return {
        duration: journey.duration,
        startPoint: from,
        endPoint: to,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching journey time:', error);
    return null;
  }
}

/**
 * Find nearest Tube/Elizabeth Line station to coordinates
 */
export async function findNearestStation(
  lat: number,
  lon: number
): Promise<Station | null> {
  try {
    // Increased to 2000m (2km) to support more postcodes
    const url = `${TFL_API_BASE}/StopPoint?lat=${lat}&lon=${lon}&stopTypes=NaptanMetroStation,NaptanRailStation&radius=2000&modes=tube,elizabeth-line`;

    console.log(`TfL: Finding nearest station to ${lat}, ${lon}`);

    const response = await fetch(url);
    if (!response.ok) {
      console.error('TfL API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('TfL API error response:', errorText);
      return null;
    }

    const data = await response.json();

    console.log(`TfL: Found ${data.stopPoints?.length || 0} stations`);

    if (data.stopPoints && data.stopPoints.length > 0) {
      const stop = data.stopPoints[0];
      console.log(`TfL: Nearest station is ${stop.commonName}`);
      return {
        id: stop.id,
        name: stop.commonName,
        lat: stop.lat,
        lon: stop.lon,
        modes: stop.modes || [],
      };
    }

    console.warn(`TfL: No stations found within 2000m of ${lat}, ${lon}`);
    return null;
  } catch (error) {
    console.error('Error finding nearest station:', error);
    return null;
  }
}

/**
 * Get all major Tube/Elizabeth Line stations in London
 * This can be used to find candidate midpoint stations
 */
export async function getAllStations(): Promise<Station[]> {
  try {
    const url = `${TFL_API_BASE}/StopPoint/Mode/tube,elizabeth-line`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error('TfL API error:', response.statusText);
      return [];
    }

    const data = await response.json();

    return data.stopPoints?.map((stop: any) => ({
      id: stop.id,
      name: stop.commonName,
      lat: stop.lat,
      lon: stop.lon,
      modes: stop.modes || [],
    })) || [];
  } catch (error) {
    console.error('Error fetching stations:', error);
    return [];
  }
}
