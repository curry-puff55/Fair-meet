/**
 * Google Places API Client for Venue Discovery
 * Documentation: https://developers.google.com/maps/documentation/places
 */

// In-memory cache for venue searches
interface CacheEntry {
  data: Venue[];
  timestamp: number;
}

const venueCache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Generate cache key for venue search
 * Rounds coordinates to 2 decimals (~1km precision) to group nearby searches
 * This means venues within ~1km will share the same cache entry
 */
function getCacheKey(lat: number, lon: number, type: string): string {
  return `${lat.toFixed(2)}:${lon.toFixed(2)}:${type}`;
}

/**
 * Clean up expired cache entries
 */
function cleanupCache(): void {
  const now = Date.now();
  const expiredKeys: string[] = [];

  venueCache.forEach((entry, key) => {
    if (now - entry.timestamp > CACHE_TTL) {
      expiredKeys.push(key);
    }
  });

  expiredKeys.forEach(key => venueCache.delete(key));

  if (expiredKeys.length > 0) {
    console.log(`[Cache] Cleaned up ${expiredKeys.length} expired entries`);
  }
}

// Run cleanup every hour
setInterval(cleanupCache, 60 * 60 * 1000);

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Convert distance in meters to walking time in minutes
 * Assumes average walking speed of 5 km/h (83.3 m/min)
 */
export function getWalkingTime(distanceInMeters: number): number {
  const walkingSpeedMPerMin = 83.3; // 5 km/h = 83.3 m/min
  return Math.round(distanceInMeters / walkingSpeedMPerMin);
}

export type VenueType =
  | 'cafe'
  | 'restaurant'
  | 'bar'
  | 'night_club'
  | 'movie_theater'
  | 'bowling_alley'
  | 'museum'
  | 'art_gallery'
  | 'park'
  | 'shopping_mall'
  | 'casino'
  | 'stadium'
  | 'gym'
  | 'amusement_park'
  | 'aquarium'
  | 'zoo'
  | 'library'
  | 'tourist_attraction'
  | 'performing_arts_theater'
  | 'opera_house'
  | 'concert_hall'
  | 'philharmonic_hall'
  | 'auditorium'
  | 'comedy_club'
  | 'dance_hall'
  | 'amphitheatre'
  | 'cultural_center'
  | 'cultural_landmark'
  | 'art_studio'
  | 'event_venue';

export interface Venue {
  id: string;
  name: string;
  type: VenueType;
  category: 'food' | 'activity';
  rating?: number;
  priceLevel?: number;
  distance?: number;
  address?: string;
  lat: number;
  lon: number;
}

export interface VenueCounts {
  cafes: number;
  restaurants: number;
  bars: number;
  nightClubs: number;
  movieTheaters: number;
  bowlingAlleys: number;
  museums: number;
  artGalleries: number;
  parks: number;
  shoppingMalls: number;
  casinos: number;
  stadiums: number;
  gyms: number;
  amusementParks: number;
  aquariums: number;
  zoos: number;
  libraries: number;
  touristAttractions: number;
  performingArtsTheaters: number;
  operaHouses: number;
  concertHalls: number;
  philharmonicHalls: number;
  auditoriums: number;
  comedyClubs: number;
  danceHalls: number;
  amphitheatres: number;
  culturalCenters: number;
  culturalLandmarks: number;
  artStudios: number;
  eventVenues: number;
  total: number;
}

export interface VenueFilters {
  cafes?: boolean;
  restaurants?: boolean;
  bars?: boolean;
  nightClubs?: boolean;
  movieTheaters?: boolean;
  bowlingAlleys?: boolean;
  museums?: boolean;
  artGalleries?: boolean;
  parks?: boolean;
  shoppingMalls?: boolean;
  casinos?: boolean;
  stadiums?: boolean;
  gyms?: boolean;
  amusementParks?: boolean;
  aquariums?: boolean;
  zoos?: boolean;
  libraries?: boolean;
  touristAttractions?: boolean;
  performingArtsTheaters?: boolean;
  operaHouses?: boolean;
  concertHalls?: boolean;
  philharmonicHalls?: boolean;
  auditoriums?: boolean;
  comedyClubs?: boolean;
  danceHalls?: boolean;
  amphitheatres?: boolean;
  culturalCenters?: boolean;
  culturalLandmarks?: boolean;
  artStudios?: boolean;
  eventVenues?: boolean;
}

/**
 * Search for venues near a location using Google Places API
 * Uses in-memory cache with 24-hour TTL to reduce API calls
 */
