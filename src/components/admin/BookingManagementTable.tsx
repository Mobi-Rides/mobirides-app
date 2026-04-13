import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTableSort } from "@/hooks/useTableSort";
import { SortableTableHead } from "./SortableTableHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Download, Eye } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV, buildExportFilename } from "@/utils/exportToCSV";
import { BookingDetailsDialog } from "./BookingDetailsDialog";

interface Booking {
  id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: string;
  created_at: string;
  renter_id: string;
  car_id: string;
  cars?: {
    brand: string;
    model: string;
    year: number;
  } | null;
  renter?: {
    full_name: string | null;
  } | null;
}

const useAdminBookings = () => {
  return useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async (): Promise<Booking[]> => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id, start_date, end_date, total_price, status, created_at, renter_id, car_id,
          cars:car_id (brand, model, year),
          renter:renter_id (full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

export const BookingManagementTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  
  const { data: bookings, isLoading, error, refetch } = useAdminBookings();

  const filteredBookings = useMemo(() => bookings?.filter(booking =>
    booking.cars?.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.cars?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.renter?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.status.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [], [bookings, searchTerm]);

  const { sortedData: sortedBookings, sortKey, sortDirection, handleSort } = useTableSort<Booking>(filteredBookings);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "confirmed": return "default";
      case "pending": return "secondary";
      case "completed": return "outline";
      case "cancelled": return "destructive";
      default: return "outline";
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: "confirmed" | "cancelled" | "completed") => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;
      
      refetch();
      toast.success(`Booking ${newStatus} successfully`);
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("Failed to update booking");
    }
  };

  const handleExport = () => {
    const rows = sortedBookings.map((b) => ({
      vehicle: b.cars ? `${b.cars.brand} ${b.cars.model} (${b.cars.year})` : "Unknown",
      renter: b.renter?.full_name ?? "Unknown",
      start_date: new Date(b.start_date).toLocaleDateString(),
      end_date: new Date(b.end_date).toLocaleDateString(),
      total_bwp: b.total_price,
      status: b.status,
      created: new Date(b.created_at).toLocaleDateString(),
      booking_id: b.id,
    }));
    const columns = [
      { key: "booking_id", label: "Booking ID" },
      { key: "vehicle", label: "Vehicle" },
      { key: "renter", label: "Renter" },
      { key: "start_date", label: "Start Date" },
      { key: "end_date", label: "End Date" },
      { key: "total_bwp", label: "Total (BWP)" },
      { key: "status", label: "Status" },
      { key: "created", label: "Created" },
    ];
    exportToCSV(rows, buildExportFilename("bookings"), columns);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Failed to load bookings</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Bookings ({filteredBookings.length})</CardTitle>
              {sortedBookings.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="gap-2 w-fit"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[100px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead sortKey="cars.brand" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Vehicle</SortableTableHead>
                    <SortableTableHead sortKey="renter.full_name" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Renter</SortableTableHead>
                    <SortableTableHead sortKey="start_date" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Dates</SortableTableHead>
                    <SortableTableHead sortKey="total_price" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Total</SortableTableHead>
                    <SortableTableHead sortKey="status" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Status</SortableTableHead>
                    <SortableTableHead sortKey="created_at" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Created</SortableTableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        {booking.cars ? 
                          `${booking.cars.brand} ${booking.cars.model} (${booking.cars.year})` 
                          : "Unknown Vehicle"
                        }
                      </TableCell>
                      <TableCell>{booking.renter?.full_name || "Unknown"}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(booking.start_date).toLocaleDateString()} - 
                          {new Date(booking.end_date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>P{booking.total_price}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(booking.status)}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(booking.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedBookingId(booking.id)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {booking.status === "pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateBookingStatus(booking.id, "confirmed")}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => updateBookingStatus(booking.id, "cancelled")}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                          {booking.status === "confirmed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateBookingStatus(booking.id, "completed")}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      <BookingDetailsDialog bookingId={selectedBookingId} onClose={() => setSelectedBookingId(null)} />
    </>
  );
};