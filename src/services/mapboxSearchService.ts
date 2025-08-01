
import { SearchBoxCore } from '@mapbox/search-js-core';
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
  private searchBox: SearchBoxCore | null = null;
  private isInitialized = false;
  private sessionToken: string | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const token = await getMapboxToken();
      if (!token) {
        throw new Error('Mapbox token not available');
      }

      this.searchBox = new SearchBoxCore({
        accessToken: token,
        language: 'en',
        limit: 5,
        country: 'BW', // Botswana
      });

      // Generate a session token for the search session
      this.sessionToken = crypto.randomUUID();

      this.isInitialized = true;
      console.log('Mapbox Search JS initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Mapbox Search JS:', error);
      throw error;
    }
  }

  async search(query: string): Promise<SearchResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.searchBox || !query.trim() || !this.sessionToken) {
      return { suggestions: [], query };
    }

    try {
      const response = await this.searchBox.suggest(query, {
        sessionToken: this.sessionToken,
        proximity: [25.9087, -24.6541], // Gaborone, Botswana
      });

      const suggestions: SearchSuggestion[] = response.suggestions.map((suggestion) => ({
        id: suggestion.mapbox_id || suggestion.name,
        name: suggestion.name,
        full_address: suggestion.full_address || suggestion.place_formatted || suggestion.name,
        coordinates: [suggestion._geometry?.coordinates?.[0] || 0, suggestion._geometry?.coordinates?.[1] || 0],
        place_type: suggestion.feature_type || 'place',
        context: {
          country: suggestion.context?.country?.name,
          region: suggestion.context?.region?.name,
          district: suggestion.context?.district?.name,
          place: suggestion.context?.place?.name,
        },
      }));

      return { suggestions, query };
    } catch (error) {
      console.error('Search failed:', error);
      return { suggestions: [], query };
    }
  }

  async getCoordinates(suggestionId: string): Promise<[number, number] | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.searchBox || !this.sessionToken) {
      return null;
    }

    try {
      // Find the suggestion by ID first
      const suggestion: { mapbox_id: string } = { mapbox_id: suggestionId };
      const response = await this.searchBox.retrieve(suggestion, {
        sessionToken: this.sessionToken,
      });

      if (response.features && response.features.length > 0) {
        const feature = response.features[0];
        return [feature.geometry.coordinates[0], feature.geometry.coordinates[1]];
      }

      return null;
    } catch (error) {
      console.error('Failed to retrieve coordinates:', error);
      return null;
    }
  }
}

export const mapboxSearchService = new MapboxSearchService();
