import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { BookingTable } from "@/components/booking/BookingTable";
import { format } from "date-fns";
import { Booking, BookingStatus } from "@/types/booking";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Grid3X3, Table as TableIcon } from "lucide-react"; // Removed unused icons
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
// Removed unused DropdownMenu imports
import { useAuth } from "@/hooks/useAuth";
import { ToastAction } from "@/components/ui/toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


// RoleSwitcher component (as per your last instruction, it will render null)
interface RoleSwitcherProps {
  currentUserRole: "host" | "renter";
  onRoleChange: (role: "host" | "renter") => void;
  canBeHost: boolean;
}

const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  currentUserRole,
  onRoleChange,
  canBeHost,
}) => {
  if (!canBeHost) {
    return null;
  }
  return null; // Always return null as per the requirement to hide buttons
};

const Bookings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  // Filter status type now excludes "dispute"
  const [filterStatus, setFilterStatus] = useState<BookingStatus | "all">("all");
  const [activeView, setActiveView] = useState<"host" | "renter" | null>(null);
  const [canBeHost, setCanBeHost] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [sortField, setSortField] = useState<"created_at" | "start_date" | "end_date" | "total_price" | "car_brand">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Fetch user role and capabilities once on component mount
  useEffect(() => {
    const checkUserCapabilitiesAndRole = async () => {
      if (!session?.user) {
        console.log("Bookings.tsx: No user session found during initial capability check.");
        setActiveView('renter'); // Default to renter view if no user
        return;
      }
      const user = session.user;
      console.log("Bookings.tsx: Current User ID for capability check:", user.id);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error("Bookings.tsx: Error fetching user profile:", profileError);
        setActiveView('renter');
        return;
      }
      console.log("Bookings.tsx: User profile role from DB:", profile?.role);

      const { count: ownedCarsCount, error: carsError } = await supabase
        .from("cars")
        .select("id", { count: 'exact', head: true })
        .eq("owner_id", user.id);

      if (carsError) {
        console.error("Bookings.tsx: Error checking owned cars for canBeHost:", carsError);
        setCanBeHost(false);
      } else {
        setCanBeHost(ownedCarsCount && ownedCarsCount > 0);
        console.log("Bookings.tsx: User owns cars (canBeHost):", ownedCarsCount && ownedCarsCount > 0);
      }

      if (profile?.role === 'host' && (ownedCarsCount && ownedCarsCount > 0)) {
        setActiveView('host');
        console.log("Bookings.tsx: Initial activeView set to HOST based on profile role and owned cars.");
      } else {
        setActiveView('renter');
        console.log("Bookings.tsx: Initial activeView set to RENTER.");
      }
    };

    checkUserCapabilitiesAndRole();
  }, [session]);

  const {
    data: bookings,
    isLoading: isLoadingBookings,
    error: bookingsError
  } = useQuery<Booking[]>({
    queryKey: ["userBookings", activeView, session?.user?.id],
    queryFn: async (): Promise<Booking[]> => {
      if (!session?.user || activeView === null) {
        console.log("Bookings.tsx: Skipping queryFn - No user or activeView not determined yet.");
        return [];
      }
      const currentUserId = session.user.id;
      console.log(`Bookings.tsx: Executing query for activeView: ${activeView} with user ID: ${currentUserId}`);

      let query = supabase.from("bookings").select(
        `
        *,
        cars (
          brand,
          model,
          image_url,
          owner_id,
          location,
          price_per_day,
          owner_profile:profiles!cars_owner_id_fkey(full_name)
        ),
        reviews!reviews_booking_id_fkey (
          id
        ),
        renters:profiles!bookings_renter_id_fkey(
          full_name
        )
      `
      );

      if (activeView === "renter") {
        console.log("Bookings.tsx: Querying as RENTER, filtering by renter_id.");
        query = query.eq("renter_id", currentUserId);
      } else { // activeView === "host"
        try {
          const { data: ownedCars, error: ownedCarsError } = await supabase
            .from("cars")
            .select("id")
            .eq("owner_id", currentUserId);

          if (ownedCarsError) {
            console.error("Bookings.tsx: CRITICAL ERROR - Failed to fetch owned cars for host view:", ownedCarsError);
            throw ownedCarsError;
          }

          if (!ownedCars || ownedCars.length === 0) {
            console.log("Bookings.tsx: Host owns no cars, returning empty bookings array for host view.");
            return [];
          }

          const ownedCarIds = ownedCars.map(car => car.id);
          console.log("Bookings.tsx: Owned Car IDs:", ownedCarIds);
          query = query.in("car_id", ownedCarIds);

          console.log("Bookings.tsx: Host bookings query built using car_ids.");
        } catch (hostCarFetchError) {
          console.error("Bookings.tsx: UNEXPECTED ERROR during host car fetch phase:", hostCarFetchError);
          throw hostCarFetchError;
        }
      }
      query = query.order("created_at", { ascending: false });

      const { data, error: queryError } = await query;
      if (queryError) {
        console.error(`Bookings.tsx: ERROR fetching ${activeView} bookings from main query:`, queryError);
        throw queryError;
      }

      console.log(`Bookings.tsx: Successfully fetched ${activeView} bookings (raw data):`, data);
      // Return the data as is without mapping
      return Array.isArray(data) ? data : [];
    },
    enabled: !!session?.user && activeView !== null,
    retry: 2,
    initialData: [],
  });

  useEffect(() => {
    if (activeView) {
      toast({
        description: `Loading ${activeView === 'renter' ? 'your bookings' : 'your rentals'}...`,
        variant: "default",
      });
    }
  }, [activeView, toast]);

  const filteredBookings = useMemo(() => {
    let currentFiltered = bookings;

    const lowercasedSearch = searchTerm.toLowerCase();

    currentFiltered = currentFiltered.filter((booking) => {
      let principalNameMatch = false;
      if (activeView === "renter") {
        principalNameMatch = booking.cars?.owner_profile?.full_name?.toLowerCase().includes(lowercasedSearch) || false;
      } else { // activeView === "host"
        principalNameMatch = booking.renters?.full_name?.toLowerCase().includes(lowercasedSearch) || false;
      }

      const carDetailsMatch =
        (booking.cars?.brand.toLowerCase().includes(lowercasedSearch) ||
          booking.cars?.model.toLowerCase().includes(lowercasedSearch)) ||
        false;

      const startDateFormatted = booking.start_date ? format(new Date(booking.start_date), "PPP").toLowerCase() : "";
      const endDateFormatted = booking.end_date ? format(new Date(booking.end_date), "PPP").toLowerCase() : "";
      const dateMatch =
        startDateFormatted.includes(lowercasedSearch) ||
        endDateFormatted.includes(lowercasedSearch);

      const locationMatch =
        booking.cars?.location?.toLowerCase().includes(lowercasedSearch) || false;

      const searchTermMatches =
        principalNameMatch || carDetailsMatch || dateMatch || locationMatch;

      const statusMatches =
        filterStatus === "all" || booking.status === filterStatus;

      return searchTermMatches && statusMatches;
    });

    // Date range filter
    if (dateRange.start) {
      currentFiltered = currentFiltered.filter(
        booking => new Date(booking.start_date) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      currentFiltered = currentFiltered.filter(
        booking => new Date(booking.end_date) <= new Date(dateRange.end)
      );
    }

    currentFiltered = currentFiltered.slice().sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      if (sortField === "total_price") {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } else if (sortField === "car_brand") {
        aValue = a.cars?.brand || "";
        bValue = b.cars?.brand || "";
      } else {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return currentFiltered;
  }, [bookings, searchTerm, filterStatus, activeView, dateRange, sortField, sortOrder]);

  const createCancellationNotifications = useCallback(async (booking: Booking, userInitiatorId: string) => {
    const carBrand = booking.cars?.brand || "Unknown Brand";
    const carModel = booking.cars?.model || "Unknown Model";
    const ownerId = booking.cars?.owner_id;

    if (ownerId) {
      await supabase.from("notifications").insert(
        {
          user_id: ownerId,
          type: "booking_cancelled",
          content: `Booking for ${carBrand} ${carModel} from ${format(new Date(booking.start_date), "PPP")} to ${format(new Date(booking.end_date), "PPP")} has been cancelled.`,
          related_car_id: booking.car_id,
          related_booking_id: booking.id
        });
    }

    if (booking.renter_id !== userInitiatorId) {
      await supabase.from("notifications").insert({
        user_id: booking.renter_id,
        type: "booking_cancelled",
        content: `Your booking for ${carBrand} ${carModel} from ${format(new Date(booking.start_date), "PPP")} to ${format(new Date(booking.end_date), "PPP")} has been cancelled.`,
        related_car_id: booking.car_id,
        related_booking_id: booking.id,
      });
    }
  }, []);

  const handleCancelBooking = useCallback(async (bookingId: string) => {
    try {
      if (!session?.user) {
        toast({
            title: "Error",
            description: "You must be logged in to cancel a booking.",
            variant: "destructive",
        });
        return;
      }

      const bookingToCancel = bookings.find((b) => b.id === bookingId);
      if (!bookingToCancel) return;
      const previousStatus = bookingToCancel.status;

      const { error: updateError } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);

      if (updateError) {
        console.error("Bookings.tsx: Error updating booking status to cancelled:", updateError);
        throw updateError;
      }

      await createCancellationNotifications(bookingToCancel, session.user.id);
      await queryClient.invalidateQueries({ queryKey: ["userBookings", activeView] });

      toast({
        title: "Success",
        description: "Booking cancelled successfully",
        variant: 'default',
        action: (
          <ToastAction altText="Undo" onClick={async () => {
            const restoredStatus =
              previousStatus === "pending" ? "pending"
              : previousStatus === "in_progress" ? "confirmed"
              : previousStatus;
            const { error: undoError } = await supabase
              .from("bookings")
              .update({ status: previousStatus === "pending" ? "pending" : previousStatus === "in_progress"
                ? "confirmed"
                : previousStatus })
              .eq("id", bookingId);
            if (!undoError) {
              await queryClient.invalidateQueries({ queryKey: ["userBookings", activeView] });
              toast({ title: "Undo Successful", description: "Booking cancellation undone.", variant: 'default' });
            } else {
              toast({ title: "Undo Failed", description: "Could not undo cancellation.", variant: 'destructive' });
            }
          }}>Undo</ToastAction>
        )
      });
    } catch (cancelError: any) {
      console.error("Bookings.tsx: Error cancelling booking:", cancelError);
      toast({
        title: "Error",
        description: cancelError.message || "Failed to cancel booking",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["userBookings", activeView] });
    }
  }, [bookings, session, toast, createCancellationNotifications, queryClient, activeView]);

  useEffect(() => {
    if (bookingsError) {
      console.error("Bookings.tsx: Booking query error caught by useEffect:", bookingsError);
      toast({
        title: "Error loading bookings",
        description: "Please try again later or contact support",
        variant: "destructive",
      });
    }
  }, [bookingsError, toast]);

  useEffect(() => {
    if (!isLoadingBookings && (!bookings || bookings.length === 0)) {
      console.log(`Bookings.tsx: No ${activeView} bookings found in the query result after loading.`);
    }
  }, [bookings, isLoadingBookings, activeView]);

  const getStatusCounts = useCallback(() => {
    // Status counts now exclude "dispute"
    const counts: Record<BookingStatus | "all", number> = {
      all: bookings.length,
      "pending": 0,
      "confirmed": 0,
      "in_progress": 0,
      "completed": 0,
      "cancelled": 0,
      "expired": 0,
    };

    bookings.forEach(booking => {
      const statusKey = booking.status as keyof typeof counts;
      if (counts.hasOwnProperty(statusKey)) {
        counts[statusKey]++;
      }
    });
    return counts;
  }, [bookings]);

  const statusCounts = getStatusCounts();

  const handleStatusFilterChange = useCallback((status: BookingStatus | "all") => {
    setFilterStatus(status);
  }, []);

  const getPageTitle = () => {
    if (activeView === 'host') {
      return "My Bookings";
    } else if (activeView === 'renter') {
      return "My Bookings";
    }
    return "Bookings";
  };

  const handleApproveBooking = async (bookingId: string) => {
    try {
      const bookingToApprove = bookings.find((b) => b.id === bookingId);
      if (!bookingToApprove) return;
      const previousStatus = bookingToApprove.status;

      const { error } = await supabase
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("id", bookingId);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["userBookings", activeView, session?.user?.id] });
      toast({
        title: "Success",
        description: "Booking approved.",
        variant: "default",
        action: (
          <ToastAction altText="Undo" onClick={async () => {
            const { error: undoError } = await supabase
              .from("bookings")
              .update({ status: previousStatus === "pending" ? "pending" : previousStatus === "in_progress"
                ? "confirmed"
                : previousStatus })
              .eq("id", bookingId);
            if (!undoError) {
              await queryClient.invalidateQueries({ queryKey: ["userBookings", activeView, session?.user?.id] });
              toast({ title: "Undo Successful", description: "Booking approval undone.", variant: 'default' });
            } else {
              toast({ title: "Undo Failed", description: "Could not undo approval.", variant: 'destructive' });
            }
          }}>Undo</ToastAction>
        )
      });
    } catch (err) {
      toast({ title: "Error", description: "Failed to approve booking.", variant: "destructive" });
    }
  };

  const handleDeclineBooking = async (bookingId: string) => {
    try {
      const bookingToDecline = bookings.find((b) => b.id === bookingId);
      if (!bookingToDecline) return;
      const previousStatus = bookingToDecline.status;

      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["userBookings", activeView, session?.user?.id] });
      toast({
        title: "Success",
        description: "Booking declined.",
        variant: "default",
        action: (
          <ToastAction altText="Undo" onClick={async () => {
            const { error: undoError } = await supabase
              .from("bookings")
              .update({ status: previousStatus === "pending" ? "pending" : previousStatus === "in_progress"
                ? "confirmed"
                : previousStatus })
              .eq("id", bookingId);
            if (!undoError) {
              await queryClient.invalidateQueries({ queryKey: ["userBookings", activeView, session?.user?.id] });
              toast({ title: "Undo Successful", description: "Booking decline undone.", variant: 'default' });
            } else {
              toast({ title: "Undo Failed", description: "Could not undo decline.", variant: 'destructive' });
            }
          }}>Undo</ToastAction>
        )
      });
    } catch (err) {
      toast({ title: "Error", description: "Failed to decline booking.", variant: "destructive" });
    }
  };

  const handleMessageRenter = (renterId: string, bookingId: string) => {
    navigate(`/chat/${renterId}?booking=${bookingId}`);
  };

  // Bulk selection handlers
  const toggleSelectBooking = useCallback((bookingId: string) => {
    setSelectedBookingIds(prev => 
      prev.includes(bookingId) 
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedBookingIds.length === filteredBookings.length) {
      setSelectedBookingIds([]);
    } else {
      setSelectedBookingIds(filteredBookings.map(booking => booking.id));
    }
  }, [selectedBookingIds.length, filteredBookings]);

  const allSelected = selectedBookingIds.length === filteredBookings.length && filteredBookings.length > 0;

  // Bulk actions
  const handleBulkAccept = useCallback(async () => {
    if (!selectedBookingIds.length) return;
    
    try {
      const promises = selectedBookingIds.map(bookingId => handleApproveBooking(bookingId));
      await Promise.all(promises);
      setSelectedBookingIds([]);
      toast({
        title: "Success",
        description: `${selectedBookingIds.length} booking(s) accepted successfully.`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept some bookings.",
        variant: "destructive",
      });
    }
  }, [selectedBookingIds, handleApproveBooking, toast]);

  const handleBulkReject = useCallback(async () => {
    if (!selectedBookingIds.length) return;
    
    try {
      const promises = selectedBookingIds.map(bookingId => handleDeclineBooking(bookingId));
      await Promise.all(promises);
      setSelectedBookingIds([]);
      toast({
        title: "Success",
        description: `${selectedBookingIds.length} booking(s) rejected successfully.`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject some bookings.",
        variant: "destructive",
      });
    }
  }, [selectedBookingIds, handleDeclineBooking, toast]);

  // Show bulk actions when bookings are selected
  useEffect(() => {
    setShowBulkActions(selectedBookingIds.length > 0);
  }, [selectedBookingIds.length]);

  // Utility to convert bookings to CSV
  function bookingsToCSV(bookings) {
    if (!bookings || bookings.length === 0) return '';
    const header = [
      'Booking ID', 'Car Brand', 'Car Model', 'Start Date', 'End Date', 'Status', 'Total Price', 'Location'
    ];
    const rows = bookings.map(b => [
      b.id,
      b.cars?.brand || '',
      b.cars?.model || '',
      b.start_date,
      b.end_date,
      b.status,
      b.total_price,
      b.cars?.location || ''
    ]);
    const csv = [header, ...rows].map(row => row.map(String).map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    return csv;
  }

  function downloadCSV(bookings) {
    const csv = bookingsToCSV(bookings);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookings.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function downloadPDF(bookings) {
    const doc = new jsPDF();
    const tableColumn = [
      'Booking ID', 'Car Brand', 'Car Model', 'Start Date', 'End Date', 'Status', 'Total Price', 'Location'
    ];
    const tableRows = bookings.map(b => [
      b.id,
      b.cars?.brand || '',
      b.cars?.model || '',
      b.start_date,
      b.end_date,
      b.status,
      b.total_price,
      b.cars?.location || ''
    ]);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });
    doc.save('bookings.pdf');
  }

  if (isLoadingBookings || activeView === null) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-4 space-y-4">
          <div className="px-4 py-4 mb-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" disabled>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Skeleton className="h-8 w-48" />
          </div>
          {canBeHost && <Skeleton className="h-10 w-full mb-6" />}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <Skeleton className="h-10 w-full sm:flex-1" />
                <Skeleton className="h-10 w-full sm:w-[180px]" />
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-4 space-y-4">
        <div className="px-4 py-4 mb-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl md:text-2xl text-left font-semibold">
            {getPageTitle()} ({filteredBookings.length})
          </h1>
          {/* Export Buttons */}
          <Button variant="outline" className="ml-4" onClick={() => downloadCSV(filteredBookings)}>
            Export CSV
          </Button>
          <Button variant="outline" className="ml-2" onClick={() => downloadPDF(filteredBookings)}>
            Export PDF
          </Button>
        </div>
        <RoleSwitcher
          currentUserRole={activeView}
          onRoleChange={setActiveView}
          canBeHost={canBeHost}
        />
        <div className="px-4 mb-4 flex flex-col sm:flex-row gap-4">
          <Input
            type="text"
            placeholder="Search by renter, model, brand, date, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:flex-1"
          />
          <Select value={filterStatus} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Bookings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bookings ({statusCounts.all})</SelectItem>
              <SelectItem value="pending">Pending ({statusCounts.pending})</SelectItem>
              <SelectItem value="confirmed">Confirmed ({statusCounts.confirmed})</SelectItem>
              <SelectItem value="in_progress">In Progress ({statusCounts.in_progress})</SelectItem>
              <SelectItem value="completed">Completed ({statusCounts.completed})</SelectItem>
              <SelectItem value="cancelled">Cancelled ({statusCounts.cancelled})</SelectItem>
              <SelectItem value="expired">Expired ({statusCounts.expired})</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortField} onValueChange={value => setSortField(value as typeof sortField)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Newest</SelectItem>
              <SelectItem value="start_date">Start Date</SelectItem>
              <SelectItem value="end_date">End Date</SelectItem>
              <SelectItem value="total_price">Price</SelectItem>
              <SelectItem value="car_brand">Car Brand</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="ml-2"
            onClick={() => setSortOrder(order => (order === "asc" ? "desc" : "asc"))}
          >
            {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
          </Button>
          
          {/* View Toggle - Desktop Only */}
          <div className="hidden sm:flex items-center gap-1 ml-2">
            <Button
              variant={viewMode === "cards" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="flex items-center gap-2"
            >
              <Grid3X3 className="h-4 w-4" />
              Cards
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="flex items-center gap-2"
            >
              <TableIcon className="h-4 w-4" />
              Table
            </Button>
          </div>
        </div>
        
        {/* Bulk Actions */}
        {selectedBookingIds.length > 0 && (
          <div className="px-4 mb-4 p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {selectedBookingIds.length} booking(s) selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBookingIds([])}
                >
                  Clear Selection
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkAccept}
                >
                  Accept Selected
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkReject}
                >
                  Reject Selected
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <div className="px-4">
          {filteredBookings.length > 0 ? (
            <BookingTable
              bookings={filteredBookings}
              onCancelBooking={handleCancelBooking}
              onApproveBooking={handleApproveBooking}
              onDeclineBooking={handleDeclineBooking}
              onMessage={handleMessageRenter}
              showNetEarnings={activeView === "host"}
              isHost={activeView === "host"}
              selectedBookingIds={selectedBookingIds}
              toggleSelectBooking={toggleSelectBooking}
              allSelected={allSelected}
              toggleSelectAll={toggleSelectAll}
              viewMode={viewMode}
            />
          ) : (
            <p className="text-center text-muted-foreground mt-8">
              No {activeView === 'renter' ? 'bookings' : 'rentals'} found matching your search criteria or selected status.
            </p>
          )}
        </div>
      </div>
      <Navigation />
    </div>
  );
};

export default Bookings;

interface RoleSwitcherProps {
  currentUserRole: "host" | "renter";
  onRoleChange: (role: "host" | "renter") => void;
  canBeHost: boolean;
}

interface BookingTableProps {
  bookings: Booking[];
  onCancelBooking: (bookingId: string) => Promise<void>;
  onApproveBooking: (bookingId: string) => Promise<void>;
  onDeclineBooking: (bookingId: string) => Promise<void>;
  onMessageRenter: (renterId: string, bookingId: string) => void;
  showNetEarnings?: boolean;  
}

