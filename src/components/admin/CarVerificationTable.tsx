import React, { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, CheckCircle, XCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import { PaginatedTable } from "./PaginatedTable";

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
        .eq("is_available", false)
        .order("created_at", { ascending: false })
        .limit(10);

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
  const [searchTerm, setSearchTerm] = useState("");
  const { data: cars, isLoading, error, refetch } = usePendingCars();

  const filteredCars = cars?.filter(car =>
    car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const displayCars = isPreview ? filteredCars.slice(0, maxItems) : filteredCars;

  const handleApproveCar = async (carId: string) => {
    try {
      const { error } = await supabase
        .from("cars")
        .update({ is_available: true })
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
        .delete()
        .eq("id", carId);

      if (error) throw error;
      
      refetch();
      toast.success("Car rejected and removed");
    } catch (error) {
      console.error("Error rejecting car:", error);
      toast.error("Failed to reject car");
    }
  };

  const renderCarRow = (car: PendingCar) => (
    <TableRow key={car.id}>
      <TableCell className="font-medium">{car.brand}</TableCell>
      <TableCell>{car.model}</TableCell>
      <TableCell>{car.year}</TableCell>
      <TableCell>{car.profiles?.full_name || "Unknown"}</TableCell>
      <TableCell>
        {new Date(car.created_at).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
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
            <PaginatedTable
              data={displayCars}
              itemsPerPage={10}
              renderItem={(car) => renderCarRow(car)}
              renderHeader={() => (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Make</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Submitted At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody />
                </Table>
              )}
              className="overflow-x-auto"
            />
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
            <TableHead>Make</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Seller</TableHead>
            <TableHead>Submitted At</TableHead>
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