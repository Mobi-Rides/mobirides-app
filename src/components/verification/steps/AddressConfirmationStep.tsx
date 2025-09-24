
/**
 * Address Confirmation Step Component
 * Confirms user's residential address
 */

import React, { useState, useEffect } from "react";
import { useVerification } from "@/hooks/useVerification";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft, MapPin, CheckCircle, Edit3 } from "lucide-react";
import { toast } from "sonner";

interface AddressConfirmationStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

export const AddressConfirmationStep: React.FC<AddressConfirmationStepProps> = ({
  onNext,
  onPrevious,
}) => {
  const { verificationData, updateAddressConfirmation, updatePersonalInfo, isLoading } = useVerification();
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [addressData, setAddressData] = useState({
    street: "",
    area: "",
    city: "",
    postalCode: "",
  });

  // Initialize address data from verification data
  useEffect(() => {
    if (verificationData?.personal_info?.address) {
      setAddressData(verificationData.personal_info.address as any);
    }
  }, [verificationData]);

  const handleSaveAddress = async () => {
    try {
      // Update personal info with new address
      await updatePersonalInfo({
        ...verificationData?.personal_info,
        address: addressData,
      });
      setIsEditing(false);
      toast.success("Address updated successfully!");
    } catch (error) {
      console.error("Failed to update address:", error);
      toast.error("Failed to update address");
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    setAddressData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleConfirmAddress = async () => {
    await updateAddressConfirmation({
      currentAddress: addressData,
      confirmationMethod: "document",
      isConfirmed: true,
      confirmationDate: new Date().toISOString(),
    });

    setIsConfirmed(true);
    toast.success("Address confirmed successfully!");
  };

  const handleNext = () => {
    if (!isConfirmed) {
      toast.error("Please confirm your address first");
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Address Confirmation</h2>
        <p className="text-muted-foreground">
          Confirm your residential address details
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Residential Address</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEditing ? (
            <div className="bg-muted p-4 rounded-lg">
              <div className="space-y-2">
                <p><strong>Street:</strong> {addressData.street || "Not provided"}</p>
                <p><strong>Area:</strong> {addressData.area || "Not provided"}</p>
                <p><strong>City:</strong> {addressData.city || "Not provided"}</p>
                <p><strong>Postal Code:</strong> {addressData.postalCode || "Not provided"}</p>
              </div>
              <div className="mt-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Address
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-street">Street Address</Label>
                  <Input
                    id="edit-street"
                    value={addressData.street}
                    onChange={(e) => handleAddressChange("street", e.target.value)}
                    placeholder="Street address"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-area">Area/Suburb</Label>
                  <Input
                    id="edit-area"
                    value={addressData.area}
                    onChange={(e) => handleAddressChange("area", e.target.value)}
                    placeholder="Area or suburb"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-city">City</Label>
                  <Input
                    id="edit-city"
                    value={addressData.city}
                    onChange={(e) => handleAddressChange("city", e.target.value)}
                    placeholder="City"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-postalCode">Postal Code</Label>
                  <Input
                    id="edit-postalCode"
                    value={addressData.postalCode}
                    onChange={(e) => handleAddressChange("postalCode", e.target.value)}
                    placeholder="Postal code"
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleSaveAddress} disabled={isLoading}>
                  Save Changes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setAddressData((verificationData?.personal_info?.address as any) || {
                      street: "",
                      area: "",
                      city: "",
                      postalCode: "",
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p>
              Please confirm that the address above is correct. This address will be used for 
              verification purposes and should match your proof of address document.
            </p>
          </div>

          {!isConfirmed ? (
            <Button onClick={handleConfirmAddress} className="w-full">
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Address
            </Button>
          ) : (
            <div className="flex items-center justify-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-green-700">Address confirmed successfully!</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <Button onClick={handleNext} disabled={isLoading || !isConfirmed}>
          <span>Continue to Review</span>
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
