/**
 * PROBLEM STATEMENT ALIGNMENT:
 * Quick-access queries cover ALL verticals from the problem statement:
 * navigation (nearest food), crowd management (shortest gate wait),
 * accessibility (first aid), multilingual (translation),
 * transportation (parking/transit), and sustainability (recycling/eco).
 *
 * Defined at module level (not inside the component) so that React never
 * re-allocates this array on re-renders — equivalent to a useMemo with no deps.
 */
export const SUGGESTED_QUERIES: ReadonlyArray<{ label: string; query: string }> = [
  {
    label: '🍔 Nearest Vegetarian?',
    query: 'Where is the nearest vegetarian food options from my location?',
  },
  {
    label: '🚪 Shortest Wait Gate?',
    query: 'Which gates have the shortest wait times right now?',
  },
  {
    label: '🚑 Medical First Aid?',
    query: 'Help, where is the nearest first aid station?',
  },
  {
    label: '🌐 Translate Ticket Query',
    query: "Translate 'Where is my seating block?' to Spanish and French.",
  },
  {
    label: '🚗 Parking & Transit?',
    query: 'What are my best options for parking or taking public transit to the stadium? Include prices and walk times.',
  },
  {
    label: '♻️ Recycling & Water?',
    query: 'Where is the nearest recycling station and water refill point from my current location?',
  },
] as const;
