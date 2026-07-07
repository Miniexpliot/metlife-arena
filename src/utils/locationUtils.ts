/** MetLife Stadium reference coordinates (centre field) */
const STADIUM_LAT = 40.8135;
const STADIUM_LNG = -74.0744;

/**
 * Maximum allowed distance (in degrees) before a coordinate is considered
 * outside the stadium. 0.05° ≈ 3–5 miles — generous enough for parking lots.
 */
const MAX_STADIUM_RADIUS_DEG = 0.05;

const SECTIONS = [
  '100-Level (Lower Bowl) - Section 104', '100-Level (Lower Bowl) - Section 112', '100-Level (Lower Bowl) - Section 124', '100-Level (Lower Bowl) - Section 143',
  '200-Level (Mezzanine & Clubs) - Section 201', '200-Level (Mezzanine & Clubs) - Section 224', '200-Level (Mezzanine & Clubs) - Section 248', '200-Level (Mezzanine & Clubs) - Club Level 12',
  '300-Level (Upper Deck) - Section 301', '300-Level (Upper Deck) - Section 315', '300-Level (Upper Deck) - Section 340', '200-Level (Mezzanine & Clubs) - Mezzanine Suite 4',
];

const SEATS = [
  'Row 4, Seat 18', 'Row 12, Seat 5', 'Row 15, Seat 22',
  'Row 20, Seat 1', 'Row 28, Seat 14', 'Wheelchair Bay 3', 'Standing Zone A',
];

/**
 * Deterministically maps a GPS coordinate pair to a human-readable stadium
 * seat label using a coordinate-seeded index.
 *
 * Deterministic — identical coordinates always produce the same label, so the
 * UI stays stable on repeated GPS detections without server round-trips.
 *
 * @param lat - WGS84 latitude
 * @param lon - WGS84 longitude
 * @returns Human-readable seat label, or an "Outside" label if out of range.
 */
export function generateUniqueLocationName(lat: number, lon: number): string {
  const distance = Math.sqrt(
    Math.pow(lat - STADIUM_LAT, 2) + Math.pow(lon - STADIUM_LNG, 2),
  );

  if (distance > MAX_STADIUM_RADIUS_DEG) {
    return 'Outside Stadium Boundaries (Remote Access)';
  }

  // Use coordinate digits as a hash seed — keeps the mapping stable and cheap
  const seed1 = Math.floor(Math.abs(lat * 10000)) % SECTIONS.length;
  const seed2 = Math.floor(Math.abs(lon * 10000)) % SEATS.length;

  return `${SECTIONS[seed1]} - ${SEATS[seed2]}`;
}
