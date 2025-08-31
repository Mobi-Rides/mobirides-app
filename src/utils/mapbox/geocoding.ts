import { getMapboxToken } from './index';

/**
 * Converts latitude and longitude coordinates to a human-readable address
 * using the Mapbox Geocoding API
 * 
 * @param latitude - The latitude coordinate
 * @param longitude - The longitude coordinate
 * @returns Promise<string> - The formatted address or fallback coordinates
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    const mapboxToken = await getMapboxToken();
    
    if (!mapboxToken) {
      console.warn('No Mapbox token available, falling back to coordinates');
      return `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
    }

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}`
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      // Return the most relevant place name
      return data.features[0].place_name;
    }

    // Fallback to coordinates if no address found
    return `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    // Fallback to coordinates on any error
    return `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
  }
};

/**
 * Converts latitude and longitude coordinates to a simplified address
 * Returns only the city/town and country for a cleaner display
 * 
 * @param latitude - The latitude coordinate
 * @param longitude - The longitude coordinate
 * @returns Promise<string> - The simplified address or fallback coordinates
 */
export const reverseGeocodeSimple = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    const mapboxToken = await getMapboxToken();
    
    if (!mapboxToken) {
      console.warn('No Mapbox token available, falling back to coordinates');
      return `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
    }

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=place,locality,district&access_token=${mapboxToken}`
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const context = feature.context || [];
      
      // Extract city and country from the context
      let city = feature.text || '';
      let country = '';
      
      // Look for country in context
      const countryContext = context.find((ctx: any) => ctx.id.startsWith('country'));
      if (countryContext) {
        country = countryContext.text;
      }
      
      if (city && country) {
        return `${city}, ${country}`;
      } else if (city) {
        return city;
      }
    }

    // Fallback to coordinates if no address found
    return `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
  } catch (error) {
    console.error('Error in simple reverse geocoding:', error);
    // Fallback to coordinates on any error
    return `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
  }
};