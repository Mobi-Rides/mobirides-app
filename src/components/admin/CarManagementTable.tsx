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
import { CarEditDialog } from "./CarEditDialog";
import { Search, Eye, Edit, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

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
          is_available, created_at, owner_id,
          profiles:owner_id (full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

export const CarManagementTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const { data: cars, isLoading, error, refetch } = useAdminCars();

  const filteredCars = cars?.filter(car =>
    car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
          <CardTitle>Cars ({filteredCars.length})</CardTitle>
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
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Price/Day</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCars.map((car) => (
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
                          onClick={() => handleEditCar(car)}
                        >
                          <Edit className="h-4 w-4" />
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