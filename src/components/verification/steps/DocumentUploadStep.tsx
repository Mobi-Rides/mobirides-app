
/**
 * Document Upload Step Component
 * Handles document uploads for verification
 */

import React, { useState } from "react";
import { useVerification } from "@/contexts/VerificationContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, ArrowLeft, FileText, Upload, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface DocumentUploadStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

export const DocumentUploadStep: React.FC<DocumentUploadStepProps> = ({
  onNext,
  onPrevious,
}) => {
  const { isLoading } = useVerification();
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);

  const requiredDocuments = [
    {
      id: "national_id_front",
      title: "National ID (Front)",
      description: "Front side of your Botswana National ID (Omang)",
    },
    {
      id: "national_id_back",
      title: "National ID (Back)",
      description: "Back side of your Botswana National ID (Omang)",
    },
    {
      id: "driving_license_front",
      title: "Driving License (Front)",
      description: "Front side of your valid driving license",
    },
    {
      id: "proof_of_address",
      title: "Proof of Address",
      description: "Utility bill or bank statement (max 3 months old)",
    },
  ];

  const handleFileUpload = (docId: string, file: File) => {
    // Simulate file upload for development
    setTimeout(() => {
      setUploadedDocs(prev => [...prev, docId]);
      toast.success(`${file.name} uploaded successfully`);
    }, 1000);
  };

  const handleNext = () => {
    if (uploadedDocs.length < requiredDocuments.length) {
      toast.error("Please upload all required documents");
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Document Upload</h2>
        <p className="text-muted-foreground">
          Upload clear photos of your required documents
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {requiredDocuments.map((doc) => (
          <Card key={doc.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>{doc.title}</span>
                </div>
                {uploadedDocs.includes(doc.id) && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {doc.description}
              </p>
              
              {!uploadedDocs.includes(doc.id) ? (
                <div>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(doc.id, file);
                      }
                    }}
                    className="hidden"
                    id={`file-${doc.id}`}
                  />
                  <label
                    htmlFor={`file-${doc.id}`}
                    className="flex items-center justify-center w-full p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="flex items-center justify-center p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-green-700">Document uploaded</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <Button onClick={handleNext} disabled={isLoading}>
          <span>Continue to Selfie</span>
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
