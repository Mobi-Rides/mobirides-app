
/**
 * Phone Verification Step Component
 * Handles phone number verification via SMS
 */

import React, { useState } from "react";
import { useVerification } from "@/hooks/useVerification";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft, Phone, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface PhoneVerificationStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

export const PhoneVerificationStep: React.FC<PhoneVerificationStepProps> = ({
  onNext,
  onPrevious,
}) => {
  const { updatePhoneVerification, isLoading } = useVerification();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleSendCode = async () => {
    if (!phoneNumber) {
      toast.error("Please enter your phone number");
      return;
    }

    // Simulate sending SMS code
    setTimeout(() => {
      setCodeSent(true);
      toast.success("Verification code sent to your phone");
    }, 1000);
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      toast.error("Please enter the verification code");
      return;
    }

    // Simulate code verification
    if (verificationCode === "123456" || verificationCode.length === 6) {
      setIsVerified(true);
      await updatePhoneVerification({
        phoneNumber,
        countryCode: "+267",
        verificationCode,
        isVerified: true,
      });
      toast.success("Phone number verified successfully!");
    } else {
      toast.error("Invalid verification code");
    }
  };

  const handleNext = () => {
    if (!isVerified) {
      toast.error("Please verify your phone number first");
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Phone Verification</h2>
        <p className="text-muted-foreground">
          Verify your phone number to secure your account
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Phone className="h-5 w-5" />
            <span>Phone Number Verification</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <div className="flex space-x-2">
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+267 XX XXX XXX"
                disabled={codeSent}
              />
              <Button 
                onClick={handleSendCode}
                disabled={codeSent || !phoneNumber}
                variant="outline"
              >
                {codeSent ? "Code Sent" : "Send Code"}
              </Button>
            </div>
          </div>

          {codeSent && !isVerified && (
            <div>
              <Label htmlFor="verificationCode">
                <MessageSquare className="h-4 w-4 inline mr-2" />
                Verification Code
              </Label>
              <div className="flex space-x-2">
                <Input
                  id="verificationCode"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                />
                <Button onClick={handleVerifyCode} disabled={!verificationCode}>
                  Verify
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Enter the 6-digit code sent to your phone
              </p>
            </div>
          )}

          {isVerified && (
            <div className="flex items-center justify-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <Phone className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-green-700">Phone number verified successfully!</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <Button onClick={handleNext} disabled={isLoading || !isVerified}>
          <span>Continue to Address</span>
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
