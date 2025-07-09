/**
 * Personal Information Step Component
 * Collects and validates personal information required for Botswana verification
 * Includes National ID (Omang), contact details, and emergency contact information
 */

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useVerification } from "@/contexts/VerificationContext";
import { PersonalInfo } from "@/types/verification";
import {
  PersonalInfoSchema,
  validateOmangNumber,
} from "@/utils/verificationValidation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Users,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface PersonalInfoStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

/**
 * Personal Information Step Component
 * Handles collection and validation of user personal data
 */
export const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({
  onNext,
}) => {
  const navigate = useNavigate();
  const { verificationData, updatePersonalInfo, isLoading } = useVerification();
  const [omangValidation, setOmangValidation] = useState<{
    isValid: boolean;
    error?: string;
  } | null>(null);

  /**
   * Handle back to home navigation
   * Since this is the first step, go back to main app
   */
  const handleBackToHome = () => {
    navigate("/");
  };

  // Initialize form with existing data
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    getValues,
  } = useForm<PersonalInfo>({
    resolver: zodResolver(PersonalInfoSchema),
    defaultValues: verificationData?.personalInfo || {},
    mode: "onChange",
  });

  // Watch the National ID field for real-time validation
  const nationalIdNumber = watch("nationalIdNumber");

  /**
   * Load existing personal info data on component mount
   * Populates form with previously saved data
   */
  useEffect(() => {
    if (verificationData?.personalInfo) {
      const personalInfo = verificationData.personalInfo;

      // Set form values from existing data
      Object.entries(personalInfo).forEach(([key, value]) => {
        if (value !== undefined) {
          setValue(key as keyof PersonalInfo, value as any);
        }
      });
    }
  }, [verificationData?.personalInfo, setValue]);

  /**
   * Validate Omang number in real-time
   * Provides immediate feedback on National ID format
   */
  useEffect(() => {
    if (nationalIdNumber && nationalIdNumber.length === 9) {
      const validation = validateOmangNumber(nationalIdNumber);
      setOmangValidation(validation);
    } else {
      setOmangValidation(null);
    }
  }, [nationalIdNumber]);

  /**
   * Handle form submission
   * Validates and saves personal information
   */
  const onSubmit = async (data: PersonalInfo) => {
    try {
      // Additional validation for Omang
      if (nationalIdNumber) {
        const omangValidation = validateOmangNumber(nationalIdNumber);
        if (!omangValidation.isValid) {
          toast.error(omangValidation.error || "Invalid National ID number");
          return;
        }
      }

      // Save personal information
      await updatePersonalInfo(data);

      // Move to next step automatically if save is successful
      toast.success("Personal information saved successfully");
      setTimeout(() => {
        onNext();
      }, 1000);
    } catch (error) {
      console.error("Failed to save personal information:", error);
      toast.error("Failed to save personal information");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Personal Details Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Personal Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="flex items-center space-x-1">
              <span>Full Name</span>
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fullName"
              placeholder="Enter your full name as it appears on your ID"
              {...register("fullName")}
              className={errors.fullName ? "border-red-500" : ""}
            />
            {errors.fullName && (
              <p className="text-sm text-red-500 flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.fullName.message}</span>
              </p>
            )}
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label
              htmlFor="dateOfBirth"
              className="flex items-center space-x-1"
            >
              <Calendar className="h-4 w-4" />
              <span>Date of Birth</span>
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="dateOfBirth"
              type="date"
              {...register("dateOfBirth")}
              className={errors.dateOfBirth ? "border-red-500" : ""}
            />
            {errors.dateOfBirth && (
              <p className="text-sm text-red-500 flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.dateOfBirth.message}</span>
              </p>
            )}
          </div>

          {/* National ID (Omang) */}
          <div className="space-y-2">
            <Label
              htmlFor="nationalIdNumber"
              className="flex items-center space-x-1"
            >
              <CreditCard className="h-4 w-4" />
              <span>National ID (Omang) Number</span>
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nationalIdNumber"
              placeholder="Enter your 9-digit Omang number"
              maxLength={9}
              {...register("nationalIdNumber")}
              className={
                errors.nationalIdNumber ||
                (omangValidation && !omangValidation.isValid)
                  ? "border-red-500"
                  : omangValidation?.isValid
                    ? "border-green-500"
                    : ""
              }
            />

            {/* Real-time Omang validation feedback */}
            {omangValidation && (
              <div
                className={`text-sm flex items-center space-x-1 ${omangValidation.isValid ? "text-green-600" : "text-red-500"}`}
              >
                {omangValidation.isValid ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span>
                  {omangValidation.isValid
                    ? "Valid Omang number"
                    : omangValidation.error}
                </span>
              </div>
            )}

            {errors.nationalIdNumber && (
              <p className="text-sm text-red-500 flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.nationalIdNumber.message}</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Phone className="h-5 w-5" />
            <span>Contact Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Phone Number */}
          <div className="space-y-2">
            <Label
              htmlFor="phoneNumber"
              className="flex items-center space-x-1"
            >
              <Phone className="h-4 w-4" />
              <span>Phone Number</span>
              <span className="text-red-500">*</span>
            </Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                +267
              </span>
              <Input
                id="phoneNumber"
                placeholder="Enter your Botswana mobile number"
                className={`rounded-l-none ${errors.phoneNumber ? "border-red-500" : ""}`}
                {...register("phoneNumber")}
              />
            </div>
            {errors.phoneNumber && (
              <p className="text-sm text-red-500 flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.phoneNumber.message}</span>
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Format: +267XXXXXXXX (Botswana mobile number)
            </p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center space-x-1">
              <Mail className="h-4 w-4" />
              <span>Email Address</span>
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              {...register("email")}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-500 flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.email.message}</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Address Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Address Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Street Address */}
          <div className="space-y-2">
            <Label
              htmlFor="address.street"
              className="flex items-center space-x-1"
            >
              <span>Street Address</span>
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="address.street"
              placeholder="Enter your street address"
              {...register("address.street")}
              className={errors.address?.street ? "border-red-500" : ""}
            />
            {errors.address?.street && (
              <p className="text-sm text-red-500 flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.address.street.message}</span>
              </p>
            )}
          </div>

          {/* Area/Suburb */}
          <div className="space-y-2">
            <Label
              htmlFor="address.area"
              className="flex items-center space-x-1"
            >
              <span>Area/Suburb</span>
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="address.area"
              placeholder="Enter your area or suburb"
              {...register("address.area")}
              className={errors.address?.area ? "border-red-500" : ""}
            />
            {errors.address?.area && (
              <p className="text-sm text-red-500 flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.address.area.message}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* City */}
            <div className="space-y-2">
              <Label
                htmlFor="address.city"
                className="flex items-center space-x-1"
              >
                <span>City</span>
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="address.city"
                placeholder="e.g., Gaborone"
                {...register("address.city")}
                className={errors.address?.city ? "border-red-500" : ""}
              />
              {errors.address?.city && (
                <p className="text-sm text-red-500 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.address.city.message}</span>
                </p>
              )}
            </div>

            {/* Postal Code */}
            <div className="space-y-2">
              <Label htmlFor="address.postalCode">Postal Code (Optional)</Label>
              <Input
                id="address.postalCode"
                placeholder="e.g., 00267"
                {...register("address.postalCode")}
                className={errors.address?.postalCode ? "border-red-500" : ""}
              />
              {errors.address?.postalCode && (
                <p className="text-sm text-red-500 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.address.postalCode.message}</span>
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Emergency Contact</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Emergency Contact Name */}
          <div className="space-y-2">
            <Label
              htmlFor="emergencyContact.name"
              className="flex items-center space-x-1"
            >
              <span>Contact Name</span>
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="emergencyContact.name"
              placeholder="Enter emergency contact's full name"
              {...register("emergencyContact.name")}
              className={errors.emergencyContact?.name ? "border-red-500" : ""}
            />
            {errors.emergencyContact?.name && (
              <p className="text-sm text-red-500 flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.emergencyContact.name.message}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Relationship */}
            <div className="space-y-2">
              <Label
                htmlFor="emergencyContact.relationship"
                className="flex items-center space-x-1"
              >
                <span>Relationship</span>
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="emergencyContact.relationship"
                placeholder="e.g., Spouse, Parent, Sibling"
                {...register("emergencyContact.relationship")}
                className={
                  errors.emergencyContact?.relationship ? "border-red-500" : ""
                }
              />
              {errors.emergencyContact?.relationship && (
                <p className="text-sm text-red-500 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.emergencyContact.relationship.message}</span>
                </p>
              )}
            </div>

            {/* Emergency Contact Phone */}
            <div className="space-y-2">
              <Label
                htmlFor="emergencyContact.phoneNumber"
                className="flex items-center space-x-1"
              >
                <span>Phone Number</span>
                <span className="text-red-500">*</span>
              </Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  +267
                </span>
                <Input
                  id="emergencyContact.phoneNumber"
                  placeholder="Emergency contact number"
                  className={`rounded-l-none ${errors.emergencyContact?.phoneNumber ? "border-red-500" : ""}`}
                  {...register("emergencyContact.phoneNumber")}
                />
              </div>
              {errors.emergencyContact?.phoneNumber && (
                <p className="text-sm text-red-500 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.emergencyContact.phoneNumber.message}</span>
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Notice */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          All information provided must match your official documents. Any
          discrepancies may result in verification delays or rejection.
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="flex justify-between space-x-4 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={handleBackToHome}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Button>

        <Button
          type="submit"
          disabled={!isValid || isLoading}
          className="flex items-center space-x-2"
        >
          <span>{isLoading ? "Saving..." : "Save & Continue"}</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};
