/**
 * Static list of suggested quick-access queries shown above the chat input.
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
] as const;
