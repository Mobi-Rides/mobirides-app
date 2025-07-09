/**
 * Address Confirmation Step Component
 * Handles verification of user's residential address
 * Validates address against uploaded documents and personal information
 */

import React, { useState, useEffect, useRef } from "react";
import { useVerification } from "@/contexts/VerificationContext";
import {
  AddressConfirmation,
  DocumentType,
  DocumentUpload,
  VerificationStatus,
} from "@/types/verification";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  FileText,
  CreditCard,
  Zap,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface AddressConfirmationStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

/**
 * Address Display Component
 * Shows the address to be confirmed
 */
const AddressDisplay: React.FC<{
  address: any;
  title: string;
}> = ({ address, title }) => {
  if (!address) return null;

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="font-medium mb-2">{title}</h4>
      <div className="space-y-1 text-sm">
        <p>{address.street}</p>
        <p>{address.area}</p>
        <p>
          {address.city}
          {address.postalCode ? `, ${address.postalCode}` : ""}
        </p>
        <p className="text-muted-foreground">Botswana</p>
      </div>
    </div>
  );
};

/**
 * Confirmation Method Option Component
 */
const ConfirmationMethodOption: React.FC<{
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  isAvailable: boolean;
  isSelected: boolean;
  onSelect: (value: string) => void;
}> = ({
  value,
  label,
  description,
  icon,
  isAvailable,
  isSelected,
  onSelect,
}) => {
  const handleClick = () => {
    if (isAvailable) {
      onSelect(value);
    }
  };

  return (
    <div
      className={`
      relative border rounded-lg p-4 transition-all
      ${isSelected ? "border-primary bg-primary/5" : "border-gray-200"}
      ${!isAvailable ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"}
    `}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        <RadioGroupItem value={value} disabled={!isAvailable} />
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            {icon}
            <h4 className="font-medium">{label}</h4>
            {!isAvailable && (
              <Badge variant="outline" className="text-xs">
                Not Available
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Document Upload Section Component
 * Allows uploading proof of address document directly in address confirmation step
 */
const DocumentUploadSection: React.FC = () => {
  const { updateDocument } = useVerification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadedFile) return;

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];

    if (uploadedFile.size > maxSize) {
      toast.error("File size must be less than 10MB");
      return;
    }

    if (!allowedTypes.includes(uploadedFile.type)) {
      toast.error("File must be a JPEG, PNG, or PDF");
      return;
    }

    try {
      setIsUploading(true);

      const documentUpload: DocumentUpload = {
        type: DocumentType.PROOF_OF_ADDRESS,
        file: uploadedFile,
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
        uploadedAt: new Date().toISOString(),
        status: VerificationStatus.PENDING_REVIEW,
      };

      await updateDocument(documentUpload);
      toast.success("Proof of address uploaded successfully!");
      setUploadedFile(null);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Failed to upload document:", error);
      toast.error("Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="h-5 w-5" />
          <span>Upload Proof of Address</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label
              htmlFor="proof-address-upload"
              className="text-sm font-medium"
            >
              Select Document
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Upload a utility bill, bank statement, or other proof of address
              (JPEG, PNG, PDF)
            </p>
            <Input
              id="proof-address-upload"
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileSelect}
              className="cursor-pointer"
            />
          </div>

          {uploadedFile && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{uploadedFile.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(uploadedFile.size / 1024 / 1024).toFixed(1)} MB)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!uploadedFile || isUploading}
            className="w-full"
          >
            {isUploading ? "Uploading..." : "Upload Document"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Main Address Confirmation Step Component
 */
export const AddressConfirmationStep: React.FC<
  AddressConfirmationStepProps
> = ({ onNext, onPrevious }) => {
  const { verificationData, updateAddressConfirmation, isLoading } =
    useVerification();

  const [confirmationMethod, setConfirmationMethod] = useState<
    "document" | "utility_bill" | "bank_statement" | ""
  >("");
  const [isConfirming, setIsConfirming] = useState(false);

  // Load existing address confirmation data
  useEffect(() => {
    if (verificationData?.addressConfirmation) {
      const addressData = verificationData.addressConfirmation;

      if (addressData.confirmationMethod) {
        setConfirmationMethod(addressData.confirmationMethod);
      }
    }
  }, [verificationData?.addressConfirmation]);

  /**
   * Check what confirmation methods are available based on uploaded documents
   */
  const getAvailableConfirmationMethods = () => {
    if (!verificationData?.documents)
      return {
        document: false,
        utility_bill: false,
        bank_statement: false,
      };

    const uploadedDocuments = verificationData.documents;
    const hasProofOfAddress = uploadedDocuments.some(
      (doc) =>
        doc.type === "proof_of_address" &&
        (doc.status === "completed" ||
          doc.status === "pending_review" ||
          doc.status === "in_progress"),
    );

    return {
      document: hasProofOfAddress,
      utility_bill: hasProofOfAddress,
      bank_statement: hasProofOfAddress,
    };
  };

  const availableMethods = getAvailableConfirmationMethods();

  /**
   * Handle address confirmation
   */
  const handleConfirmAddress = async () => {
    if (!confirmationMethod) {
      toast.error("Please select a confirmation method");
      return;
    }

    if (!verificationData?.personalInfo?.address) {
      toast.error("No address information found");
      return;
    }

    try {
      setIsConfirming(true);

      // Simulate address verification process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const addressData: Partial<AddressConfirmation> = {
        currentAddress: verificationData.personalInfo.address,
        confirmationMethod,
        isConfirmed: true,
        confirmationDate: new Date().toISOString(),
      };

      await updateAddressConfirmation(addressData);

      toast.success("Address confirmed successfully!");

      // Auto-advance to next step
      setTimeout(() => {
        onNext();
      }, 1000);
    } catch (error) {
      console.error("Failed to confirm address:", error);
      toast.error("Failed to confirm address");
    } finally {
      setIsConfirming(false);
    }
  };

  // Check if address is already confirmed
  const isAddressConfirmed = verificationData?.addressConfirmation?.isConfirmed;

  if (isAddressConfirmed) {
    return (
      <div className="text-center py-8">
        <div className="mb-6">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-700 mb-2">
            Address Confirmed!
          </h2>
          <p className="text-muted-foreground mb-4">
            Your residential address has been verified.
          </p>

          <AddressDisplay
            address={verificationData.addressConfirmation.currentAddress}
            title="Confirmed Address"
          />
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onPrevious}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <Button onClick={onNext}>
            Continue to Review
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step Introduction */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Confirm Your Address</h2>
        <p className="text-muted-foreground">
          We need to verify your residential address matches your documents
        </p>
      </div>

      {/* Current Address Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Address to Confirm</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {verificationData?.personalInfo?.address ? (
            <AddressDisplay
              address={verificationData.personalInfo.address}
              title="Personal Information Address"
            />
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No address information found. Please complete the personal
                information step first.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Confirmation Method</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={confirmationMethod}
            onValueChange={(value) => setConfirmationMethod(value as any)}
          >
            <div className="space-y-4">
              <ConfirmationMethodOption
                value="utility_bill"
                label="Utility Bill Verification"
                description="Confirm address using uploaded utility bill (electricity, water, internet)"
                icon={<Zap className="h-5 w-5 text-blue-500" />}
                isAvailable={availableMethods.utility_bill}
                isSelected={confirmationMethod === "utility_bill"}
                onSelect={setConfirmationMethod}
              />

              <ConfirmationMethodOption
                value="bank_statement"
                label="Bank Statement Verification"
                description="Confirm address using uploaded bank statement"
                icon={<CreditCard className="h-5 w-5 text-green-500" />}
                isAvailable={availableMethods.bank_statement}
                isSelected={confirmationMethod === "bank_statement"}
                onSelect={setConfirmationMethod}
              />

              <ConfirmationMethodOption
                value="document"
                label="Document-Based Verification"
                description="Confirm address using other uploaded proof of address documents"
                icon={<FileText className="h-5 w-5 text-purple-500" />}
                isAvailable={availableMethods.document}
                isSelected={confirmationMethod === "document"}
                onSelect={setConfirmationMethod}
              />
            </div>
          </RadioGroup>

          {!Object.values(availableMethods).some(Boolean) && (
            <div className="mt-4 space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No proof of address document found. Please upload a valid
                  proof of address document below or return to the previous
                  step.
                </AlertDescription>
              </Alert>

              <DocumentUploadSection />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Address Verification Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Document Date</p>
                <p className="text-sm text-muted-foreground">
                  Proof of address must be dated within the last 3 months
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Address Match</p>
                <p className="text-sm text-muted-foreground">
                  Address on document must exactly match your provided address
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Document Validity</p>
                <p className="text-sm text-muted-foreground">
                  Document must be from a recognized Botswana utility company or
                  bank
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Notice */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Privacy Notice:</strong> Your address information is used only
          for verification and account security purposes. We do not share your
          address with third parties.
        </AlertDescription>
      </Alert>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <Button
          variant="outline"
          onClick={onPrevious}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Previous</span>
        </Button>

        <Button
          onClick={handleConfirmAddress}
          disabled={
            !confirmationMethod ||
            isConfirming ||
            isLoading ||
            !Object.values(availableMethods).some(Boolean)
          }
          className="flex items-center space-x-2"
        >
          <span>{isConfirming ? "Confirming..." : "Confirm Address"}</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
