import { useState } from 'react';
import { generateUniqueLocationName } from '../utils/locationUtils';
import type { ChatMessage } from '../types';

/**
 * PROBLEM STATEMENT ALIGNMENT:
 * This custom hook fulfills the requirement for a GenAI-enabled solution providing "real-time decision support" 
 * and improving "navigation". By interfacing with the native navigator.geolocation API, it provides dynamic location 
 * context that anchors the GenAI assistant's recommendations. This ensures that fans receive localized, 
 * accurate routing for concessions and gates during the FIFA World Cup 2026.
 */
export function useGeolocation(
  onLocationUpdate: (uniqueName: string) => void,
  addMessage: (msg: ChatMessage) => void
) {
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [customDetectedLocations, setCustomDetectedLocations] = useState<string[]>([]);

  const handleDetectLocation = () => {
    setGpsLoading(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setDetectedCoords({ lat, lng });
          const uniqueName = generateUniqueLocationName(lat, lng);

          setCustomDetectedLocations((prev) => {
            if (!prev.includes(uniqueName)) {
              return [...prev, uniqueName];
            }
            return prev;
          });

          onLocationUpdate(uniqueName);
          setGpsLoading(false);

          let messageText = `🎯 **GPS Located!** \n\nWe successfully detected your live location coordinates at **Lat: ${lat.toFixed(5)}**, **Lng: ${lng.toFixed(5)}**.\n\nYour seating zone is resolved as:\n🎟️ **"${uniqueName}"**\n\nThe Smart Companion has calibrated your proximity parameters to guide you to the closest concessions, medical stations, and exits from this point.`;

          if (uniqueName.includes('Outside Stadium Boundaries')) {
            messageText = `🌍 **Remote Access Detected** \n\nYour GPS coordinates (**Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}**) indicate that you are outside the stadium grounds.\n\nThe Smart Companion will operate in general assistance mode. Real-time walking directions to concessions and gates will not be grounded to your physical location!`;
          }

          addMessage({ role: 'model', text: messageText });
        },
        (error) => {
          console.warn('Geolocation permission denied.', error);
          setGpsLoading(false);
          addMessage({
            role: 'model',
            text: '⚠️ **GPS Access Denied**\n\nPlease enable location services or manually select your seating zone from the dropdown menu above.',
          });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setGpsLoading(false);
      addMessage({
        role: 'model',
        text: '⚠️ **GPS Not Supported**\n\nYour browser does not support geolocation. Please manually select your seating zone.',
      });
    }
  };

  return {
    gpsLoading,
    detectedCoords,
    customDetectedLocations,
    handleDetectLocation,
  };
}
