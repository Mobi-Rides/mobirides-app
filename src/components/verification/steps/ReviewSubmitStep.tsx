/**
 * Review & Submit Step Component
 * Final review of all verification data before submission
 * Includes terms acceptance and data consent
 */

import React, { useState } from "react";
import { useVerification } from "@/contexts/VerificationContext";
import {
  VerificationStatus,
  VerificationStep,
  DocumentType,
} from "@/types/verification";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  AlertCircle,
  User,
  FileText,
  Camera,
  Phone,
  MapPin,
  Send,
  ArrowLeft,
  Shield,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

interface ReviewSubmitStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

/**
 * Section Review Component
 * Shows completion status of each verification section
 */
const SectionReview: React.FC<{
  title: string;
  icon: React.ReactNode;
  isCompleted: boolean;
  children: React.ReactNode;
}> = ({ title, icon, isCompleted, children }) => {
  return (
    <Card
      className={`${
        isCompleted
          ? "border-green-200 bg-green-50"
          : "border-orange-200 bg-orange-50"
      }`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center space-x-2">
            {icon}
            <span className={isCompleted ? "text-gray-900" : ""}>{title}</span>
          </div>
          <Badge
            variant={isCompleted ? "secondary" : "destructive"}
            className={isCompleted ? "bg-green-100 text-green-700" : ""}
          >
            {isCompleted ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3 mr-1" />
                Incomplete
              </>
            )}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className={`pt-0 ${isCompleted ? "text-gray-900" : ""}`}>
        {children}
      </CardContent>
    </Card>
  );
};

/**
 * Personal Information Summary
 */
interface PersonalInfo {
  fullName?: string;
  dateOfBirth?: string;
  nationalIdNumber?: string;
  phoneNumber?: string;
  email?: string;
  address?: {
    street?: string;
    area?: string;
    city?: string;
    postalCode?: string;
  };
}

const PersonalInfoSummary: React.FC<{ personalInfo: PersonalInfo }> = ({
  personalInfo,
}) => {
  if (!personalInfo)
    return (
      <p className="text-sm text-muted-foreground">
        No personal information provided
      </p>
    );

  return (
    <div className="space-y-2 text-sm text-gray-900">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="font-medium">Full Name</p>
          <p>{personalInfo.fullName || "Not provided"}</p>
        </div>
        <div>
          <p className="font-medium">Date of Birth</p>
          <p>
            {personalInfo.dateOfBirth
              ? new Date(personalInfo.dateOfBirth).toLocaleDateString()
              : "Not provided"}
          </p>
        </div>
        <div>
          <p className="font-medium">National ID</p>
          <p>{personalInfo.nationalIdNumber || "Not provided"}</p>
        </div>
        <div>
          <p className="font-medium">Phone Number</p>
          <p>{personalInfo.phoneNumber || "Not provided"}</p>
        </div>
      </div>

      {personalInfo.address && (
        <div className="mt-3">
          <p className="font-medium">Address</p>
          <p>
            {personalInfo.address.street}, {personalInfo.address.area},{" "}
            {personalInfo.address.city}
            {personalInfo.address.postalCode &&
              `, ${personalInfo.address.postalCode}`}
          </p>
        </div>
      )}
    </div>
  );
};

interface Document {
  type: DocumentType;
  status: VerificationStatus;
  // Add other fields as needed, e.g. fileUrl, uploadedAt, etc.
}

const DocumentsSummary: React.FC<{ documents: Document[] }> = ({
  documents,
}) => {
  const getDocumentDisplayName = (type: DocumentType): string => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const completedDocuments = documents.filter(
    (doc) => doc.status === VerificationStatus.COMPLETED,
  );

  if (completedDocuments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No documents uploaded</p>
    );
  }

  return (
    <div className="space-y-2 text-gray-900">
      {completedDocuments.map((doc, index) => (
        <div
          key={index}
          className="flex items-center justify-between py-2 border-b last:border-b-0"
        >
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-blue-500" />
            <span className="text-sm">{getDocumentDisplayName(doc.type)}</span>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Uploaded
          </Badge>
        </div>
      ))}
    </div>
  );
};

/**
 * Main Review & Submit Step Component
 */
