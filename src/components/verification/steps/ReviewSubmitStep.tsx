
/**
 * Review & Submit Step Component
 * Final review before submitting verification
 */

import React, { useState } from "react";
import { useVerification } from "@/hooks/useVerification";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, Send } from "lucide-react";
import { toast } from "sonner";

interface ReviewSubmitStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

export const ReviewSubmitStep: React.FC<ReviewSubmitStepProps> = ({
  onNext,
  onPrevious,
}) => {
  const { verificationData, submitForReview, isLoading } = useVerification();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await submitForReview();
      toast.success("Verification submitted for review!");
      onNext();
    } catch (error) {
      console.error("Failed to submit verification:", error);
      toast.error("Failed to submit verification");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3-STEP FLOW: Only 3 review items (removed phone, selfie, address)
  const reviewItems = [
    {
      title: "Personal Information",
      completed: verificationData?.personal_info_completed || false,
      details: String((verificationData?.personal_info as any)?.fullName || "Not completed"),
    },
    {
      title: "Documents Uploaded",
      completed: verificationData?.documents_completed || false,
      details: "1 required document (National ID Front)",
    },
    {
      title: "Ready for Review",
      completed: verificationData?.personal_info_completed && verificationData?.documents_completed,
      details: "All requirements met for admin review",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Review & Submit</h2>
        <p className="text-muted-foreground">
          Review your information before submitting for verification
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verification Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reviewItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className={`h-5 w-5 ${item.completed ? 'text-green-500' : 'text-gray-400'}`} />
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.details}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground mb-2">By submitting, you confirm that:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>All personal information provided is accurate and up-to-date</li>
              <li>All required documents (National ID Front + Back) are clear and valid</li>
              <li>You consent to verification review by MobiRides admin team</li>
            </ul>
            <p className="font-medium text-foreground mt-4 mb-2">
              <strong>What happens next?</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Your verification will be reviewed by our team</li>
              <li>You'll receive email updates on the status</li>
              <li>Processing typically takes 1-3 business days</li>
              <li>You can check progress anytime in your profile</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <Button 
          onClick={handleSubmit} 
          disabled={isLoading || isSubmitting}
          className="bg-green-600 hover:bg-green-700"
        >
          <Send className="h-4 w-4 mr-2" />
          <span>{isSubmitting ? "Submitting..." : "Submit for Review"}</span>
        </Button>
      </div>
    </div>
  );
};
