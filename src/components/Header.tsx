import { useState, useEffect } from "react";
import { Navigation, Plus, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SearchFilters } from "@/components/SearchFilters";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SearchFilters as Filters } from "@/components/SearchFilters";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFiltersChange: (filters: Filters) => void;
}

interface LocationState {
  city: string;
  country: string;
  loading: boolean;
  error: string | null;
}

export const Header = ({ searchQuery, onSearchChange, onFiltersChange }: HeaderProps) => {
  const navigate = useNavigate();
  const [location, setLocation] = useState<LocationState>({
    city: "Gaborone",
    country: "Botswana",
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchLocation = async () => {
      if (!("geolocation" in navigator)) {
        setLocation(prev => ({ ...prev, loading: false, error: "Geolocation not supported" }));
        return;
      }

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          });
        });

        // Using your OpenCage API key
        const response = await fetch(
          `https://api.opencagedata.com/geocode/v1/json?q=${position.coords.latitude}+${position.coords.longitude}&key=4382106d8cc34d2e9c95f4dc83f23736`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch location data');
        }

        const data = await response.json();
        const result = data.results?.[0]?.components;

        if (result) {
          setLocation({
            city: result.city || result.town || result.state || result.county || "Unknown",
            country: result.country || "Unknown",
            loading: false,
            error: null
          });
        }
      } catch (error) {
        console.error("Location error:", error);
        setLocation(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Failed to get location"
        }));
      }
    };

    fetchLocation();
  }, []);

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, full_name')
        .eq('id', user.id)
        .single();

      return data;
    }
  });

  const { data: notificationCount } = useQuery({
    queryKey: ['notification-count'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { messages: 0, notifications: 0 };

      const [messagesResponse, notificationsResponse] = await Promise.all([
        supabase
          .from('messages')
          .select('id', { count: 'exact' })
          .eq('receiver_id', user.id)
          .eq('status', 'sent'),
        supabase
          .from('notifications')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('is_read', false)
      ]);

      return {
        messages: messagesResponse.count || 0,
        notifications: notificationsResponse.count || 0
      };
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const totalNotifications = (notificationCount?.messages || 0) + (notificationCount?.notifications || 0);

  const avatarUrl = profile?.avatar_url 
    ? supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl 
    : null;

  const handleFiltersChange = (filters: Filters) => {
    console.log('Filters changed:', filters);
    onFiltersChange({ ...filters, searchQuery });
  };

  const locationDisplay = location.loading 
    ? "Loading location..." 
    : location.error 
    ? "Gaborone, Botswana" 
    : `${location.city}, ${location.country}`;

  return (
    <header className="bg-[#581CFA]  sticky top-0 z-10 shadow-sm p-6 md:p-8 rounded-b-3xl">
      <div className="flex items-center justify-between gap-4 mb-4">
        <img
          src="/lovable-uploads/9bb8c367-3153-4561-870a-faadfe15b30c.png"
          alt="Mobirides Logo"
          className="h-14 w-14 cursor-pointer"
          onClick={() => navigate("/")}
        />

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-2xl  md:size-auto md:px-4 md:py-2 md:flex md:items-center md:gap-2"
            onClick={() => navigate("/add-car")}
          >
            <Plus className="h-4 w-4 text-[#581CFA]" />
            <span className="hidden md:inline-block">
              <p className="text-[#581CFA] text-xs md:text-sm lg:text-base font-semibold">
                Add A Car
              </p>
            </span>
          </Button>
          <div className="relative">
            <button
              className="rounded-full bg-gray-100 flex items-center justify-center"
              onClick={() => navigate("/profile")}
            >
              {avatarUrl ? (
                <Avatar className="h-10 w-10">
                  <AvatarImage src={avatarUrl} alt="Profile" />
                  <AvatarFallback>👤</AvatarFallback>
                </Avatar>
              ) : (
                <Avatar className="h-10 w-10">
                  <AvatarFallback>👤</AvatarFallback>
                </Avatar>
              )}
            </button>
            {totalNotifications > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {totalNotifications}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-center gap-1 text-center">
          <Navigation className="text-white h-4 w-4 flex-shrink-0" />
          <h3 className="text-xs md:text-sm lg:text-base font-normal text-white truncate">
            {locationDisplay}
          </h3>
        </div>
      </div>
      <div className="flex gap-2 mt-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#581CFA] h-4 w-4 md:h-5 md:w-5  lg:h-6 lg:w-6" />
          <input
            type="text"
            placeholder="Search cars..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-12 md:h-14 pl-10 pr-4 py-2  rounded-2xl border border-gray-200 focus:outline-none focus:border-primary text-xs md:text-sm lg:text-base placeholder:text-xs md:placeholder:text-sm lg:placeholder:text-base"
          />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-2xl w-12 md:w-14 h-12 md:h-14 flex items-center justify-center"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SearchFilters onFiltersChange={handleFiltersChange} />
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};
