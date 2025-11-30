/**
 * Google Places API Client
 * Documentation: https://developers.google.com/maps/documentation/places
 */

export interface Venue {
  id: string;
  name: string;
  type: 'cafe' | 'pub' | 'restaurant';
  rating?: number;
  priceLevel?: number;
  distance?: number; // meters from station
  lat: number;
  lon: number;
}

export interface VenueCounts {
  cafes: number;
  pubs: number;
  restaurants: number;
  total: number;
}

/**
 * Search for venues near a location
 * NOTE: Requires GOOGLE_PLACES_API_KEY environment variable
 */
export async function searchNearbyVenues(
  lat: number,
  lon: number,
  type: 'cafe' | 'bar' | 'restaurant',
  radius: number = 400 // 400m = ~5 min walk
): Promise<Venue[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn('GOOGLE_PLACES_API_KEY not set');
    return [];
  }

  try {
    // Using Places API (New)
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radius}&type=${type}&key=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error('Places API error:', response.statusText);
      return [];
    }

    const data = await response.json();

    return data.results?.map((place: any) => ({
      id: place.place_id,
      name: place.name,
      type: type === 'bar' ? 'pub' : type,
      rating: place.rating,
      priceLevel: place.price_level,
      lat: place.geometry.location.lat,
      lon: place.geometry.location.lng,
    })) || [];
  } catch (error) {
    console.error('Error searching venues:', error);
    return [];
  }
}

/**
 * Get venue counts for a station
 */
export async function getVenueCounts(
  lat: number,
  lon: number,
  radius: number = 400
): Promise<VenueCounts> {
  const [cafes, pubs, restaurants] = await Promise.all([
    searchNearbyVenues(lat, lon, 'cafe', radius),
    searchNearbyVenues(lat, lon, 'bar', radius),
    searchNearbyVenues(lat, lon, 'restaurant', radius),
  ]);

  return {
    cafes: cafes.length,
    pubs: pubs.length,
    restaurants: restaurants.length,
    total: cafes.length + pubs.length + restaurants.length,
  };
}

/**
 * Calculate venue score for a station
 * Used in the fairness algorithm
 */
export function calculateVenueScore(counts: VenueCounts): number {
  // Weight cafes higher per PRD
  return (counts.cafes * 2 + counts.pubs * 1.5 + counts.restaurants * 1) / 10;
}
