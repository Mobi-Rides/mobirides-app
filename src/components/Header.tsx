import { useState, useEffect } from "react";
import { Navigation, Plus, Search, SlidersHorizontal, LayoutDashboard, User, Bell, LogOut, ShieldCheck, CheckCircle2, Clock, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SearchFilters } from "@/components/SearchFilters";
import { useNavigate, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { SearchFilters as Filters } from "@/components/SearchFilters";
import { AuthModal } from "@/components/auth/AuthModal";
import { VerificationStatusBadge } from "@/components/verification/VerificationStatusBadge";
import { useVerificationStatus } from "@/hooks/useVerificationStatus";

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

export const Header = ({
  searchQuery,
  onSearchChange,
  onFiltersChange,
}: HeaderProps) => {
  const navigate = useNavigate();
  const locationPath = useLocation();
  const { user } = useAuth();
  const { verificationData, isVerified } = useVerificationStatus();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<"signin" | "signup">("signin");
  const [locationData, setLocationData] = useState<LocationState>({
    city: "Gaborone",
    country: "Botswana",
    loading: true,
    error: null,
  });

  useEffect(() => {
    const checkPermissionAndFetchLocation = async () => {
      try {
        // Check if permission is already granted
        const permissionStatus = await navigator.permissions.query({
          name: "geolocation",
        });

        if (permissionStatus.state === "granted") {
          // Permission already granted, get location
          await fetchUserLocation();
        } else if (permissionStatus.state === "denied") {
          // User previously denied, use IP-based fallback without prompting
          await fetchLocationByIP();
        } else {
          // Permission is in 'prompt' state - use IP method or show custom UI first
          await fetchLocationByIP();
        }
      } catch (error) {
        // Permissions API not supported, fall back to try-catch with geolocation
        try {
          await fetchUserLocation();
        } catch {
          await fetchLocationByIP();
        }
      }
    };

    const fetchUserLocation = async () => {
      try {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0,
            });
          },
        );

        // Using your OpenCage API key
        const response = await fetch(
          `https://api.opencagedata.com/geocode/v1/json?q=${position.coords.latitude}+${position.coords.longitude}&key=4382106d8cc34d2e9c95f4dc83f23736`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch location data");
        }

        const data = await response.json();
        const result = data.results?.[0]?.components;

        if (result) {
          setLocationData({
            city:
              result.city ||
              result.town ||
              result.state ||
              result.county ||
              "Unknown",
            country: result.country || "Unknown",
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error("Location error:", error);
        setLocationData((prev) => ({
          ...prev,
          loading: false,
          error:
            error instanceof Error ? error.message : "Failed to get location",
        }));
      }
    };

    const fetchLocationByIP = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/");

        if (!response.ok) {
          throw new Error("Failed to fetch location data");
        }

        const data = await response.json();

        setLocationData({
          city: data.city || "Gaborone",
          country: data.country_name || "Botswana",
          loading: false,
          error: null,
        });
      } catch (error) {
        // Silently fall back to default location when IP geolocation fails (e.g., CORS issues)
        setLocationData((prev) => ({
          ...prev,
          loading: false,
          error: null,
          city: "Gaborone",
          country: "Botswana",
        }));
      }
    };

    checkPermissionAndFetchLocation();
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!user) return null;

      const { data } = await supabase
        .from("profiles")
        .select("avatar_url, full_name")
        .eq("id", user.id)
        .single();

      return data;
    },
    enabled: !!user,
  });

  const { data: notificationCount } = useQuery({
    queryKey: ["notification-count"],
    queryFn: async () => {
      if (!user) return 0;

      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact" })
        .eq("user_id", user.id)
        .eq("is_read", false);

      return count || 0;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: !!user,
  });

  const avatarUrl = profile?.avatar_url
    ? supabase.storage.from("avatars").getPublicUrl(profile.avatar_url).data
        .publicUrl
    : null;

  const handleFiltersChange = (filters: Filters) => {
    console.log("Filters changed:", filters);
    onFiltersChange({ ...filters, searchQuery });
  };


  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleCloseModal = () => {
    setIsAuthModalOpen(false);
    navigate(locationPath.pathname, { replace: true });
  };

  // Check URL for auth parameter
  useEffect(() => {
    const params = new URLSearchParams(locationPath.search);
    const authParam = params.get("auth");

    if (authParam === "signin" || authParam === "signup") {
      setDefaultTab(authParam);
      setIsAuthModalOpen(true);
    }
  }, [locationPath.search]);

  const locationDisplay = locationData.loading
    ? "Loading location..."
    : locationData.error
      ? "Gaborone, Botswana"
      : `${locationData.city}, ${locationData.country}`;

  return (
    <header className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-900 sticky top-0 z-10 shadow-sm p-6 md:p-8 rounded-b-3xl">
      <div className="flex items-center justify-between gap-4 mb-4">
        <img
          src="/lovable-uploads/a065be26-80b7-4e50-b683-b6afb0add925.png"
          alt="Mobirides Logo"
          className="h-14 w-14 cursor-pointer"
          onClick={() => navigate("/")}
        />

        <div className="flex-1">
          <div className="flex items-center justify-center gap-1 text-center">
            <Navigation className="text-white h-4 w-4 flex-shrink-0" />
            <h3 className="text-xs md:text-sm lg:text-base font-normal text-gray-500 dark:text-white truncate">
              {locationDisplay}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-2xl  md:size-auto md:px-4 md:py-2 md:flex md:items-center md:gap-2"
            onClick={() => navigate("/add-car")}
          >
            <Plus className="h-4 w-4 text-[#581CFA] dark:text-white" />
            <span className="hidden md:inline-block">
              <p className="text-[#581CFA] dark:text-white text-xs md:text-sm lg:text-base font-semibold">
                Add A Car
              </p>
            </span>
          </Button>

          {/* Verification Status Badge - only show for authenticated users */}
          {user && (
            <div className="hidden sm:block">
              <VerificationStatusBadge variant="button" size="sm" />
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full bg-gray-100 flex items-center justify-center relative focus:outline-none">
                {avatarUrl && user ? (
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={avatarUrl} alt="Profile" />
                    <AvatarFallback>👤</AvatarFallback>
                  </Avatar>
                ) : (
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>👤</AvatarFallback>
                  </Avatar>
                )}
                {user && typeof notificationCount === 'number' && notificationCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {notificationCount}
                  </Badge>
                )}
              </button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent 
              align="end" 
              className="w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            >
              {user && (
                <>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.full_name || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => navigate('/settings/verification')} className="cursor-pointer">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        <span>Verification</span>
                      </div>
                      {verificationData && (
                        <div className="ml-2">
                          {verificationData.overall_status === 'completed' && (
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                          )}
                          {verificationData.overall_status === 'requires_reverification' && (
                            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          )}
                          {(verificationData.overall_status === 'pending_review' || verificationData.overall_status === 'pending') && (
                            <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          )}
                          {verificationData.overall_status === 'rejected' && (
                            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                      )}
                    </div>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => navigate('/notifications')} className="cursor-pointer">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <Bell className="mr-2 h-4 w-4" />
                        <span>Notifications</span>
                      </div>
                      {notificationCount && notificationCount > 0 && (
                        <Badge variant="destructive" className="ml-2 h-5 px-2">
                          {notificationCount}
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 dark:text-red-400">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </>
              )}
              
              {!user && (
                <DropdownMenuItem onClick={() => {
                  setDefaultTab("signin");
                  setIsAuthModalOpen(true);
                }} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Sign In</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
            className="w-full h-12 md:h-14 pl-10 pr-4 py-2 rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:border-primary dark:focus:border-primary text-xs md:text-sm lg:text-base placeholder:text-xs md:placeholder:text-sm lg:placeholder:text-base dark:placeholder:text-gray-400"
          />
        </div>
      {/* Filter button - hidden via feature flag */}
        {false && (
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
        )}
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={handleCloseModal}
        defaultTab={defaultTab}
        idPrefix="header"
      />
    </header>
  );
};
