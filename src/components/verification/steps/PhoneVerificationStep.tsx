/**
 * Phone Verification Step Component
 * Handles SMS-based phone number verification
 * Includes OTP generation, validation, and retry logic
 */

import React, { useState, useEffect, useRef } from "react";
import { useVerification } from "@/contexts/VerificationContext";
import { PhoneVerification } from "@/types/verification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface PhoneVerificationStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

/**
 * OTP Input Component
 * Handles 6-digit OTP input with auto-focus and validation
 */
const OTPInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled = false }) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusIndex, setFocusIndex] = useState(0);

  /**
   * Handle input change for individual OTP digits
   */
  const handleInputChange = (index: number, inputValue: string) => {
    // Only allow digits
    const digit = inputValue.replace(/\D/g, "").slice(-1);

    // Update the value
    const newValue = value.split("");
    newValue[index] = digit;
    const updatedValue = newValue.join("");

    onChange(updatedValue);

    // Move to next input if digit entered
    if (digit && index < 5) {
      setFocusIndex(index + 1);
    }
  };

  /**
   * Handle backspace and navigation
   */
  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      e.preventDefault();

      const newValue = value.split("");
      newValue[index] = "";
      onChange(newValue.join(""));

      // Move to previous input if current is empty
      if (index > 0 && !value[index]) {
        setFocusIndex(index - 1);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      setFocusIndex(index - 1);
    } else if (e.key === "ArrowRight" && index < 5) {
      setFocusIndex(index + 1);
    }
  };

  /**
   * Handle paste operation
   */
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "");
    const digits = pasteData.slice(0, 6).split("");

    while (digits.length < 6) {
      digits.push("");
    }

    onChange(digits.join(""));
    setFocusIndex(Math.min(digits.length, 5));
  };

  // Focus management
  useEffect(() => {
    if (inputRefs.current[focusIndex]) {
      inputRefs.current[focusIndex]?.focus();
    }
  }, [focusIndex]);

  return (
    <div className="flex justify-center space-x-2">
      {Array.from({ length: 6 }, (_, index) => (
        <Input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ""}
          onChange={(e) => handleInputChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => setFocusIndex(index)}
          disabled={disabled}
          className={`
            w-12 h-12 text-center text-lg font-medium
            ${value[index] ? "border-green-500 bg-green-50" : ""}
            ${focusIndex === index ? "ring-2 ring-primary" : ""}
          `}
        />
      ))}
    </div>
  );
};

/**
 * Countdown Timer Component
 * Shows remaining time for OTP validity or resend cooldown
 */
const CountdownTimer: React.FC<{
  initialSeconds: number;
  onComplete: () => void;
  isActive: boolean;
}> = ({ initialSeconds, onComplete, isActive }) => {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (!isActive) return;

    if (seconds > 0) {
      const timer = setTimeout(() => setSeconds(seconds - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      onComplete();
    }
  }, [seconds, isActive, onComplete]);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = time % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <span className="flex items-center space-x-1 text-sm text-muted-foreground">
      <Clock className="h-4 w-4" />
      <span>{formatTime(seconds)}</span>
    </span>
  );
};

/**
 * Main Phone Verification Step Component
 */
