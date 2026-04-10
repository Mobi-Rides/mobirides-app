import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, CheckCircle, XCircle, Eye, Pencil, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface PendingCar {
  id: string;
  brand: string;
  model: string;
  year: number;
  price_per_day: number;
  location: string;
  is_available: boolean;
  created_at: string;
  owner_id: string;
  profiles?: {
    full_name: string | null;
  } | null;
}

const usePendingCars = () => {
  return useQuery({
    queryKey: ["pending-cars"],
    queryFn: async (): Promise<PendingCar[]> => {
      const { data, error } = await supabase
        .from("cars")
        .select(`
          id, brand, model, year, price_per_day, location, 
          is_available, created_at, owner_id,
          profiles:owner_id (full_name)
        `)
        .eq("verification_status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

interface CarVerificationTableProps {
  isPreview?: boolean;
  maxItems?: number;
}

export const CarVerificationTable: React.FC<CarVerificationTableProps> = ({ 
  isPreview = false, 
  maxItems = 5 
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = isPreview ? maxItems : 5;
  const { data: cars, isLoading, error, refetch } = usePendingCars();

  const filteredCars = cars?.filter(car =>
    car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const { sortedData: sortedCars, sortKey, sortDirection, handleSort } = useTableSort<PendingCar>(filteredCars);

  const paginatedCars = sortedCars.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const displayCars = isPreview ? sortedCars.slice(0, maxItems) : paginatedCars;
  const totalPages = Math.ceil(sortedCars.length / itemsPerPage);

  const handleApproveCar = async (carId: string) => {
    try {
      const { error } = await supabase
        .from("cars")
        .update({ verification_status: "approved", is_available: true })
        .eq("id", carId);

      if (error) throw error;
      
      refetch();
      toast.success("Car approved successfully");
    } catch (error) {
      console.error("Error approving car:", error);
      toast.error("Failed to approve car");
    }
  };

  const handleRejectCar = async (carId: string) => {
    try {
      const { error } = await supabase
        .from("cars")
        .update({ verification_status: "rejected", is_available: false })
        .eq("id", carId);

      if (error) throw error;
      
      refetch();
      toast.success("Car listing rejected");
    } catch (error) {
      console.error("Error rejecting car:", error);
      toast.error("Failed to reject car");
    }
  };

  const renderCarRow = (car: PendingCar) => {
    const daysPending = Math.floor((Date.now() - new Date(car.created_at).getTime()) / (1000 * 60 * 60 * 24));
    const isStale = daysPending > 30;
    
    return (
    <TableRow key={car.id}>
      <TableCell className="font-medium">{car.brand}</TableCell>
      <TableCell>{car.model}</TableCell>
      <TableCell>{car.year}</TableCell>
      <TableCell>{car.profiles?.full_name || "Unknown"}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          {new Date(car.created_at).toLocaleDateString()}
          {isStale && (
            <span title={`Pending for ${daysPending} days`}>
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/edit-car/${car.id}`)}
            title="Edit listing"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleApproveCar(car.id)}
          >
            <CheckCircle className="h-4 w-4 text-green-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRejectCar(car.id)}
          >
            <XCircle className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
    );
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Failed to load pending cars</p>
        </CardContent>
      </Card>
    );
  }

  if (!isPreview) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Car Verification Queue ({filteredCars.length})</CardTitle>
            <div className="relative max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cars..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead sortKey="brand" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Make</SortableTableHead>
                    <SortableTableHead sortKey="model" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Model</SortableTableHead>
                    <SortableTableHead sortKey="year" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Year</SortableTableHead>
                    <SortableTableHead sortKey="profiles.full_name" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Seller</SortableTableHead>
                    <SortableTableHead sortKey="created_at" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Submitted At</SortableTableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayCars.map((car) => renderCarRow(car))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {!isLoading && filteredCars.length > 0 && !isPreview && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <div className="text-sm text-muted-foreground order-2 sm:order-1">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, sortedCars.length)} of {sortedCars.length}{" "}
                entries
              </div>
              {totalPages > 1 && (
                <div className="order-1 sm:order-2">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>

                      {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNum)}
                              isActive={currentPage === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          )}
          
          {!isLoading && filteredCars.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No pending car verifications
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Preview mode
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (displayCars.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-4">
        No pending car verifications
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead sortKey="brand" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Make</SortableTableHead>
            <SortableTableHead sortKey="model" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Model</SortableTableHead>
            <SortableTableHead sortKey="year" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Year</SortableTableHead>
            <SortableTableHead sortKey="profiles.full_name" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Seller</SortableTableHead>
            <SortableTableHead sortKey="created_at" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Submitted At</SortableTableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayCars.map((car) => renderCarRow(car))}
        </TableBody>
      </Table>
    </div>
  );
};