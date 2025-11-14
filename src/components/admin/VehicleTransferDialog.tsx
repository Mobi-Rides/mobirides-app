import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle, Search, Car, User, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface VehicleTransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId?: string;
  fromOwnerId?: string;
}

interface UserProfile {
  id: string;
  full_name: string | null;
  email?: string;
  phone_number: string | null;
  role: "renter" | "host" | "admin" | "super_admin";
}

interface VehicleData {
  id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  owner_id: string;
  owner_profile?: UserProfile;
}

interface TransferValidation {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export const VehicleTransferDialog: React.FC<VehicleTransferDialogProps> = ({
  isOpen,
  onClose,
  vehicleId,
  fromOwnerId,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [transferReason, setTransferReason] = useState("");
  const [validationResult, setValidationResult] = useState<TransferValidation | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const queryClient = useQueryClient();

  // Fetch vehicle data
  const { data: vehicle, isLoading: vehicleLoading } = useQuery<VehicleData>({
    queryKey: ["vehicle-transfer-data", vehicleId],
    queryFn: async (): Promise<VehicleData> => {
      if (!vehicleId) throw new Error("Vehicle ID is required");

      const { data: car, error: carError } = await supabase
        .from("cars")
        .select(`
          id, make, model, year, license_plate, owner_id,
          profiles!cars_owner_id_fkey (
            id, full_name, phone_number, role
          )
        `)
        .eq("id", vehicleId)
        .single();

      if (carError) throw carError;

      return {
        id: car.id,
        make: car.make,
        model: car.model,
        year: car.year,
        license_plate: car.license_plate,
        owner_id: car.owner_id,
        owner_profile: car.profiles as UserProfile,
      };
    },
    enabled: isOpen && !!vehicleId,
  });

  // Search users for transfer target
  const { data: searchResults, isLoading: searchLoading } = useQuery<UserProfile[]>({
    queryKey: ["user-search", searchTerm],
    queryFn: async (): Promise<UserProfile[]> => {
      if (searchTerm.length < 2) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone_number, role")
        .or(`full_name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%`)
        .eq("role", "host") // Only allow transfer to hosts
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: searchTerm.length >= 2,
  });

  // Validate transfer
  const validateTransfer = async (toUserId: string) => {
    if (!vehicleId || !fromOwnerId) return;

    setIsValidating(true);
    try {
      const { data, error } = await supabase.rpc("validate_vehicle_transfer", {
        p_vehicle_id: vehicleId,
        p_from_owner_id: fromOwnerId,
        p_to_owner_id: toUserId,
      });

      if (error) throw error;
      setValidationResult(data as TransferValidation);
    } catch (error) {
      console.error("Validation error:", error);
      toast.error("Failed to validate transfer");
    } finally {
      setIsValidating(false);
    }
  };

  // Transfer vehicle mutation
  const transferMutation = useMutation({
    mutationFn: async () => {
      if (!vehicleId || !fromOwnerId || !selectedUser || !transferReason.trim()) {
        throw new Error("All fields are required");
      }

      const { data, error } = await supabase.rpc("transfer_vehicle", {
        p_vehicle_id: vehicleId,
        p_from_owner_id: fromOwnerId,
        p_to_owner_id: selectedUser.id,
        p_reason: transferReason.trim(),
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Vehicle transferred successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle-transfers"] });
      onClose();
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(`Transfer failed: ${error.message}`);
    },
  });

  const resetForm = () => {
    setSearchTerm("");
    setSelectedUser(null);
    setTransferReason("");
    setValidationResult(null);
  };

  const handleUserSelect = async (user: UserProfile) => {
    setSelectedUser(user);
    setSearchTerm(user.full_name || user.phone_number || "");
    await validateTransfer(user.id);
  };

  const handleTransfer = () => {
    if (!validationResult?.valid) {
      toast.error("Cannot proceed with transfer due to validation errors");
      return;
    }
    transferMutation.mutate();
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Transfer Vehicle Ownership
          </DialogTitle>
          <DialogDescription>
            Transfer vehicle ownership from one user to another. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Vehicle Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Vehicle Details</CardTitle>
            </CardHeader>
            <CardContent>
              {vehicleLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : vehicle ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    <span className="font-medium">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </span>
                    <Badge variant="outline">{vehicle.license_plate}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Current Owner: {vehicle.owner_profile?.full_name || "Unknown"}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Vehicle information not available</p>
              )}
            </CardContent>
          </Card>

          {/* Target User Selection */}
          <div className="space-y-2">
            <Label htmlFor="user-search">Transfer to User</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="user-search"
                placeholder="Search by name or phone number..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (selectedUser && e.target.value !== (selectedUser.full_name || selectedUser.phone_number)) {
                    setSelectedUser(null);
                    setValidationResult(null);
                  }
                }}
                className="pl-8"
              />
            </div>

            {/* Search Results */}
            {searchTerm.length >= 2 && (
              <div className="border rounded-md max-h-40 overflow-y-auto">
                {searchLoading ? (
                  <div className="p-4">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : searchResults && searchResults.length > 0 ? (
                  searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                      onClick={() => handleUserSelect(user)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{user.full_name || "No name"}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.phone_number}
                          </div>
                        </div>
                        <Badge variant="secondary">{user.role}</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-sm text-muted-foreground">
                    No users found
                  </div>
                )}
              </div>
            )}

            {/* Selected User Display */}
            {selectedUser && (
              <div className="p-3 bg-muted rounded-md">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Selected: {selectedUser.full_name}</span>
                  <Badge variant="secondary">{selectedUser.role}</Badge>
                </div>
              </div>
            )}
          </div>

          {/* Transfer Reason */}
          <div className="space-y-2">
            <Label htmlFor="transfer-reason">Transfer Reason *</Label>
            <Textarea
              id="transfer-reason"
              placeholder="Provide a detailed reason for this ownership transfer..."
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              This reason will be logged for audit purposes and may be visible to both users.
            </p>
          </div>

          {/* Validation Results */}
          {validationResult && (
            <div className="space-y-3">
              {validationResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-1">Transfer cannot proceed:</div>
                    <ul className="list-disc list-inside text-sm">
                      {validationResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {validationResult.warnings.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-1">Warnings:</div>
                    <ul className="list-disc list-inside text-sm">
                      {validationResult.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {validationResult.valid && validationResult.errors.length === 0 && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Transfer validation passed. Ready to proceed.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={
              !selectedUser ||
              !transferReason.trim() ||
              !validationResult?.valid ||
              validationResult?.errors.length > 0 ||
              transferMutation.isPending ||
              isValidating
            }
            className="w-full sm:w-auto"
          >
            {transferMutation.isPending ? "Transferring..." : "Transfer Vehicle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
