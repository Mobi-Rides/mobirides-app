
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { LoadingView } from "@/components/home/LoadingView";
import { HostView } from "@/components/home/HostView";
import { RenterView } from "@/components/home/RenterView";
import { supabase } from "@/integrations/supabase/client";
import type { SearchFilters as Filters } from "@/components/SearchFilters";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({
    startDate: undefined,
    endDate: undefined,
    vehicleType: undefined,
    location: "",
    sortBy: "price",
    sortOrder: "asc",
  });
  const location = useLocation();

  const { isAuthenticated, isLoading } = useAuth();
  const [userRole, setUserRole] = useState<"host" | "renter" | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  // Fetch user role when authenticated
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!isAuthenticated) {
        setIsLoadingRole(false);
        return;
      }

      setIsLoadingRole(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setUserRole(null);
          setIsLoadingRole(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        setUserRole(profile?.role || null);
      } catch (error) {
        console.error("Error fetching user role:", error);
        setUserRole(null);
      } finally {
        setIsLoadingRole(false);
      }
    };

    fetchUserRole();
  }, [isAuthenticated]);

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  // This effect handles direct URLs with auth parameters
  useEffect(() => {
    // Any initialization based on URL params would go here
    // The actual modal handling is in UnauthenticatedView
  }, [location.search]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onFiltersChange={setFilters}
      />
      <main className="container mx-auto px-4 py-8">
        {isLoading || isLoadingRole ? (
          <LoadingView />
        ) : isAuthenticated && userRole === "host" ? (
          <HostView searchQuery={searchQuery} />
        ) : (
          <RenterView 
            searchQuery={searchQuery} 
            filters={filters} 
            onFiltersChange={handleFiltersChange}
            isAuthenticated={isAuthenticated}
          />
        )}
      </main>
      <Navigation />
    </div>
  );
};

export default Index;
