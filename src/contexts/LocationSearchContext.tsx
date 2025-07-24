
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { SearchSuggestion, SearchResult, mapboxSearchService } from '@/services/mapboxSearchService';

interface LocationSearchContextType {
  searchResults: SearchResult;
  recentSearches: SearchSuggestion[];
  favorites: SearchSuggestion[];
  isLoading: boolean;
  error: string | null;
  search: (query: string) => Promise<void>;
  selectLocation: (suggestion: SearchSuggestion) => void;
  addToFavorites: (suggestion: SearchSuggestion) => void;
  removeFromFavorites: (suggestionId: string) => void;
  clearRecentSearches: () => void;
}

const LocationSearchContext = createContext<LocationSearchContextType | undefined>(undefined);

export const useLocationSearch = () => {
  const context = useContext(LocationSearchContext);
  if (!context) {
    throw new Error('useLocationSearch must be used within a LocationSearchProvider');
  }
  return context;
};

interface LocationSearchProviderProps {
  children: React.ReactNode;
}

export const LocationSearchProvider: React.FC<LocationSearchProviderProps> = ({ children }) => {
  const [searchResults, setSearchResults] = useState<SearchResult>({ suggestions: [], query: '' });
  const [recentSearches, setRecentSearches] = useState<SearchSuggestion[]>([]);
  const [favorites, setFavorites] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedRecentSearches = localStorage.getItem('locationRecentSearches');
    const savedFavorites = localStorage.getItem('locationFavorites');

    if (savedRecentSearches) {
      try {
        setRecentSearches(JSON.parse(savedRecentSearches));
      } catch (e) {
        console.error('Failed to parse recent searches:', e);
      }
    }

    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error('Failed to parse favorites:', e);
      }
    }
  }, []);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults({ suggestions: [], query: '' });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await mapboxSearchService.search(query);
      setSearchResults(results);
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectLocation = useCallback((suggestion: SearchSuggestion) => {
    // Add to recent searches (limit to 10)
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.id !== suggestion.id);
      const updated = [suggestion, ...filtered].slice(0, 10);
      localStorage.setItem('locationRecentSearches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addToFavorites = useCallback((suggestion: SearchSuggestion) => {
    setFavorites((prev) => {
      if (prev.some((item) => item.id === suggestion.id)) {
        return prev; // Already in favorites
      }
      const updated = [...prev, suggestion];
      localStorage.setItem('locationFavorites', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFromFavorites = useCallback((suggestionId: string) => {
    setFavorites((prev) => {
      const updated = prev.filter((item) => item.id !== suggestionId);
      localStorage.setItem('locationFavorites', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('locationRecentSearches');
  }, []);

  return (
    <LocationSearchContext.Provider
      value={{
        searchResults,
        recentSearches,
        favorites,
        isLoading,
        error,
        search,
        selectLocation,
        addToFavorites,
        removeFromFavorites,
        clearRecentSearches,
      }}
    >
      {children}
    </LocationSearchContext.Provider>
  );
};