export const ReviewSubmitStep: React.FC<ReviewSubmitStepProps> = ({
  onNext,
  onPrevious,
}) => {
  const { verificationData, submitForReview, isLoading, navigateToStep } =
    useVerification();

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptDataConsent, setAcceptDataConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!verificationData) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-muted-foreground">No verification data found</p>
      </div>
    );
  }

  /**
   * Check completion status of each section
   */
  const getCompletionStatus = () => {
    const personalInfoComplete = !!(
      verificationData.personalInfo?.fullName &&
      verificationData.personalInfo?.dateOfBirth &&
      verificationData.personalInfo?.nationalIdNumber &&
      verificationData.personalInfo?.phoneNumber &&
      verificationData.personalInfo?.email &&
      verificationData.personalInfo?.address
    );

    const documentsComplete =
      verificationData.stepStatuses?.document_upload ===
      VerificationStatus.COMPLETED;
    const selfieComplete =
      verificationData.stepStatuses?.selfie_verification ===
      VerificationStatus.COMPLETED;
    const phoneComplete =
      verificationData.stepStatuses?.phone_verification ===
      VerificationStatus.COMPLETED;
    const addressComplete =
      verificationData.stepStatuses?.address_confirmation ===
      VerificationStatus.COMPLETED;

    return {
      personalInfoComplete,
      documentsComplete,
      selfieComplete,
      phoneComplete,
      addressComplete,
      allComplete:
        personalInfoComplete &&
        documentsComplete &&
        selfieComplete &&
        phoneComplete &&
        addressComplete,
    };
  };

  const completionStatus = getCompletionStatus();

  /**
   * Handle final submission
   */
  /**
   * Handle final submission
   */
  const handleSubmit = async () => {
    if (!acceptTerms || !acceptDataConsent) {
      toast.error("Please accept the terms and conditions and data consent");
      return;
    }

    if (!completionStatus.allComplete) {
      toast.error("Please complete all verification steps before submitting");
      return;
    }

    try {
      setIsSubmitting(true);

      console.log("[ReviewSubmitStep] Submitting verification for review...");

      // Submit for review
      await submitForReview();

      console.log("[ReviewSubmitStep] Verification submitted successfully");

      toast.success("Verification submitted successfully!");

      // Add a small delay to ensure database updates are complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Navigate to the next step - the context should have refreshed the data
      console.log("[ReviewSubmitStep] Navigating to processing status...");

      try {
        // Use the navigation function from context to ensure proper step management
        navigateToStep(VerificationStep.PROCESSING_STATUS);
        onNext(); // Also call the prop function as a backup
      } catch (navError) {
        console.warn(
          "[ReviewSubmitStep] Navigation failed, using fallback:",
          navError,
        );
        onNext(); // Fallback to the prop-based navigation
      }
    } catch (error) {
      console.error("[ReviewSubmitStep] Failed to submit verification:", error);
      toast.error("Failed to submit verification. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Introduction */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Review & Submit</h2>
        <p className="text-muted-foreground">
          Please review all your information before final submission
        </p>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Verification Summary</span>
            <Badge
              variant={
                completionStatus.allComplete ? "secondary" : "destructive"
              }
              className={
                completionStatus.allComplete
                  ? "bg-green-100 text-green-700"
                  : ""
              }
            >
              {completionStatus.allComplete ? "Ready to Submit" : "Incomplete"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div
              className={`p-3 rounded-lg ${completionStatus.personalInfoComplete ? "bg-green-100" : "bg-gray-100"}`}
            >
              <User
                className={`h-6 w-6 mx-auto mb-1 ${completionStatus.personalInfoComplete ? "text-green-600" : "text-gray-400"}`}
              />
              <p className="text-xs font-medium">Personal Info</p>
            </div>
            <div
              className={`p-3 rounded-lg ${completionStatus.documentsComplete ? "bg-green-100" : "bg-gray-100"}`}
            >
              <FileText
                className={`h-6 w-6 mx-auto mb-1 ${completionStatus.documentsComplete ? "text-green-600" : "text-gray-400"}`}
              />
              <p className="text-xs font-medium">Documents</p>
            </div>
            <div
              className={`p-3 rounded-lg ${completionStatus.selfieComplete ? "bg-green-100" : "bg-gray-100"}`}
            >
              <Camera
                className={`h-6 w-6 mx-auto mb-1 ${completionStatus.selfieComplete ? "text-green-600" : "text-gray-400"}`}
              />
              <p className="text-xs font-medium">Selfie</p>
            </div>
            <div
              className={`p-3 rounded-lg ${completionStatus.phoneComplete ? "bg-green-100" : "bg-gray-100"}`}
            >
              <Phone
                className={`h-6 w-6 mx-auto mb-1 ${completionStatus.phoneComplete ? "text-green-600" : "text-gray-400"}`}
              />
              <p className="text-xs font-medium">Phone</p>
            </div>
            <div
              className={`p-3 rounded-lg ${completionStatus.addressComplete ? "bg-green-100" : "bg-gray-100"}`}
            >
              <MapPin
                className={`h-6 w-6 mx-auto mb-1 ${completionStatus.addressComplete ? "text-green-600" : "text-gray-400"}`}
              />
              <p className="text-xs font-medium">Address</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Review Sections */}
      <div className="space-y-4">
        {/* Personal Information Review */}
        <SectionReview
          title="Personal Information"
          icon={<User className="h-5 w-5" />}
          isCompleted={completionStatus.personalInfoComplete}
        >
          <PersonalInfoSummary personalInfo={verificationData.personalInfo} />
        </SectionReview>

        {/* Documents Review */}
        <SectionReview
          title="Document Uploads"
          icon={<FileText className="h-5 w-5" />}
          isCompleted={completionStatus.documentsComplete}
        >
          <DocumentsSummary documents={verificationData.documents || []} />
        </SectionReview>

        {/* Selfie Review */}
        <SectionReview
          title="Selfie Verification"
          icon={<Camera className="h-5 w-5" />}
          isCompleted={completionStatus.selfieComplete}
        >
          <p className="text-sm text-muted-foreground">
            {completionStatus.selfieComplete
              ? "Selfie verification completed successfully"
              : "Selfie verification not completed"}
          </p>
        </SectionReview>

        {/* Phone Review */}
        <SectionReview
          title="Phone Verification"
          icon={<Phone className="h-5 w-5" />}
          isCompleted={completionStatus.phoneComplete}
        >
          <p className="text-sm">
            {verificationData.phoneVerification?.phoneNumber
              ? `Verified: ${verificationData.phoneVerification.phoneNumber}`
              : "Phone number not verified"}
          </p>
        </SectionReview>

        {/* Address Review */}
        <SectionReview
          title="Address Confirmation"
          icon={<MapPin className="h-5 w-5" />}
          isCompleted={completionStatus.addressComplete}
        >
          <p className="text-sm text-muted-foreground">
            {completionStatus.addressComplete
              ? "Address confirmed and verified"
              : "Address confirmation not completed"}
          </p>
        </SectionReview>
      </div>

      {/* Terms and Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Terms & Consent</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms"
              checked={acceptTerms}
              onCheckedChange={(checked) => setAcceptTerms(checked === true)}
            />
            <div className="space-y-1">
              <Label
                htmlFor="terms"
                className="text-sm font-medium cursor-pointer"
              >
                I accept the Terms and Conditions
              </Label>
              <p className="text-xs text-muted-foreground">
                By checking this box, you agree to MobiRides' Terms of Service
                and User Agreement.
                <Button variant="link" className="h-auto p-0 text-xs ml-1">
                  <Eye className="h-3 w-3 mr-1" />
                  Read Terms
                </Button>
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="consent"
              checked={acceptDataConsent}
              onCheckedChange={(checked) =>
                setAcceptDataConsent(checked === true)
              }
            />
            <div className="space-y-1">
              <Label
                htmlFor="consent"
                className="text-sm font-medium cursor-pointer"
              >
                I consent to data processing for verification
              </Label>
              <p className="text-xs text-muted-foreground">
                You consent to the processing of your personal data for identity
                verification purposes.
                <Button variant="link" className="h-auto p-0 text-xs ml-1">
                  <Eye className="h-3 w-3 mr-1" />
                  Privacy Policy
                </Button>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incomplete Sections Warning */}
      {!completionStatus.allComplete && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Incomplete Verification:</strong> Please complete all
            verification steps before submitting. Use the navigation above to go
            back to incomplete sections.
          </AlertDescription>
        </Alert>
      )}

      {/* Submission Notice */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Final Submission:</strong> Once submitted, your verification
          will be reviewed by our team. This process typically takes 1-3
          business days. You'll receive email notifications about the status.
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
          onClick={handleSubmit}
          disabled={
            !completionStatus.allComplete ||
            !acceptTerms ||
            !acceptDataConsent ||
            isSubmitting ||
            isLoading
          }
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
        >
          <Send className="h-4 w-4" />
          <span>{isSubmitting ? "Submitting..." : "Submit for Review"}</span>
        </Button>
      </div>
    </div>
  );
};
