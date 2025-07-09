/**
 * Document Upload Step Component
 * Handles upload of required documents for Botswana verification
 * Includes drag-and-drop functionality, file preview, and validation
 */

import React, { useState, useRef, useCallback } from "react";
import { useVerification } from "@/contexts/VerificationContext";
import {
  DocumentType,
  DocumentUpload,
  VerificationStatus,
  BOTSWANA_DOCUMENT_REQUIREMENTS,
} from "@/types/verification";
import { validateFileUpload } from "@/utils/verificationValidation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  Download,
  Camera,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

interface DocumentUploadStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

/**
 * Document Preview Component
 * Shows preview of uploaded documents
 */
const DocumentPreview: React.FC<{
  document: DocumentUpload;
  onRemove: () => void;
}> = ({ document, onRemove }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Generate preview URL for the file
  React.useEffect(() => {
    if (document.file && document.file instanceof File) {
      const url = URL.createObjectURL(document.file);
      setPreviewUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [document.file]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getDocumentDisplayName = (type: DocumentType): string => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-sm">
              {getDocumentDisplayName(document.type)}
            </h4>
            <p className="text-xs text-muted-foreground">
              {document.fileName} • {formatFileSize(document.fileSize)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge
            variant={
              document.status === VerificationStatus.COMPLETED
                ? "secondary"
                : "outline"
            }
            className={
              document.status === VerificationStatus.COMPLETED
                ? "bg-green-100 text-green-700"
                : ""
            }
          >
            {document.status === VerificationStatus.COMPLETED ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Uploaded
              </>
            ) : (
              "Pending"
            )}
          </Badge>

          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-6 w-6"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* File Preview */}
      {previewUrl && (
        <div className="mt-3">
          {document.file?.type.startsWith("image/") ? (
            <img
              src={previewUrl}
              alt={`Preview of ${document.type}`}
              className="w-full h-32 object-cover rounded border"
            />
          ) : (
            <div className="flex items-center justify-center h-32 border rounded bg-white">
              <div className="text-center">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">PDF Document</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Document Details */}
      {document.documentNumber && (
        <div className="mt-3 text-xs text-muted-foreground">
          <span className="font-medium">Document Number:</span>{" "}
          {document.documentNumber}
        </div>
      )}

      {document.expiryDate && (
        <div className="mt-1 text-xs text-muted-foreground">
          <span className="font-medium">Expires:</span>{" "}
          {new Date(document.expiryDate).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

/**
 * File Drop Zone Component
 * Handles drag-and-drop file upload
 */
const FileDropZone: React.FC<{
  onFileSelect: (file: File) => void;
  accept: string;
  disabled?: boolean;
}> = ({ onFileSelect, accept, disabled = false }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect, disabled],
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  return (
    <div
      className={`
        border-2 border-dashed rounded-lg p-6 text-center transition-colors
        ${isDragOver ? "border-blue-400 bg-blue-50" : "border-gray-300"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-400 hover:bg-blue-50"}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
    >
      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
      <h3 className="text-lg font-medium mb-2">Drop your file here</h3>
      <p className="text-sm text-muted-foreground mb-4">
        or click to browse your files
      </p>
      <p className="text-xs text-muted-foreground">
        Supported formats: JPEG, PNG, PDF • Max size: 5MB
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
        title="Select a file to upload"
        placeholder="Choose a file"
      />
    </div>
  );
};

/**
 * Document Upload Step Component
 * Main component for document upload process
 */
export const DocumentUploadStep: React.FC<DocumentUploadStepProps> = ({
  onNext,
  onPrevious,
}) => {
  const { verificationData, updateDocument, isLoading } = useVerification();
  const [uploadingDocument, setUploadingDocument] =
    useState<DocumentType | null>(null);

  // Get required documents based on user role
  const getRequiredDocuments = () => {
    if (!verificationData) return [];

    return BOTSWANA_DOCUMENT_REQUIREMENTS.filter((req) => {
      if (verificationData.userRole === "renter") {
        // Renters don't need vehicle documents, only required documents
        return (
          req.required &&
          req.type !== DocumentType.VEHICLE_REGISTRATION &&
          req.type !== DocumentType.VEHICLE_OWNERSHIP
        );
      }

      // Hosts need all required documents (including vehicle documents)
      return req.required;
    });
  };

  // Get optional documents based on user role
  const getOptionalDocuments = () => {
    if (!verificationData) return [];

    return BOTSWANA_DOCUMENT_REQUIREMENTS.filter((req) => {
      if (verificationData.userRole === "renter") {
        // Renters can upload optional documents (excluding vehicle docs)
        return (
          !req.required &&
          req.type !== DocumentType.VEHICLE_REGISTRATION &&
          req.type !== DocumentType.VEHICLE_OWNERSHIP
        );
      }

      // Hosts can upload optional documents
      return !req.required;
    });
  };

  const requiredDocuments = getRequiredDocuments();
  const optionalDocuments = getOptionalDocuments();
  const uploadedDocuments = verificationData?.documents || [];

  /**
   * Handle file upload for a specific document type
   */
  const handleFileUpload = async (file: File, documentType: DocumentType) => {
    try {
      setUploadingDocument(documentType);

      // Validate file
      const validation = validateFileUpload(file, documentType);
      if (!validation.isValid) {
        toast.error(validation.error);
        return;
      }

      // Create document upload object
      const documentUpload: DocumentUpload = {
        type: documentType,
        file,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        status: VerificationStatus.COMPLETED,
      };

      // Update document in context
      await updateDocument(documentUpload);

      // The success toast is now handled in the updateDocument method for consistency
    } catch (error) {
      console.error("Failed to upload document:", error);
      toast.error("Failed to upload document");
    } finally {
      setUploadingDocument(null);
    }
  };

  /**
   * Remove uploaded document
   */
  const handleRemoveDocument = (documentType: DocumentType) => {
    // Find and remove the document
    const updatedDocuments = uploadedDocuments.filter(
      (doc) => doc.type !== documentType,
    );

    // Create a placeholder document to maintain the structure
    const removedDocument: DocumentUpload = {
      type: documentType,
      file: null,
      fileName: "",
      fileSize: 0,
      uploadedAt: new Date().toISOString(),
      status: VerificationStatus.NOT_STARTED,
    };

    updateDocument(removedDocument);
    toast.success("Document removed");
  };

  /**
   * Check if all required documents are uploaded
   */
  const areAllDocumentsUploaded = () => {
    return requiredDocuments.every((req) =>
      uploadedDocuments.some(
        (doc) =>
          doc.type === req.type && doc.status === VerificationStatus.COMPLETED,
      ),
    );
  };

  /**
   * Get upload progress (only for required documents)
   */
  const getUploadProgress = () => {
    const totalRequired = requiredDocuments.length;
    const uploaded = uploadedDocuments.filter(
      (doc) =>
        doc.status === VerificationStatus.COMPLETED &&
        requiredDocuments.some((req) => req.type === doc.type),
    ).length;

    return {
      uploaded,
      total: totalRequired,
      percentage: totalRequired > 0 ? (uploaded / totalRequired) * 100 : 0,
    };
  };

  /**
   * Get optional documents progress
   */
  const getOptionalProgress = () => {
    const totalOptional = optionalDocuments.length;
    const uploaded = uploadedDocuments.filter(
      (doc) =>
        doc.status === VerificationStatus.COMPLETED &&
        optionalDocuments.some((req) => req.type === doc.type),
    ).length;

    return {
      uploaded,
      total: totalOptional,
      percentage: totalOptional > 0 ? (uploaded / totalOptional) * 100 : 0,
    };
  };

  const progress = getUploadProgress();
  const optionalProgress = getOptionalProgress();

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Document Upload Progress</span>
            <Badge variant="outline">
              {progress.uploaded} of {progress.total} required documents
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Required Documents</span>
                <span>{Math.round(progress.percentage)}%</span>
              </div>
              <Progress value={progress.percentage} className="h-2" />
            </div>

            {optionalDocuments.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    Optional Documents ({optionalProgress.uploaded} of{" "}
                    {optionalProgress.total} uploaded)
                  </span>
                  <span>{Math.round(optionalProgress.percentage)}%</span>
                </div>
                <Progress
                  value={optionalProgress.percentage}
                  className="h-2 opacity-60"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please upload clear, high-quality images or scans of your documents.
          Ensure all text is readable and the entire document is visible.
          Documents must be current and not expired.
        </AlertDescription>
      </Alert>

      {/* Required Documents Section */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2 mb-4">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <h2 className="text-xl font-semibold">Required Documents</h2>
          <Badge variant="destructive">Must Complete</Badge>
        </div>

        {requiredDocuments.map((requirement) => {
          const existingDocument = uploadedDocuments.find(
            (doc) => doc.type === requirement.type,
          );
          const isUploaded =
            existingDocument?.status === VerificationStatus.COMPLETED;
          const isUploading = uploadingDocument === requirement.type;

          return (
            <Card key={requirement.type}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-full ${isUploaded ? "bg-green-100" : "bg-gray-100"}`}
                    >
                      {isUploaded ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <FileText className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{requirement.description}</h3>
                      {requirement.botswanaSpecific && (
                        <Badge variant="secondary" className="mt-1">
                          Botswana Required
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Badge variant="destructive">Required</Badge>
                </CardTitle>
              </CardHeader>

              <CardContent>
                {isUploaded && existingDocument ? (
                  <DocumentPreview
                    document={existingDocument}
                    onRemove={() => handleRemoveDocument(requirement.type)}
                  />
                ) : (
                  <div className="space-y-4">
                    <FileDropZone
                      onFileSelect={(file) =>
                        handleFileUpload(file, requirement.type)
                      }
                      accept={requirement.allowedFormats.join(",")}
                      disabled={isUploading}
                    />

                    {isUploading && (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-sm text-muted-foreground">
                          Uploading...
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Document-specific instructions */}
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>
                    <strong>Requirements:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Maximum file size: {requirement.maxSizeMB}MB</li>
                    <li>
                      Formats:{" "}
                      {requirement.allowedFormats
                        .map((format) => format.split("/")[1].toUpperCase())
                        .join(", ")}
                    </li>
                    <li>Document must be clear and readable</li>
                    {requirement.type.includes("license") && (
                      <li>License must be valid and not expired</li>
                    )}
                    {requirement.type.includes("proof_of_address") && (
                      <li>Document must be dated within the last 3 months</li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Optional Documents Section */}
      {optionalDocuments.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold">Optional Documents</h2>
            <Badge variant="outline">Helps with verification</Badge>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              These documents are optional but can help speed up your
              verification process. You can upload them now or skip and continue
              to the next step.
            </AlertDescription>
          </Alert>

          {optionalDocuments.map((requirement) => {
            const existingDocument = uploadedDocuments.find(
              (doc) => doc.type === requirement.type,
            );
            const isUploaded =
              existingDocument?.status === VerificationStatus.COMPLETED;
            const isUploading = uploadingDocument === requirement.type;

            return (
              <Card key={requirement.type} className="border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded-full ${isUploaded ? "bg-blue-100" : "bg-gray-100"}`}
                      >
                        {isUploaded ? (
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                        ) : (
                          <FileText className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {requirement.description}
                        </h3>
                        {requirement.botswanaSpecific && (
                          <Badge variant="secondary" className="mt-1">
                            Botswana Required
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className="text-blue-600 border-blue-200"
                    >
                      Optional
                    </Badge>
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  {isUploaded && existingDocument ? (
                    <DocumentPreview
                      document={existingDocument}
                      onRemove={() => handleRemoveDocument(requirement.type)}
                    />
                  ) : (
                    <div className="space-y-4">
                      <FileDropZone
                        onFileSelect={(file) =>
                          handleFileUpload(file, requirement.type)
                        }
                        accept={requirement.allowedFormats.join(",")}
                        disabled={isUploading}
                      />

                      {isUploading && (
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                          <p className="text-sm text-muted-foreground">
                            Uploading...
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Document-specific instructions */}
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p>
                      <strong>Requirements:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>Maximum file size: {requirement.maxSizeMB}MB</li>
                      <li>
                        Formats:{" "}
                        {requirement.allowedFormats
                          .map((format) => format.split("/")[1].toUpperCase())
                          .join(", ")}
                      </li>
                      <li>Document must be clear and readable</li>
                      {requirement.type.includes("license") && (
                        <li>License must be valid and not expired</li>
                      )}
                      {requirement.type.includes("proof_of_address") && (
                        <li>Document must be dated within the last 3 months</li>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Additional Information for Hosts */}
      {verificationData?.userRole === "host" && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>For car owners:</strong> Vehicle registration and ownership
            documents are required to list cars on the platform. These documents
            help verify your legal right to rent out the vehicle.
          </AlertDescription>
        </Alert>
      )}

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

        <div className="flex flex-col items-end space-y-2">
          {!areAllDocumentsUploaded() && (
            <p className="text-sm text-muted-foreground">
              Complete {progress.total - progress.uploaded} more required
              document{progress.total - progress.uploaded === 1 ? "" : "s"} to
              continue
            </p>
          )}

          <Button
            onClick={onNext}
            disabled={!areAllDocumentsUploaded() || isLoading}
            className="flex items-center space-x-2"
          >
            <span>Continue to Selfie Verification</span>
            <ArrowRight className="h-4 w-4" />
          </Button>

          {areAllDocumentsUploaded() && optionalDocuments.length > 0 && (
            <p className="text-xs text-muted-foreground text-right max-w-64">
              You can continue now or upload optional documents above to help
              speed up verification
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
