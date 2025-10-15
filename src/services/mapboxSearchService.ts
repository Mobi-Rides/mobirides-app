
import { getMapboxToken } from '@/utils/mapbox';

export interface SearchSuggestion {
  id: string;
  name: string;
  full_address: string;
  coordinates: [number, number]; // [longitude, latitude]
  place_type: string;
  context?: {
    country?: string;
    region?: string;
    district?: string;
    place?: string;
  };
}

export interface SearchResult {
  suggestions: SearchSuggestion[];
  query: string;
}

class MapboxSearchService {
  private token: string | null = null;

  async initialize(): Promise<void> {
    if (this.token) return;

    try {
      const token = await getMapboxToken();
      if (!token) {
        throw new Error('Mapbox token not available');
      }
      this.token = token;
      console.log('Mapbox Search service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Mapbox Search service:', error);
      throw error;
    }
  }

  async search(query: string): Promise<SearchResult> {
    if (!this.token) {
      await this.initialize();
    }

    if (!query.trim()) {
      return { suggestions: [], query };
    }

    try {
      // Use Mapbox Geocoding API for forward geocoding
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${this.token}&limit=5&country=BW&proximity=25.9087,-24.6541&types=address,poi,place,neighborhood,locality,region,country`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      const suggestions: SearchSuggestion[] = (data.features || []).map((feature: any) => ({
        id: feature.id,
        name: feature.text || feature.place_name,
        full_address: feature.place_name,
        coordinates: feature.geometry.coordinates as [number, number],
        place_type: feature.place_type || 'place',
        context: {
          country: feature.context?.find((c: any) => c.id.startsWith('country'))?.text,
          region: feature.context?.find((c: any) => c.id.startsWith('region'))?.text,
          district: feature.context?.find((c: any) => c.id.startsWith('district'))?.text,
          place: feature.context?.find((c: any) => c.id.startsWith('place'))?.text,
        },
      }));

      return { suggestions, query };
    } catch (error) {
      console.error('Search failed:', error);
      return { suggestions: [], query };
    }
  }

  async getCoordinates(suggestionId: string): Promise<[number, number] | null> {
    if (!this.token) {
      await this.initialize();
    }

    try {
      // Use the suggestion ID to retrieve coordinates via Geocoding API
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${suggestionId}.json?access_token=${this.token}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        return feature.geometry.coordinates as [number, number];
      }

      return null;
    } catch (error) {
      console.error('Failed to retrieve coordinates:', error);
      return null;
    }
  }
}

export const mapboxSearchService = new MapboxSearchService();
