import React, { useState, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CarEditDialog } from "./CarEditDialog";
import { Search, Eye, Edit, CheckCircle, XCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV, buildExportFilename } from "@/utils/exportToCSV";

interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  price_per_day: number;
  location: string;
  is_available: boolean;
  created_at: string;
  owner_id: string;
  image_url: string | null;
  description?: string | null;
  profiles?: {
    full_name: string | null;
  } | null;
}

const useAdminCars = () => {
  return useQuery({
    queryKey: ["admin-cars"],
    queryFn: async (): Promise<Car[]> => {
      const { data, error } = await supabase
        .from("cars")
        .select(`
          id, brand, model, year, price_per_day, location, 
          is_available, created_at, owner_id, image_url, description,
          profiles:owner_id (full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

export const CarManagementTable = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: cars, isLoading, error, refetch } = useAdminCars();

  const filteredCars = useMemo(() => cars?.filter(car =>
    car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [], [cars, searchTerm]);

  const { sortedData: sortedCars, sortKey, sortDirection, handleSort } = useTableSort<Car>(filteredCars);

  const handleToggleAvailability = async (carId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("cars")
        .update({ is_available: !currentStatus })
        .eq("id", carId);

      if (error) throw error;

      refetch();
      toast.success(`Car ${!currentStatus ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      console.error("Error updating car:", error);
      toast.error("Failed to update car status");
    }
  };

  const handleEditCar = (car: Car) => {
    setSelectedCar(car);
    setIsEditDialogOpen(true);
  };

  const handleUpdateSuccess = () => {
    refetch();
    setIsEditDialogOpen(false);
    setSelectedCar(null);
    toast.success("Car updated successfully");
  };

  const handleExport = () => {
    const rows = sortedCars.map((c) => ({
      vehicle: `${c.brand} ${c.model}`,
      year: c.year,
      owner: c.profiles?.full_name ?? "Unknown",
      location: c.location,
      price_per_day_bwp: c.price_per_day,
      status: c.is_available ? "Available" : "Disabled",
      added: new Date(c.created_at).toLocaleDateString(),
      car_id: c.id,
    }));
    const columns = [
      { key: "car_id", label: "Car ID" },
      { key: "vehicle", label: "Vehicle" },
      { key: "year", label: "Year" },
      { key: "owner", label: "Owner" },
      { key: "location", label: "Location" },
      { key: "price_per_day_bwp", label: "Price/Day (BWP)" },
      { key: "status", label: "Status" },
      { key: "added", label: "Added" },
    ];
    exportToCSV(rows, buildExportFilename("cars"), columns);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Failed to load cars</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cars..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Cars ({filteredCars.length})</CardTitle>
            {sortedCars.length > 0 && (
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
                  <SortableTableHead sortKey="brand" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Vehicle</SortableTableHead>
                  <SortableTableHead sortKey="profiles.full_name" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Owner</SortableTableHead>
                  <SortableTableHead sortKey="location" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Location</SortableTableHead>
                  <SortableTableHead sortKey="price_per_day" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Price/Day</SortableTableHead>
                  <SortableTableHead sortKey="is_available" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Status</SortableTableHead>
                  <SortableTableHead sortKey="created_at" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Added</SortableTableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCars.map((car) => (
                  <TableRow key={car.id}>
                    <TableCell className="font-medium">
                      {car.brand} {car.model} ({car.year})
                    </TableCell>
                    <TableCell>{car.profiles?.full_name || "Unknown"}</TableCell>
                    <TableCell>{car.location}</TableCell>
                    <TableCell>P{car.price_per_day}</TableCell>
                    <TableCell>
                      <Badge variant={car.is_available ? "default" : "secondary"}>
                        {car.is_available ? "Available" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(car.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/car/${car.id}`)}
                          title="View public listing"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCar(car)}
                          title="Quick edit (details & availability)"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/edit-car/${car.id}`)}
                          title="Edit listing & images"
                        >
                          Edit listing
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleAvailability(car.id, car.is_available)}
                        >
                          {car.is_available ? (
                            <XCircle className="h-4 w-4 text-destructive" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedCar && (
        <CarEditDialog
          car={selectedCar}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
};