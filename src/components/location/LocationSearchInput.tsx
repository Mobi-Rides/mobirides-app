
import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Search, Star, Clock, X } from 'lucide-react';
import { useLocationSearch } from '@/contexts/LocationSearchContext';
import { SearchSuggestion } from '@/services/mapboxSearchService';
import { cn } from '@/lib/utils';

interface LocationSearchInputProps {
  placeholder?: string;
  onLocationSelect: (suggestion: SearchSuggestion) => void;
  onLocationChange?: (coordinates: [number, number], address: string) => void;
  className?: string;
  showRecentSearches?: boolean;
  showFavorites?: boolean;
  value?: string;
  disabled?: boolean;
}

export const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
  placeholder = "Search for a location...",
  onLocationSelect,
  onLocationChange,
  className,
  showRecentSearches = true,
  showFavorites = true,
  value,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    searchResults,
    recentSearches,
    favorites,
    isLoading,
    error,
    search,
    selectLocation,
    addToFavorites,
    removeFromFavorites,
  } = useLocationSearch();

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      if (newValue.trim()) {
        search(newValue);
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    }, 300);

    setDebounceTimer(timer);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setInputValue(suggestion.name);
    setIsOpen(false);
    selectLocation(suggestion);
    onLocationSelect(suggestion);
    onLocationChange?.(suggestion.coordinates, suggestion.full_address);
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (inputValue.trim()) {
      setIsOpen(true);
    } else if (showRecentSearches && recentSearches.length > 0) {
      setIsOpen(true);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clean up debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  const clearInput = () => {
    setInputValue('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          disabled={disabled}
          className="pl-10 pr-8"
        />
        {inputValue && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={clearInput}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-80">
          <ScrollArea className="max-h-80">
            {/* Error message */}
            {error && (
              <div className="p-3 text-sm text-destructive border-b">
                {error}
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="p-3 text-sm text-muted-foreground">
                Searching...
              </div>
            )}

            {/* Search results */}
            {searchResults.suggestions.length > 0 && (
              <div className="border-b">
                <div className="p-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Search Results
                </div>
                {searchResults.suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{suggestion.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {suggestion.full_address}
                      </div>
                    </div>
                    <div
                      className="h-6 w-6 p-0 flex-shrink-0 flex items-center justify-center cursor-pointer hover:bg-accent rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (favorites.some((fav) => fav.id === suggestion.id)) {
                          removeFromFavorites(suggestion.id);
                        } else {
                          addToFavorites(suggestion);
                        }
                      }}
                    >
                      <Star
                        className={cn(
                          "h-3 w-3",
                          favorites.some((fav) => fav.id === suggestion.id)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground hover:text-yellow-400"
                        )}
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Recent searches */}
            {showRecentSearches && recentSearches.length > 0 && !inputValue.trim() && (
              <div className="border-b">
                <div className="p-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Recent Searches
                </div>
                {recentSearches.slice(0, 3).map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{suggestion.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {suggestion.full_address}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Favorites */}
            {showFavorites && favorites.length > 0 && !inputValue.trim() && (
              <div>
                <div className="p-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Favorites
                </div>
                {favorites.slice(0, 3).map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                  >
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{suggestion.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {suggestion.full_address}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No results */}
            {inputValue.trim() && !isLoading && searchResults.suggestions.length === 0 && !error && (
              <div className="p-3 text-sm text-muted-foreground text-center">
                No locations found for "{inputValue}"
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
};
