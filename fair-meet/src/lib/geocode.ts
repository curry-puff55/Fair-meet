/**
 * Geocoding utilities using Postcode.io (free, no auth required)
 * Documentation: https://postcodes.io
 */

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface PostcodeResult {
  postcode: string;
  latitude: number;
  longitude: number;
  admin_district?: string;
  parish?: string;
}

/**
 * Convert UK postcode to lat/lon coordinates
 * Uses Postcode.io API (free, no auth required)
 */
export async function postcodeToCoords(
  postcode: string
): Promise<Coordinates | null> {
  try {
    // Clean postcode (remove spaces, uppercase)
    const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase();

    const url = `https://api.postcodes.io/postcodes/${encodeURIComponent(cleanPostcode)}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error('Postcode.io error:', response.statusText);
      return null;
    }

    const data = await response.json();

    if (data.status === 200 && data.result) {
      return {
        lat: data.result.latitude,
        lon: data.result.longitude,
      };
    }

    return null;
  } catch (error) {
    console.error('Error geocoding postcode:', error);
    return null;
  }
}

/**
 * Validate UK postcode format (accepts with or without space)
 */
export function isValidPostcode(postcode: string): boolean {
  // UK postcode regex pattern - accepts both "SW1V 4JN" and "SW1V4JN"
  const postcodeRegex = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}$/i;
  return postcodeRegex.test(postcode.trim());
}

/**
 * Check if location string is a postcode or place name
 */
export function isPostcode(location: string): boolean {
  return isValidPostcode(location);
}

/**
 * Geocode a location (UK postcodes only via Postcode.io)
 */
export async function geocodeLocation(
  location: string
): Promise<Coordinates | null> {
  // Only support UK postcodes for now (free via Postcode.io)
  if (!isPostcode(location)) {
    console.warn(`Location is not a valid UK postcode: ${location}`);
    return null;
  }

  console.log(`Geocoding postcode: ${location}`);
  const coords = await postcodeToCoords(location);

  if (coords) {
    console.log(`Postcode geocoded successfully: ${coords.lat}, ${coords.lon}`);
    return coords;
  }

  return null;
}
