
/**
 * Address Confirmation Step Component
 * Confirms user's residential address
 */

import React, { useState } from "react";
import { useVerification } from "@/contexts/VerificationContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, ArrowLeft, MapPin, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface AddressConfirmationStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

export const AddressConfirmationStep: React.FC<AddressConfirmationStepProps> = ({
  onNext,
  onPrevious,
}) => {
  const { verificationData, updateAddressConfirmation, isLoading } = useVerification();
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleConfirmAddress = async () => {
    await updateAddressConfirmation({
      currentAddress: verificationData?.personal_info?.address || {
        street: "",
        area: "",
        city: "",
        postalCode: "",
      },
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
          <div className="bg-muted p-4 rounded-lg">
            <div className="space-y-2">
              <p><strong>Street:</strong> {verificationData?.personal_info?.address?.street || "Not provided"}</p>
              <p><strong>Area:</strong> {verificationData?.personal_info?.address?.area || "Not provided"}</p>
              <p><strong>City:</strong> {verificationData?.personal_info?.address?.city || "Not provided"}</p>
              <p><strong>Postal Code:</strong> {verificationData?.personal_info?.address?.postalCode || "Not provided"}</p>
            </div>
          </div>

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
