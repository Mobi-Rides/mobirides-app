/**
 * Selfie Verification Step Component
 * Handles selfie capture for identity verification
 * Includes camera integration, face detection guidance, and photo validation
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useVerification } from "@/hooks/useVerification";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  User,
  ArrowRight,
  ArrowLeft,
  Eye,
  Smile,
  Upload,
  FileImage,
} from "lucide-react";
import { toast } from "sonner";

interface SelfieVerificationStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

/**
 * Camera Controls Component
 * Provides camera control interface
 */
const CameraControls: React.FC<{
  onCapture: () => void;
  onRetake: () => void;
  isCapturing: boolean;
  hasPhoto: boolean;
}> = ({ onCapture, onRetake, isCapturing, hasPhoto }) => {
  return (
    <div className="flex justify-center space-x-4 mt-6">
      {!hasPhoto ? (
        <Button
          onClick={onCapture}
          disabled={isCapturing}
          size="lg"
          className="flex items-center space-x-2"
        >
          <Camera className="h-5 w-5" />
          <span>{isCapturing ? "Capturing..." : "Take Selfie"}</span>
        </Button>
      ) : (
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={onRetake}
            className="flex items-center space-x-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Retake</span>
          </Button>
        </div>
      )}
    </div>
  );
};

/**
 * Manual Upload Component
 * Provides file upload interface for selfie
 */
const ManualUpload: React.FC<{
  onFileSelect: (file: File) => void;
  photoUrl: string | null;
  onRetake: () => void;
}> = ({ onFileSelect, photoUrl, onRetake }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
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
            alt="Uploaded selfie"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-6">
              <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-4">
                Upload a clear selfie photo
              </p>
              <Button onClick={handleUploadClick} className="flex items-center space-x-2">
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
        accept="image/*"
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
            <span>Choose Different Photo</span>
          </Button>
        </div>
      )}
    </div>
  );
};

/**
 * Selfie Guidelines Component
 * Shows instructions for taking a good selfie
 */
const SelfieGuidelines: React.FC = () => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-lg">
          <User className="h-5 w-5" />
          <span>Selfie Guidelines</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-medium text-green-600 flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Do This</span>
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start space-x-2">
                <Eye className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Look directly at the camera</span>
              </li>
              <li className="flex items-start space-x-2">
                <Smile className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Have a neutral expression</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Ensure good lighting on your face</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Remove sunglasses and hats</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Face the camera directly</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-red-600 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4" />
              <span>Avoid This</span>
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span>Don't cover your face</span>
              </li>
              <li className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span>Don't take photos in dark lighting</span>
              </li>
              <li className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span>Don't blur the image</span>
              </li>
              <li className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span>Don't include other people</span>
              </li>
              <li className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span>Don't tilt your head significantly</span>
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Camera View Component
 * Handles camera stream and photo capture
 */