export const PhoneVerificationStep: React.FC<PhoneVerificationStepProps> = ({
  onNext,
  onPrevious,
}) => {
  const { verificationData, updatePhoneVerification, isLoading } =
    useVerification();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [otpExpired, setOtpExpired] = useState(false);

  // Debug logging for state changes
  useEffect(() => {
    console.log("[PhoneVerificationStep] isOtpSent state changed:", isOtpSent);
  }, [isOtpSent]);

  // Add timeout to prevent infinite loading from verification context
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        console.warn(
          "[PhoneVerificationStep] Verification context loading timeout",
        );
        // If still loading after 10 seconds, force proceed with local state
        if (isLoading) {
          toast.warning(
            "Database update taking longer than expected, continuing with verification",
          );
        }
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  // Load existing phone verification data
  useEffect(() => {
    if (verificationData?.phoneVerification) {
      const phoneData = verificationData.phoneVerification;

      if (phoneData.phoneNumber) {
        setPhoneNumber(phoneData.phoneNumber);
      }

      // Only update isOtpSent if it's currently false to prevent resets
      if (phoneData.isVerified && !isOtpSent) {
        console.log(
          "[PhoneVerificationStep] Setting isOtpSent to true from verification data",
        );
        setIsOtpSent(true);
      }

      setAttemptCount(phoneData.attemptCount || 0);
    }

    // Load phone number from personal info if available
    if (verificationData?.personalInfo?.phoneNumber && !phoneNumber) {
      setPhoneNumber(verificationData.personalInfo.phoneNumber);
    }
  }, [verificationData]);

  /**
   * Generate and simulate sending OTP
   * In production, this would call your SMS service
   */
  const sendOTP = async () => {
    if (!phoneNumber) {
      toast.error("Please enter a valid phone number");
      return;
    }

    console.log(
      "[PhoneVerificationStep] Starting OTP send process for:",
      phoneNumber,
    );

    try {
      setIsSendingOtp(true);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // For development: Generate a fake OTP and show it in console/toast
      const developmentOTP = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();
      console.log(`[Development] OTP for ${phoneNumber}: ${developmentOTP}`);

      // Store the development OTP in session storage for validation
      sessionStorage.setItem("dev_otp", developmentOTP);

      // Show OTP in development mode
      if (process.env.NODE_ENV === "development") {
        toast.success(`Development OTP: ${developmentOTP}`, {
          duration: 10000,
          description: "Use this code for verification",
        });
      }

      // Update verification data
      const phoneData: Partial<PhoneVerification> = {
        phoneNumber,
        countryCode: "+267",
        attemptCount: attemptCount + 1,
        isVerified: false,
      };

      console.log("[PhoneVerificationStep] About to set isOtpSent to true");

      // Set OTP sent state immediately to show OTP input
      setIsOtpSent(true);
      setAttemptCount((prev) => prev + 1);
      setCanResend(false);
      setOtpExpired(false);

      console.log(
        "[PhoneVerificationStep] State updated, now calling updatePhoneVerification with:",
        phoneData,
      );

      // Try to update the database, but don't block the UI if it fails
      try {
        await updatePhoneVerification(phoneData);
        console.log(
          "[PhoneVerificationStep] updatePhoneVerification completed successfully",
        );
      } catch (error) {
        console.warn(
          "[PhoneVerificationStep] Database update failed, but continuing with OTP flow:",
          error,
        );
        // Don't show error to user as the OTP flow can still work
      }

      console.log(
        "[PhoneVerificationStep] OTP flow completed, isOtpSent should be:",
        true,
      );
      toast.success("Verification code sent to your phone");
    } catch (error) {
      console.error("Failed to send OTP:", error);
      toast.error("Failed to send verification code");
    } finally {
      setIsSendingOtp(false);
    }
  };

  /**
   * Verify OTP code
   */
  const verifyOTP = async () => {
    if (otpCode.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    try {
      setIsVerifying(true);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // For development: Check against stored OTP
      const developmentOTP = sessionStorage.getItem("dev_otp");
      const isValidOTP = otpCode === developmentOTP;

      if (isValidOTP) {
        // Update verification as successful
        const phoneData: Partial<PhoneVerification> = {
          phoneNumber,
          countryCode: "+267",
          verificationCode: otpCode,
          isVerified: true,
          attemptCount,
        };

        await updatePhoneVerification(phoneData);

        toast.success("Phone number verified successfully!");

        // Clean up development OTP
        sessionStorage.removeItem("dev_otp");

        // Auto-advance to next step
        setTimeout(() => {
          onNext();
        }, 1000);
      } else {
        toast.error("Invalid verification code. Please try again.");
        setOtpCode("");
      }
    } catch (error) {
      console.error("Failed to verify OTP:", error);
      toast.error("Failed to verify code");
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * Handle OTP expiration
   */
  const handleOtpExpiration = () => {
    setOtpExpired(true);
    setCanResend(true);
    toast.error("Verification code expired. Please request a new one.");
  };

  /**
   * Handle resend cooldown completion
   */
  const handleResendCooldownComplete = () => {
    setCanResend(true);
  };

  /**
   * Resend OTP
   */
  const resendOTP = () => {
    setOtpCode("");
    setOtpExpired(false);
    sendOTP();
  };

  // Check if phone is already verified
  const isPhoneVerified = verificationData?.phoneVerification?.isVerified;

  if (isPhoneVerified) {
    return (
      <div className="text-center py-8">
        <div className="mb-6">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-700 mb-2">
            Phone Verified!
          </h2>
          <p className="text-muted-foreground">
            Your phone number {verificationData.phoneVerification.phoneNumber}{" "}
            has been verified.
          </p>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onPrevious}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <Button onClick={onNext}>
            Continue to Address Confirmation
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
        <h2 className="text-2xl font-bold mb-2">Verify Your Phone Number</h2>
        <p className="text-muted-foreground">
          We'll send a verification code to confirm your phone number
        </p>
      </div>

      {/* Phone Number Input */}
      {!isOtpSent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="h-5 w-5" />
              <span>Phone Number</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Botswana Mobile Number</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  +267
                </span>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="Enter your mobile number"
                  value={phoneNumber.replace("+267", "")}
                  onChange={(e) =>
                    setPhoneNumber(`+267${e.target.value.replace(/\D/g, "")}`)
                  }
                  className="rounded-l-none"
                  maxLength={8}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Format: +267XXXXXXXX (8 digits after country code)
              </p>
            </div>

            <Button
              onClick={sendOTP}
              disabled={
                !phoneNumber || phoneNumber.length !== 12 || isSendingOtp
              }
              className="w-full flex items-center space-x-2"
            >
              <MessageCircle className="h-4 w-4" />
              <span>
                {isSendingOtp ? "Sending..." : "Send Verification Code"}
              </span>
            </Button>

            {/* Debug button for development */}
            {process.env.NODE_ENV === "development" && (
              <Button
                variant="outline"
                onClick={() => {
                  console.log("[PhoneVerificationStep] Manual OTP trigger");
                  setIsOtpSent(true);
                  toast.success("OTP screen manually triggered (Dev mode)");
                }}
                className="w-full mt-2"
              >
                Show OTP Input (Debug)
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* OTP Verification */}
      {isOtpSent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>Enter Verification Code</span>
              </div>
              {attemptCount > 0 && (
                <Badge variant="outline">Attempt {attemptCount}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                We sent a 6-digit code to <strong>{phoneNumber}</strong>
              </p>

              <OTPInput
                value={otpCode}
                onChange={setOtpCode}
                disabled={isVerifying || otpExpired}
              />
            </div>

            {/* OTP Status */}
            <div className="text-center space-y-3">
              {!otpExpired && (
                <div className="flex justify-center items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    Code expires in:
                  </span>
                  <CountdownTimer
                    initialSeconds={300} // 5 minutes
                    onComplete={handleOtpExpiration}
                    isActive={isOtpSent && !otpExpired}
                  />
                </div>
              )}

              {otpExpired && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Verification code expired. Please request a new one.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={verifyOTP}
                disabled={otpCode.length !== 6 || isVerifying || otpExpired}
                className="w-full flex items-center space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>{isVerifying ? "Verifying..." : "Verify Code"}</span>
              </Button>

              {/* Resend Option */}
              <div className="text-center">
                {canResend ? (
                  <Button
                    variant="ghost"
                    onClick={resendOTP}
                    disabled={isSendingOtp}
                    className="text-sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {isSendingOtp ? "Sending..." : "Resend Code"}
                  </Button>
                ) : (
                  <div className="flex justify-center items-center space-x-2 text-sm text-muted-foreground">
                    <span>Resend available in:</span>
                    <CountdownTimer
                      initialSeconds={60} // 1 minute cooldown
                      onComplete={handleResendCooldownComplete}
                      isActive={!canResend}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Development Helper */}
      {process.env.NODE_ENV === "development" && isOtpSent && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Development Mode:</strong> Check the browser console or
            toast notification for the OTP code.
          </AlertDescription>
        </Alert>
      )}

      {/* Security Notice */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          We'll only use your phone number for verification and important
          account notifications. Standard SMS rates may apply.
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

        {/* Skip option for development */}
        {process.env.NODE_ENV === "development" && (
          <Button
            variant="ghost"
            onClick={onNext}
            className="text-orange-600 hover:text-orange-700"
          >
            Skip (Dev Only)
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};
