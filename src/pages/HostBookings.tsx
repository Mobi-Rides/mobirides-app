
import { useState, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Filter, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HostBookingCard } from "@/components/host-bookings/HostBookingCard";
import { HostBookingFilters } from "@/components/host-bookings/HostBookingFilters";
import { HostBookingStats } from "@/components/host-bookings/HostBookingStats";
import { useToast } from "@/hooks/use-toast";
import { BookingWithRelations } from "@/types/booking";

type BookingStatus = "all" | "pending" | "confirmed" | "completed" | "cancelled" | "expired";
type SortOption = "date_asc" | "date_desc" | "earnings_asc" | "earnings_desc" | "status" | "renter";

export const HostBookings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date_desc");
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("active");

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["host-bookings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data: cars, error: carsError } = await supabase
        .from("cars")
        .select("id")
        .eq("owner_id", user.id);

      if (carsError) throw carsError;
      if (!cars.length) return [];

      const carIds = cars.map(car => car.id);
      
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          cars (
            brand,
            model,
            location,
            image_url,
            owner_id,
            price_per_day
          ),
          renter:profiles!renter_id (
            id,
            full_name,
            avatar_url,
            phone_number
          )
        `)
        .in("car_id", carIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BookingWithRelations[];
    }
  });

  const filteredAndSortedBookings = useMemo(() => {
    if (!bookings) return [];

    const filtered = bookings.filter(booking => {
      const matchesSearch = searchQuery === "" || 
        booking.cars.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.cars.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.renter?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.cars.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || booking.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sort bookings
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date_asc":
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
        case "date_desc":
          return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
        case "earnings_asc":
          return a.total_price - b.total_price;
        case "earnings_desc":
          return b.total_price - a.total_price;
        case "status":
          return a.status.localeCompare(b.status);
        case "renter":
          return (a.renter?.full_name || "").localeCompare(b.renter?.full_name || "");
        default:
          return 0;
      }
    });

    return filtered;
  }, [bookings, searchQuery, statusFilter, sortBy]);

  const categorizedBookings = useMemo(() => {
    if (!filteredAndSortedBookings) return {};
    
    const today = new Date();
    
    return {
      active: filteredAndSortedBookings.filter(b => 
        b.status === 'confirmed' && 
        new Date(b.start_date) <= today && 
        new Date(b.end_date) >= today
      ),
      pending: filteredAndSortedBookings.filter(b => b.status === 'pending'),
      expired: filteredAndSortedBookings.filter(b => b.status === 'expired'),
      completed: filteredAndSortedBookings.filter(b => 
        b.status === 'completed' || 
        (b.status === 'confirmed' && new Date(b.end_date) < today)
      )
    };
  }, [filteredAndSortedBookings]);

  const handleBookingAction = useCallback(async (bookingId: string, action: "approve" | "decline" | "cancel") => {
    try {
      const newStatus = action === "approve" ? "confirmed" : action === "decline" ? "cancelled" : "cancelled";
      
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["host-bookings"] });
      
      toast({
        title: "Success",
        description: `Booking ${action}d successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} booking`,
        variant: "destructive",
      });
    }
  }, [queryClient, toast]);

  const handleBulkAction = useCallback(async (action: "approve" | "decline") => {
    if (selectedBookings.length === 0) return;

    try {
      const newStatus = action === "approve" ? "confirmed" : "cancelled";
      
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus })
        .in("id", selectedBookings);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["host-bookings"] });
      setSelectedBookings([]);
      
      toast({
        title: "Success",
        description: `${selectedBookings.length} bookings ${action}d successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} selected bookings`,
        variant: "destructive",
      });
    }
  }, [selectedBookings, queryClient, toast]);

  const exportData = useCallback((format: "csv" | "pdf") => {
    // Export functionality implementation
    toast({
      title: "Export Started",
      description: `Exporting data as ${format.toUpperCase()}...`,
    });
  }, [toast]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">My Bookings (Host)</h1>
              <p className="text-muted-foreground">Manage your rental bookings</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportData("csv")}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportData("pdf")}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <HostBookingStats bookings={bookings} />

        {/* Filters and Search */}
        <Card className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by renter, car, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: BookingStatus) => setStatusFilter(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Newest First</SelectItem>
                <SelectItem value="date_asc">Oldest First</SelectItem>
                <SelectItem value="earnings_desc">Highest Earnings</SelectItem>
                <SelectItem value="earnings_asc">Lowest Earnings</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="renter">Renter Name</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedBookings.length > 0 && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded">
              <span className="text-sm">{selectedBookings.length} selected</span>
              <Button size="sm" onClick={() => handleBulkAction("approve")}>
                Approve Selected
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction("decline")}>
                Decline Selected
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedBookings([])}>
                Clear
              </Button>
            </div>
          )}
        </Card>

        {/* Booking Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="active" className="relative">
              Active Rentals
              {categorizedBookings.active?.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {categorizedBookings.active.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending" className="relative">
              Requests
              {categorizedBookings.pending?.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                  {categorizedBookings.pending.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="expired">
              Expired
              {categorizedBookings.expired?.length > 0 && (
                <Badge variant="outline" className="ml-2 h-5 px-1.5 text-xs">
                  {categorizedBookings.expired.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">
              Past Rentals
              {categorizedBookings.completed?.length > 0 && (
                <Badge variant="outline" className="ml-2 h-5 px-1.5 text-xs">
                  {categorizedBookings.completed.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {categorizedBookings.active?.map((booking) => (
              <HostBookingCard
                key={booking.id}
                booking={booking}
                isSelected={selectedBookings.includes(booking.id)}
                onSelect={(selected) => {
                  if (selected) {
                    setSelectedBookings(prev => [...prev, booking.id]);
                  } else {
                    setSelectedBookings(prev => prev.filter(id => id !== booking.id));
                  }
                }}
                onAction={handleBookingAction}
              />
            ))}
            {categorizedBookings.active?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No active rentals
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {categorizedBookings.pending?.map((booking) => (
              <HostBookingCard
                key={booking.id}
                booking={booking}
                isSelected={selectedBookings.includes(booking.id)}
                onSelect={(selected) => {
                  if (selected) {
                    setSelectedBookings(prev => [...prev, booking.id]);
                  } else {
                    setSelectedBookings(prev => prev.filter(id => id !== booking.id));
                  }
                }}
                onAction={handleBookingAction}
              />
            ))}
            {categorizedBookings.pending?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No pending requests
              </div>
            )}
          </TabsContent>

          <TabsContent value="expired" className="space-y-4">
            {categorizedBookings.expired?.map((booking) => (
              <HostBookingCard
                key={booking.id}
                booking={booking}
                isSelected={false}
                onSelect={() => {}}
                onAction={handleBookingAction}
              />
            ))}
            {categorizedBookings.expired?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No expired requests
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {categorizedBookings.completed?.map((booking) => (
              <HostBookingCard
                key={booking.id}
                booking={booking}
                isSelected={false}
                onSelect={() => {}}
                onAction={handleBookingAction}
              />
            ))}
            {categorizedBookings.completed?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No completed rentals
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Navigation />
    </div>
  );
};

export default HostBookings;
