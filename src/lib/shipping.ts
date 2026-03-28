/**
 * Shipping cost calculation utilities for Singapore domestic delivery.
 *
 * Uses the Haversine formula for distance calculation and tiered rates
 * based on SingPost domestic parcel pricing.
 *
 * Geocoding is done via the free OneMap API (Singapore Land Authority)
 * which requires no API key for basic search.
 */

export interface ShippingTier {
  cost: number;
  tier: string;
  estimate: string;
}

export interface GeocodingResult {
  lat: number;
  lon: number;
  address: string;
  blockNo: string;
  roadName: string;
  building: string;
  postalCode: string;
}

interface OneMapSearchResult {
  LATITUDE: string;
  LONGITUDE: string;
  ADDRESS: string;
  POSTAL: string;
  BLK_NO: string;
  ROAD_NAME: string;
  BUILDING: string;
}

interface OneMapResponse {
  found: number;
  totalNumPages: number;
  pageNum: number;
  results: OneMapSearchResult[];
}

/**
 * Calculate the great-circle distance between two points using the Haversine formula.
 * @returns Distance in kilometers
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Map a distance to a shipping cost tier based on SingPost domestic rates.
 */
export function getShippingCost(distanceKm: number): ShippingTier {
  if (distanceKm < 5) {
    return { cost: 3.5, tier: "Same Area", estimate: "2-3 business days" };
  }
  if (distanceKm < 15) {
    return { cost: 5.0, tier: "Standard", estimate: "3-5 business days" };
  }
  return { cost: 6.5, tier: "Cross-Island", estimate: "5-7 business days" };
}

/**
 * Geocode a Singapore postal code using the free OneMap API.
 * No API key required for basic search.
 *
 * @see https://www.onemap.gov.sg/apidocs/
 */
export async function geocodePostalCode(
  postalCode: string,
): Promise<GeocodingResult | null> {
  try {
    const url = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(postalCode)}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;
    const res = await fetch(url);

    if (!res.ok) return null;

    const data = (await res.json()) as OneMapResponse;

    if (data.found === 0 || data.results.length === 0) return null;

    const result = data.results[0]!;
    return {
      lat: parseFloat(result.LATITUDE),
      lon: parseFloat(result.LONGITUDE),
      address: result.ADDRESS,
      blockNo: result.BLK_NO,
      roadName: result.ROAD_NAME,
      building: result.BUILDING === "NIL" ? "" : result.BUILDING,
      postalCode: result.POSTAL,
    };
  } catch (error) {
    console.error("OneMap geocoding error:", error);
    return null;
  }
}
