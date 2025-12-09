
/**
 * Document Upload Step Component
 * Handles document uploads for verification with camera capture functionality
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useVerification } from '@/hooks/useVerification';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { VerificationService } from '@/services/verificationService';
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  CheckCircle,
  Camera,
  RotateCcw,
  AlertCircle,
  FileImage,
  FileText,
} from 'lucide-react';

interface DocumentUploadStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

interface DocumentPhoto {
  id: string;
  blob: Blob;
  url: string;
  method: 'camera' | 'upload';
}

/**
 * Camera View Component for Document Capture
 */
const DocumentCameraView: React.FC<{
  onPhotoCapture: (photoBlob: Blob) => void;
  photoUrl: string | null;
  onRetake: () => void;
  documentTitle: string;
}> = ({ onPhotoCapture, photoUrl, onRetake, documentTitle }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const initializeCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "environment", // Use back camera for documents
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true);
        };
      }
    } catch (error: unknown) {
      console.error("Camera initialization error:", error);
      let errorMessage = "Unable to access camera.";
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "Camera access denied. Please allow camera permissions and try again.";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "No camera found. Please ensure your device has a camera.";
        } else if (error.name === 'SecurityError' || window.location.protocol !== 'https:') {
          errorMessage = "Camera access requires HTTPS. Please use HTTPS or upload manually.";
        }
      }
      
      setCameraError(errorMessage);
    }
  }, []);

  const cleanupCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
  }, []);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) return;

    setIsCapturing(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!context) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            onPhotoCapture(blob);
            toast.success(`${documentTitle} captured successfully!`);
          }
        },
        "image/jpeg",
        0.9
      );
    } catch (error) {
      console.error("Photo capture error:", error);
      toast.error("Failed to capture photo");
    } finally {
      setIsCapturing(false);
    }
  }, [cameraReady, onPhotoCapture, documentTitle]);

  useEffect(() => {
    if (!photoUrl) {
      initializeCamera();
    }
    return cleanupCamera;
  }, [photoUrl, initializeCamera, cleanupCamera]);

  return (
    <div className="space-y-4">
      <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-[4/3] max-w-md mx-auto">
        {cameraError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center p-4">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-xs text-red-600 mb-2">{cameraError}</p>
              <Button onClick={initializeCamera} size="sm">
                Try Again
              </Button>
            </div>
          </div>
        ) : photoUrl ? (
          <img
            src={photoUrl}
            alt={`Captured ${documentTitle}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-4 border-2 border-white/50 rounded-lg flex items-center justify-center">
                <div className="text-white text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Position {documentTitle} in frame</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex justify-center space-x-3">
        {!photoUrl ? (
          <Button
            onClick={capturePhoto}
            disabled={isCapturing || !cameraReady}
            className="flex items-center space-x-2"
          >
            <Camera className="h-4 w-4" />
            <span>{isCapturing ? "Capturing..." : "Take Photo"}</span>
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={onRetake}
            className="flex items-center space-x-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Retake</span>
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * Manual Upload Component for Documents
 */
const DocumentManualUpload: React.FC<{
  onFileSelect: (file: File) => void;
  photoUrl: string | null;
  onRetake: () => void;
  documentTitle: string;
}> = ({ onFileSelect, photoUrl, onRetake, documentTitle }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf', 'image/jpg'];
      if (!validTypes.includes(file.type) && !file.type.startsWith('image/jpeg') && !file.type.startsWith('image/png')) {
        toast.error('Please select a JPG, PNG, or PDF file');
        return;
      }

      // Align with Supabase Storage bucket limit (5MB) to avoid upload failures
      const MAX_SIZE_BYTES = 5 * 1024 * 1024;
      if (file.size > MAX_SIZE_BYTES) {
        toast.error('File size must be less than 5MB (storage limit)');
        return;
      }

      onFileSelect(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden aspect-[4/3] max-w-md mx-auto">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={`Uploaded ${documentTitle}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-4">
              <FileImage className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Upload {documentTitle}
              </p>
              <Button onClick={handleUploadClick} size="sm" className="flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Choose File</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {photoUrl && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={onRetake}
            className="flex items-center space-x-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Choose Different File</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export const DocumentUploadStep: React.FC<DocumentUploadStepProps> = ({
  onNext,
  onPrevious,
}) => {
  const { isLoading, completeDocumentUpload } = useVerification();
  const { user } = useAuth();
  const [documentPhotos, setDocumentPhotos] = useState<Record<string, DocumentPhoto>>({});
  const [uploadMethods, setUploadMethods] = useState<Record<string, 'camera' | 'upload'>>({});

  // 1-DOCUMENT FLOW: Only 1 required document (National ID Front)
  const requiredDocuments = useMemo(() => [
    {
      id: "national_id_front",
      title: "National ID (Front)",
      description: "Front side of your Botswana National ID (Omang)",
    },
  ], []);

  const handlePhotoCapture = useCallback((documentId: string, photoBlob: Blob) => {
    const photoUrl = URL.createObjectURL(photoBlob);
    const documentPhoto: DocumentPhoto = {
      id: documentId,
      blob: photoBlob,
      url: photoUrl,
      method: 'camera'
    };
    
    setDocumentPhotos(prev => ({
      ...prev,
      [documentId]: documentPhoto
    }));
  }, []);

  const handleFileSelect = useCallback((documentId: string, file: File) => {
    const photoUrl = URL.createObjectURL(file);
    const documentPhoto: DocumentPhoto = {
      id: documentId,
      blob: file,
      url: photoUrl,
      method: 'upload'
    };
    
    setDocumentPhotos(prev => ({
      ...prev,
      [documentId]: documentPhoto
    }));
    
    toast.success(`${requiredDocuments.find(doc => doc.id === documentId)?.title} uploaded successfully!`);
  }, [requiredDocuments]);

  const handleRetakePhoto = useCallback((documentId: string) => {
    setDocumentPhotos(prev => {
      const updated = { ...prev };
      if (updated[documentId]) {
        URL.revokeObjectURL(updated[documentId].url);
        delete updated[documentId];
      }
      return updated;
    });
  }, []);

  const handleMethodChange = useCallback((documentId: string, method: 'camera' | 'upload') => {
    setUploadMethods(prev => ({
      ...prev,
      [documentId]: method
    }));
    
    // Clear existing photo when switching methods
    handleRetakePhoto(documentId);
  }, [handleRetakePhoto]);

  const handleFileUpload = async (file: File, documentId: string) => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return false;
    }
    try {
      const isSelfie = documentId === 'selfie_photo';
      const path = isSelfie
        ? await VerificationService.uploadSelfie(user.id, file)
        : await VerificationService.uploadDocument(user.id, documentId, file);
      if (!path) {
        toast.error('Upload failed. Please try again.');
        return false;
      }
      toast.success(`${file.name} uploaded successfully`);
      return true;
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Upload error. Please retry.');
      return false;
    }
  };

  const handleSubmit = async () => {
    const uploadedCount = Object.keys(documentPhotos).length;
    if (uploadedCount < requiredDocuments.length) {
      toast.error('Please upload all required documents');
      return;
    }

    try {
      // Upload all document photos
      for (const [documentId, photo] of Object.entries(documentPhotos)) {
        let inferredType = photo.blob.type || 'image/jpeg';
        // Normalize jpg to jpeg for Supabase storage compatibility
        if (inferredType === 'image/jpg') {
          inferredType = 'image/jpeg';
        }
        
        const filename = inferredType === 'application/pdf' ? `${documentId}.pdf` : `${documentId}.jpg`;
        const file = new File([photo.blob], filename, { type: inferredType });
        const ok = await handleFileUpload(file, documentId);
        if (!ok) throw new Error(`Failed to upload ${documentId}`);
      }
      
      await completeDocumentUpload(user?.id || '');
      onNext();
    } catch (error) {
      console.error('Document upload completion error:', error);
      toast.error('Failed to complete document upload');
    }
  };

  // Check if camera is supported
  const isCameraSupported = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Document Upload
        </h2>
        <p className="text-gray-600">
          Please upload the following documents to verify your identity
        </p>
      </div>

      <div className="space-y-8">
        {requiredDocuments.map((doc) => {
          const isUploaded = documentPhotos[doc.id];
          const currentMethod = uploadMethods[doc.id] || (isCameraSupported ? 'camera' : 'upload');
          
          return (
            <div key={doc.id} className="border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium text-gray-900">{doc.title}</h3>
                  <p className="text-sm text-gray-600">{doc.description}</p>
                </div>
                {isUploaded && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Uploaded
                  </Badge>
                )}
              </div>
              
              {/* Method Selection Tabs */}
              {isCameraSupported && (
                <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => handleMethodChange(doc.id, 'camera')}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      currentMethod === 'camera'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Camera className="h-4 w-4" />
                    <span>Take Photo</span>
                  </button>
                  <button
                    onClick={() => handleMethodChange(doc.id, 'upload')}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      currentMethod === 'upload'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload File</span>
                  </button>
                </div>
              )}
              
              {/* Camera or Upload Component */}
              {currentMethod === 'camera' ? (
                <DocumentCameraView
                  onPhotoCapture={(blob) => handlePhotoCapture(doc.id, blob)}
                  photoUrl={isUploaded?.url || null}
                  onRetake={() => handleRetakePhoto(doc.id)}
                  documentTitle={doc.title}
                />
              ) : (
                <DocumentManualUpload
                  onFileSelect={(file) => handleFileSelect(doc.id, file)}
                  photoUrl={isUploaded?.url || null}
                  onRetake={() => handleRetakePhoto(doc.id)}
                  documentTitle={doc.title}
                />
              )}
              
              {!isCameraSupported && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Camera not available. Please upload files manually.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6">
        <Button
          variant="outline"
          onClick={onPrevious}
          className="flex items-center justify-center space-x-2 w-full sm:w-auto min-h-[48px] sm:min-h-[40px]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Previous</span>
        </Button>
        
        <Button
          onClick={handleSubmit}
          disabled={isLoading || Object.keys(documentPhotos).length < requiredDocuments.length}
          className="flex items-center justify-center space-x-2 w-full sm:w-auto min-h-[48px] sm:min-h-[40px]"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          <span>{isLoading ? 'Processing...' : 'Continue'}</span>
        </Button>
      </div>
     </div>
   );
};
