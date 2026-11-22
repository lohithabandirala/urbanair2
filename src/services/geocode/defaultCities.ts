import type { Place } from "./types";

/**
 * Curated offline fallback cities across Indian states and union territories.
 * Ensures location search functions seamlessly when upstream geocoders are
 * offline or rate-limited. Coordinates are official city-centre benchmarks.
 */
export const FALLBACK_CITIES: ReadonlyArray<Place> = [
  { name: "Delhi", region: "Delhi", country: "India", countryCode: "IN", latitude: 28.6139, longitude: 77.209, timezone: "Asia/Kolkata" },
  { name: "Mumbai", region: "Maharashtra", country: "India", countryCode: "IN", latitude: 19.076, longitude: 72.8777, timezone: "Asia/Kolkata" },
  { name: "Bengaluru", region: "Karnataka", country: "India", countryCode: "IN", latitude: 12.9716, longitude: 77.5946, timezone: "Asia/Kolkata" },
  { name: "Chennai", region: "Tamil Nadu", country: "India", countryCode: "IN", latitude: 13.0827, longitude: 80.2707, timezone: "Asia/Kolkata" },
  { name: "Kolkata", region: "West Bengal", country: "India", countryCode: "IN", latitude: 22.5726, longitude: 88.3639, timezone: "Asia/Kolkata" },
  { name: "Hyderabad", region: "Telangana", country: "India", countryCode: "IN", latitude: 17.385, longitude: 78.4867, timezone: "Asia/Kolkata" },
  { name: "Pune", region: "Maharashtra", country: "India", countryCode: "IN", latitude: 18.5204, longitude: 73.8567, timezone: "Asia/Kolkata" },
  { name: "Ahmedabad", region: "Gujarat", country: "India", countryCode: "IN", latitude: 23.0225, longitude: 72.5714, timezone: "Asia/Kolkata" },
  { name: "Jaipur", region: "Rajasthan", country: "India", countryCode: "IN", latitude: 26.9124, longitude: 75.7873, timezone: "Asia/Kolkata" },
  { name: "Lucknow", region: "Uttar Pradesh", country: "India", countryCode: "IN", latitude: 26.8467, longitude: 80.9462, timezone: "Asia/Kolkata" },
  { name: "Kanpur", region: "Uttar Pradesh", country: "India", countryCode: "IN", latitude: 26.4499, longitude: 80.3319, timezone: "Asia/Kolkata" },
  { name: "Varanasi", region: "Uttar Pradesh", country: "India", countryCode: "IN", latitude: 25.3176, longitude: 82.9739, timezone: "Asia/Kolkata" },
  { name: "Patna", region: "Bihar", country: "India", countryCode: "IN", latitude: 25.5941, longitude: 85.1376, timezone: "Asia/Kolkata" },
  { name: "Chandigarh", region: "Chandigarh", country: "India", countryCode: "IN", latitude: 30.7333, longitude: 76.7794, timezone: "Asia/Kolkata" },
  { name: "Gurugram", region: "Haryana", country: "India", countryCode: "IN", latitude: 28.4595, longitude: 77.0266, timezone: "Asia/Kolkata" },
  { name: "Noida", region: "Uttar Pradesh", country: "India", countryCode: "IN", latitude: 28.5355, longitude: 77.391, timezone: "Asia/Kolkata" },
  { name: "Faridabad", region: "Haryana", country: "India", countryCode: "IN", latitude: 28.4089, longitude: 77.3178, timezone: "Asia/Kolkata" },
  { name: "Ghaziabad", region: "Uttar Pradesh", country: "India", countryCode: "IN", latitude: 28.6692, longitude: 77.4538, timezone: "Asia/Kolkata" },
  { name: "Agra", region: "Uttar Pradesh", country: "India", countryCode: "IN", latitude: 27.1767, longitude: 78.0081, timezone: "Asia/Kolkata" },
  { name: "Amritsar", region: "Punjab", country: "India", countryCode: "IN", latitude: 31.634, longitude: 74.8723, timezone: "Asia/Kolkata" },
  { name: "Ludhiana", region: "Punjab", country: "India", countryCode: "IN", latitude: 30.901, longitude: 75.8573, timezone: "Asia/Kolkata" },
  { name: "Bhopal", region: "Madhya Pradesh", country: "India", countryCode: "IN", latitude: 23.2599, longitude: 77.4126, timezone: "Asia/Kolkata" },
  { name: "Indore", region: "Madhya Pradesh", country: "India", countryCode: "IN", latitude: 22.7196, longitude: 75.8577, timezone: "Asia/Kolkata" },
  { name: "Nagpur", region: "Maharashtra", country: "India", countryCode: "IN", latitude: 21.1458, longitude: 79.0882, timezone: "Asia/Kolkata" },
  { name: "Surat", region: "Gujarat", country: "India", countryCode: "IN", latitude: 21.1702, longitude: 72.8311, timezone: "Asia/Kolkata" },
  { name: "Kochi", region: "Kerala", country: "India", countryCode: "IN", latitude: 9.9312, longitude: 76.2673, timezone: "Asia/Kolkata" },
  { name: "Thiruvananthapuram", region: "Kerala", country: "India", countryCode: "IN", latitude: 8.5241, longitude: 76.9366, timezone: "Asia/Kolkata" },
  { name: "Guwahati", region: "Assam", country: "India", countryCode: "IN", latitude: 26.1445, longitude: 91.7362, timezone: "Asia/Kolkata" },
  { name: "Bhubaneswar", region: "Odisha", country: "India", countryCode: "IN", latitude: 20.2961, longitude: 85.8245, timezone: "Asia/Kolkata" },
  { name: "Visakhapatnam", region: "Andhra Pradesh", country: "India", countryCode: "IN", latitude: 17.6868, longitude: 83.2185, timezone: "Asia/Kolkata" },
];

/**
 * Searches the fallback cities dataset when live API search is unreachable.
 */
export function fallbackSearch(query: string): Place[] {
  const needle = query.trim().toLowerCase();
  return FALLBACK_CITIES.filter(
    (city) =>
      city.name.toLowerCase().includes(needle) ||
      needle.includes(city.name.toLowerCase()),
  ).slice(0, 6);
}
