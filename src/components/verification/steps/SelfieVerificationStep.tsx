/**
 * Selfie Verification Step Component
 * Handles selfie capture for identity verification
 * Includes camera integration, face detection guidance, and photo validation
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useVerification } from "@/contexts/VerificationContext";
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
    } catch (error) {
      console.error("Camera initialization error:", error);
      setCameraError(
        "Unable to access camera. Please ensure camera permissions are granted.",
      );
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
   * Check if browser supports camera
   */
  const checkCameraSupport = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  };

  // Camera support check
  if (!checkCameraSupport()) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Camera Not Supported</h3>
        <p className="text-muted-foreground mb-6">
          Your browser doesn't support camera access. Please use a modern
          browser or upload a selfie manually.
        </p>
        <div className="flex justify-between">
          <Button variant="outline" onClick={onPrevious}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <Button onClick={onNext}>
            Skip for Now
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
        <h2 className="text-2xl font-bold mb-2">
          Take Your Verification Selfie
        </h2>
        <p className="text-muted-foreground">
          We need to verify that you're the same person as in your ID documents
        </p>
      </div>

      {/* Guidelines */}
      <SelfieGuidelines />

      {/* Camera View */}
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
          <CameraView
            onPhotoCapture={handlePhotoCapture}
            photoUrl={photoUrl}
            onRetake={handleRetake}
          />
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
          disabled={!photoUrl || isSubmitting || isLoading}
          className="flex items-center space-x-2"
        >
          <span>
            {isSubmitting ? "Submitting..." : "Continue to Phone Verification"}
          </span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