const CameraView: React.FC<{
  onPhotoCapture: (photoBlob: Blob) => void;
  photoUrl: string | null;
  onRetake: () => void;
}> = ({ onPhotoCapture, photoUrl, onRetake }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  /**
   * Initialize camera stream
   */
  const initializeCamera = useCallback(async () => {
    try {
      setCameraError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true);
        };
      }
    } catch (error: any) {
      console.error("Camera initialization error:", error);
      
      let errorMessage = "Unable to access camera.";
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Camera access denied. Please allow camera permissions in your browser settings and try again.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No camera found. Please ensure your device has a camera connected.";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "Camera is already in use by another application. Please close other apps using the camera.";
      } else if (error.name === 'SecurityError' || window.location.protocol !== 'https:') {
        errorMessage = "Camera access requires a secure connection (HTTPS). Please use HTTPS or try uploading a selfie manually.";
      } else if (error.name === 'NotSupportedError') {
        errorMessage = "Camera not supported on this device or browser. Please try a different browser or upload a selfie manually.";
      }
      
      setCameraError(errorMessage);
    }
  }, []);

  /**
   * Cleanup camera stream
   */
  const cleanupCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
  }, []);

  /**
   * Capture photo from video stream
   */
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) return;

    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!context) return;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            onPhotoCapture(blob);
            toast.success("Selfie captured successfully!");
          }
        },
        "image/jpeg",
        0.8,
      );
    } catch (error) {
      console.error("Photo capture error:", error);
      toast.error("Failed to capture photo");
    } finally {
      setIsCapturing(false);
    }
  }, [cameraReady, onPhotoCapture]);

  /**
   * Handle retake action
   */
  const handleRetake = useCallback(() => {
    onRetake();
    // Restart camera if needed
    if (!cameraReady) {
      initializeCamera();
    }
  }, [onRetake, cameraReady, initializeCamera]);

  // Initialize camera on mount
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
            <div className="text-center p-6">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-sm text-red-600 mb-4">{cameraError}</p>
              <Button onClick={initializeCamera} size="sm">
                Try Again
              </Button>
            </div>
          </div>
        ) : photoUrl ? (
          <img
            src={photoUrl}
            alt="Captured selfie"
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

            {/* Camera overlay guide */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="relative w-full h-full">
                {/* Face guide circle */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-white/50 rounded-full flex items-center justify-center">
                    <div className="w-44 h-44 border border-white/30 rounded-full"></div>
                  </div>
                </div>

                {/* Instructions overlay */}
                <div className="absolute top-4 left-4 right-4">
                  <div className="bg-black/50 text-white text-center py-2 px-4 rounded">
                    <p className="text-sm">
                      {cameraReady
                        ? "Position your face in the circle"
                        : "Loading camera..."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <CameraControls
        onCapture={capturePhoto}
        onRetake={handleRetake}
        isCapturing={isCapturing}
        hasPhoto={!!photoUrl}
      />
    </div>
  );
};

/**
 * Main Selfie Verification Step Component
 */
export const SelfieVerificationStep: React.FC<SelfieVerificationStepProps> = ({
  onNext,
  onPrevious,
}) => {
  const { verificationData, completeSelfieVerification, isLoading } =
    useVerification();
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'camera' | 'upload'>('camera');

  /**
   * Handle photo capture
   */
  const handlePhotoCapture = useCallback((blob: Blob) => {
    setPhotoBlob(blob);
    const url = URL.createObjectURL(blob);
    setPhotoUrl(url);
  }, []);

  /**
   * Handle retake photo
   */
  const handleRetake = useCallback(() => {
    if (photoUrl) {
      URL.revokeObjectURL(photoUrl);
    }
    setPhotoBlob(null);
    setPhotoUrl(null);
  }, [photoUrl]);

  /**
   * Handle file upload
   */
  const handleFileUpload = useCallback((file: File) => {
    // Convert file to blob
    const blob = new Blob([file], { type: file.type });
    setPhotoBlob(blob);
    
    // Create URL for preview
    const url = URL.createObjectURL(blob);
    setPhotoUrl(url);
    
    toast.success('Photo uploaded successfully!');
  }, []);

  /**
   * Submit selfie verification
   */
  const handleSubmit = async () => {
    if (!photoBlob) {
      toast.error("Please take a selfie first");
      return;
    }

    try {
      setIsSubmitting(true);

      // In a real implementation, you would upload the photo blob to your storage
      // For development, we'll just mark the step as completed
      await completeSelfieVerification();

      toast.success("Selfie verification completed!");

      // Auto-advance to next step
      setTimeout(() => {
        onNext();
      }, 1000);
    } catch (error) {
      console.error("Failed to submit selfie:", error);
      toast.error("Failed to submit selfie verification");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Check if browser supports camera and detect specific issues
   */
  const getCameraSupport = () => {
    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        supported: false,
        error: "Your browser doesn't support camera access. Please use a modern browser (Chrome, Firefox, Safari, Edge) or upload a selfie manually."
      };
    }
    
    // Check if running on HTTPS (required for camera access)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      return {
        supported: false,
        error: "Camera access requires a secure connection (HTTPS). Please access this page via HTTPS or upload a selfie manually."
      };
    }
    
    return { supported: true, error: null };
  };

  const cameraSupport = getCameraSupport();

  // If camera is not supported, default to upload method
  useEffect(() => {
    if (!cameraSupport.supported) {
      setUploadMethod('upload');
    }
  }, [cameraSupport.supported]);

  return (
    <div className="space-y-6">
      {/* Step Introduction */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">
          Take Your Verification Selfie
        </h2>
        <p className="text-muted-foreground">
          We need to verify that you're the same person as in your ID documents
        </p>
      </div>

      {/* Guidelines */}
      <SelfieGuidelines />

      {/* Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Capture Your Selfie</span>
            {photoUrl && (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Photo Captured
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Method Selection Tabs */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-1 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setUploadMethod('camera')}
              disabled={!cameraSupport.supported}
              className={`flex-1 min-h-[48px] sm:min-h-[40px] py-3 sm:py-2 px-4 rounded-md text-sm sm:text-base font-medium transition-colors flex items-center justify-center ${
                uploadMethod === 'camera'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              } ${!cameraSupport.supported ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Camera className="h-4 w-4 flex-shrink-0 mr-2" />
              <span className="truncate">Use Camera</span>
            </button>
            <button
              onClick={() => setUploadMethod('upload')}
              className={`flex-1 min-h-[48px] sm:min-h-[40px] py-3 sm:py-2 px-4 rounded-md text-sm sm:text-base font-medium transition-colors flex items-center justify-center ${
                uploadMethod === 'upload'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Upload className="h-4 w-4 flex-shrink-0 mr-2" />
              <span className="truncate">Upload Photo</span>
            </button>
          </div>

          {/* Camera Access Issue Alert */}
          {!cameraSupport.supported && uploadMethod === 'camera' && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Camera Access Issue:</strong> {cameraSupport.error}
                {window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                    <strong>💡 Quick Fix:</strong> Try accessing this page with <code>https://</code> instead of <code>http://</code>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Render appropriate component */}
          {uploadMethod === 'camera' && cameraSupport.supported ? (
            <CameraView
              onPhotoCapture={handlePhotoCapture}
              photoUrl={photoUrl}
              onRetake={handleRetake}
            />
          ) : (
            <ManualUpload
              onFileSelect={handleFileUpload}
              photoUrl={photoUrl}
              onRetake={handleRetake}
            />
          )}
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Privacy Notice:</strong> Your selfie is used only for identity
          verification and is processed securely. We do not use your photo for
          any other purposes.
        </AlertDescription>
      </Alert>

      {/* Navigation Buttons */}
      <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 sm:gap-0 pt-6">
        <Button
          variant="outline"
          onClick={onPrevious}
          className="flex items-center justify-center space-x-2 min-h-[48px] sm:min-h-[40px] w-full sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">Previous</span>
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={!photoUrl || isSubmitting || isLoading}
          className="flex items-center justify-center space-x-2 min-h-[48px] sm:min-h-[40px] w-full sm:w-auto"
        >
          <span className="truncate">
            {isSubmitting ? "Submitting..." : "Continue to Phone Verification"}
          </span>
          <ArrowRight className="h-4 w-4 flex-shrink-0" />
        </Button>
      </div>
    </div>
  );
};