export async function searchNearbyVenues(
  lat: number,
  lon: number,
  type: VenueType,
  radius: number = 400
): Promise<Venue[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn('GOOGLE_PLACES_API_KEY not set');
    return [];
  }

  // Check cache first
  const cacheKey = getCacheKey(lat, lon, type);
  const cached = venueCache.get(cacheKey);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    console.log(`[Cache HIT] ${type} venues near ${lat.toFixed(3)}, ${lon.toFixed(3)}`);
    return cached.data;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radius}&type=${type}&key=${apiKey}`;

    console.log(`[Cache MISS] Fetching ${type} venues near ${lat}, ${lon}`);

    const response = await fetch(url);
    if (!response.ok) {
      console.error('Places API error:', response.statusText);
      return [];
    }

    const data = await response.json();

    if (data.status === 'REQUEST_DENIED') {
      console.error('Places API request denied:', data.error_message);
      return [];
    }

    const category = ['cafe', 'restaurant', 'bar', 'night_club'].includes(type)
      ? 'food'
      : 'activity';

    const venues = data.results?.slice(0, 10).map((place: any) => {
      const venueLat = place.geometry.location.lat;
      const venueLon = place.geometry.location.lng;
      const distance = calculateDistance(lat, lon, venueLat, venueLon);

      return {
        id: place.place_id,
        name: place.name,
        type: type,
        category,
        rating: place.rating,
        priceLevel: place.price_level,
        address: place.vicinity,
        lat: venueLat,
        lon: venueLon,
        distance: Math.round(distance), // Store distance in meters
      };
    }) || [];

    // Store in cache
    venueCache.set(cacheKey, {
      data: venues,
      timestamp: now,
    });

    console.log(`[Cache] Stored ${venues.length} ${type} venues (cache size: ${venueCache.size})`);

    return venues;
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
  radius: number = 400,
  filters?: VenueFilters
): Promise<VenueCounts> {
  // Build array of fetch promises based on filters
  const fetchPromises: Promise<Venue[]>[] = [];
  const enabledTypes: string[] = [];

  if (filters?.cafes !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'cafe', radius));
    enabledTypes.push('cafes');
  } else {
    fetchPromises.push(Promise.resolve([]));
    enabledTypes.push('cafes');
  }

  if (filters?.restaurants !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'restaurant', radius));
    enabledTypes.push('restaurants');
  } else {
    fetchPromises.push(Promise.resolve([]));
    enabledTypes.push('restaurants');
  }

  if (filters?.bars !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'bar', radius));
    enabledTypes.push('bars');
  } else {
    fetchPromises.push(Promise.resolve([]));
    enabledTypes.push('bars');
  }

  if (filters?.nightClubs !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'night_club', radius));
    enabledTypes.push('nightClubs');
  } else {
    fetchPromises.push(Promise.resolve([]));
    enabledTypes.push('nightClubs');
  }

  if (filters?.movieTheaters !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'movie_theater', radius));
    enabledTypes.push('movieTheaters');
  } else {
    fetchPromises.push(Promise.resolve([]));
    enabledTypes.push('movieTheaters');
  }

  if (filters?.bowlingAlleys !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'bowling_alley', radius));
    enabledTypes.push('bowlingAlleys');
  } else {
    fetchPromises.push(Promise.resolve([]));
    enabledTypes.push('bowlingAlleys');
  }

  if (filters?.museums !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'museum', radius));
    enabledTypes.push('museums');
  } else {
    fetchPromises.push(Promise.resolve([]));
    enabledTypes.push('museums');
  }

  if (filters?.artGalleries !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'art_gallery', radius));
    enabledTypes.push('artGalleries');
  } else {
    fetchPromises.push(Promise.resolve([]));
    enabledTypes.push('artGalleries');
  }

  if (filters?.parks !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'park', radius));
    enabledTypes.push('parks');
  } else {
    fetchPromises.push(Promise.resolve([]));
    enabledTypes.push('parks');
  }

  if (filters?.shoppingMalls !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'shopping_mall', radius));
    enabledTypes.push('shoppingMalls');
  } else {
    fetchPromises.push(Promise.resolve([]));
    enabledTypes.push('shoppingMalls');
  }

  if (filters?.casinos !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'casino', radius));
    enabledTypes.push('casinos');
  } else {
    fetchPromises.push(Promise.resolve([]));
    enabledTypes.push('casinos');
  }

  if (filters?.stadiums !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'stadium', radius));
    enabledTypes.push('stadiums');
  } else {
    fetchPromises.push(Promise.resolve([]));
    enabledTypes.push('stadiums');
  }

  if (filters?.gyms !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'gym', radius));
    enabledTypes.push('gyms');
  } else {
    fetchPromises.push(Promise.resolve([]));
    enabledTypes.push('gyms');
  }

  if (filters?.amusementParks !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'amusement_park', radius));
    enabledTypes.push('amusementParks');
  } else {
    fetchPromises.push(Promise.resolve([]));
    enabledTypes.push('amusementParks');
  }

  if (filters?.aquariums !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'aquarium', radius));
    enabledTypes.push('aquariums');
  } else {
    fetchPromises.push(Promise.resolve([]));
    enabledTypes.push('aquariums');
  }

  if (filters?.zoos !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'zoo', radius));
    enabledTypes.push('zoos');
  } else {
    fetchPromises.push(Promise.resolve([]));
    enabledTypes.push('zoos');
  }

  if (filters?.libraries !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'library', radius));
    enabledTypes.push('libraries');
  } else {
    fetchPromises.push(Promise.resolve([]));
    enabledTypes.push('libraries');
  }

  if (filters?.touristAttractions !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'tourist_attraction', radius));
    enabledTypes.push('touristAttractions');
  } else {
    fetchPromises.push(Promise.resolve([]));
    enabledTypes.push('touristAttractions');
  }

  if (filters?.performingArtsTheaters !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'performing_arts_theater', radius));
    enabledTypes.push('performingArtsTheaters');
  } else {
    fetchPromises.push(Promise.resolve([]));
    enabledTypes.push('performingArtsTheaters');
  }

  if (filters?.operaHouses !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'opera_house', radius));
    enabledTypes.push('operaHouses');
  } else {
    fetchPromises.push(Promise.resolve([]));
    enabledTypes.push('operaHouses');
  }

  if (filters?.concertHalls !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'concert_hall', radius));
    enabledTypes.push('concertHalls');
  } else {
    fetchPromises.push(Promise.resolve([]));
    enabledTypes.push('concertHalls');
  }

  if (filters?.philharmonicHalls !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'philharmonic_hall', radius));
    enabledTypes.push('philharmonicHalls');
  } else {
    fetchPromises.push(Promise.resolve([]));
    enabledTypes.push('philharmonicHalls');
  }

  if (filters?.auditoriums !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'auditorium', radius));
    enabledTypes.push('auditoriums');
  } else {
    fetchPromises.push(Promise.resolve([]));
    enabledTypes.push('auditoriums');
  }

  if (filters?.comedyClubs !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'comedy_club', radius));
    enabledTypes.push('comedyClubs');
  } else {
    fetchPromises.push(Promise.resolve([]));
    enabledTypes.push('comedyClubs');
  }

  if (filters?.danceHalls !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'dance_hall', radius));
    enabledTypes.push('danceHalls');
  } else {
    fetchPromises.push(Promise.resolve([]));
    enabledTypes.push('danceHalls');
  }

  if (filters?.amphitheatres !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'amphitheatre', radius));
    enabledTypes.push('amphitheatres');
  } else {
    fetchPromises.push(Promise.resolve([]));
    enabledTypes.push('amphitheatres');
  }

  if (filters?.culturalCenters !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'cultural_center', radius));
    enabledTypes.push('culturalCenters');
  } else {
    fetchPromises.push(Promise.resolve([]));
    enabledTypes.push('culturalCenters');
  }

  if (filters?.culturalLandmarks !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'cultural_landmark', radius));
    enabledTypes.push('culturalLandmarks');
  } else {
    fetchPromises.push(Promise.resolve([]));
    enabledTypes.push('culturalLandmarks');
  }

  if (filters?.artStudios !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'art_studio', radius));
    enabledTypes.push('artStudios');
  } else {
    fetchPromises.push(Promise.resolve([]));
    enabledTypes.push('artStudios');
  }

  if (filters?.eventVenues !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'event_venue', radius));
    enabledTypes.push('eventVenues');
  } else {
    fetchPromises.push(Promise.resolve([]));
    enabledTypes.push('eventVenues');
  }

  const [
    cafes,
    restaurants,
    bars,
    nightClubs,
    movieTheaters,
    bowlingAlleys,
    museums,
    artGalleries,
    parks,
    shoppingMalls,
    casinos,
    stadiums,
    gyms,
    amusementParks,
    aquariums,
    zoos,
    libraries,
    touristAttractions,
    performingArtsTheaters,
    operaHouses,
    concertHalls,
    philharmonicHalls,
    auditoriums,
    comedyClubs,
    danceHalls,
    amphitheatres,
    culturalCenters,
    culturalLandmarks,
    artStudios,
    eventVenues,
  ] = await Promise.all(fetchPromises);

  return {
    cafes: cafes.length,
    restaurants: restaurants.length,
    bars: bars.length,
    nightClubs: nightClubs.length,
    movieTheaters: movieTheaters.length,
    bowlingAlleys: bowlingAlleys.length,
    museums: museums.length,
    artGalleries: artGalleries.length,
    parks: parks.length,
    shoppingMalls: shoppingMalls.length,
    casinos: casinos.length,
    stadiums: stadiums.length,
    gyms: gyms.length,
    amusementParks: amusementParks.length,
    aquariums: aquariums.length,
    zoos: zoos.length,
    libraries: libraries.length,
    touristAttractions: touristAttractions.length,
    performingArtsTheaters: performingArtsTheaters.length,
    operaHouses: operaHouses.length,
    concertHalls: concertHalls.length,
    philharmonicHalls: philharmonicHalls.length,
    auditoriums: auditoriums.length,
    comedyClubs: comedyClubs.length,
    danceHalls: danceHalls.length,
    amphitheatres: amphitheatres.length,
    culturalCenters: culturalCenters.length,
    culturalLandmarks: culturalLandmarks.length,
    artStudios: artStudios.length,
    eventVenues: eventVenues.length,
    total:
      cafes.length +
      restaurants.length +
      bars.length +
      nightClubs.length +
      movieTheaters.length +
      bowlingAlleys.length +
      museums.length +
      artGalleries.length +
      parks.length +
      shoppingMalls.length +
      casinos.length +
      stadiums.length +
      gyms.length +
      amusementParks.length +
      aquariums.length +
      zoos.length +
      libraries.length +
      touristAttractions.length +
      performingArtsTheaters.length +
      operaHouses.length +
      concertHalls.length +
      philharmonicHalls.length +
      auditoriums.length +
      comedyClubs.length +
      danceHalls.length +
      amphitheatres.length +
      culturalCenters.length +
      culturalLandmarks.length +
      artStudios.length +
      eventVenues.length,
  };
}

/**
 * Get all venues (food + activities) near a station
 */
export async function getAllVenues(
  lat: number,
  lon: number,
  radius: number = 400,
  filters?: VenueFilters
): Promise<Venue[]> {
  const fetchPromises: Promise<Venue[]>[] = [];

  if (filters?.cafes !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'cafe', radius));
  }
  if (filters?.restaurants !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'restaurant', radius));
  }
  if (filters?.bars !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'bar', radius));
  }
  if (filters?.nightClubs !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'night_club', radius));
  }
  if (filters?.movieTheaters !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'movie_theater', radius));
  }
  if (filters?.bowlingAlleys !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'bowling_alley', radius));
  }
  if (filters?.museums !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'museum', radius));
  }
  if (filters?.artGalleries !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'art_gallery', radius));
  }
  if (filters?.parks !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'park', radius));
  }
  if (filters?.shoppingMalls !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'shopping_mall', radius));
  }
  if (filters?.casinos !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'casino', radius));
  }
  if (filters?.stadiums !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'stadium', radius));
  }
  if (filters?.gyms !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'gym', radius));
  }
  if (filters?.amusementParks !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'amusement_park', radius));
  }
  if (filters?.aquariums !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'aquarium', radius));
  }
  if (filters?.zoos !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'zoo', radius));
  }
  if (filters?.libraries !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'library', radius));
  }
  if (filters?.touristAttractions !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'tourist_attraction', radius));
  }
  if (filters?.performingArtsTheaters !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'performing_arts_theater', radius));
  }
  if (filters?.operaHouses !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'opera_house', radius));
  }
  if (filters?.concertHalls !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'concert_hall', radius));
  }
  if (filters?.philharmonicHalls !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'philharmonic_hall', radius));
  }
  if (filters?.auditoriums !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'auditorium', radius));
  }
  if (filters?.comedyClubs !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'comedy_club', radius));
  }
  if (filters?.danceHalls !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'dance_hall', radius));
  }
  if (filters?.amphitheatres !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'amphitheatre', radius));
  }
  if (filters?.culturalCenters !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'cultural_center', radius));
  }
  if (filters?.culturalLandmarks !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'cultural_landmark', radius));
  }
  if (filters?.artStudios !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'art_studio', radius));
  }
  if (filters?.eventVenues !== false) {
    fetchPromises.push(searchNearbyVenues(lat, lon, 'event_venue', radius));
  }

  const results = await Promise.all(fetchPromises);
  return results.flat();
}

/**
 * Calculate venue score for a station
 * All venue types are weighted equally - users can filter by preference
 */
export function calculateVenueScore(counts: VenueCounts): number {
  // Equal weighting for all venue types
  return counts.total / 10;
}
