
/**
 * Personal Information Step Component
 * Collects user's basic personal details
 */

import React, { useState, useEffect } from "react";
import { useVerification } from "@/hooks/useVerification";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, User, RefreshCw, Info, Phone } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { VerificationService } from "@/services/verificationService";
import countryCodes from "@/constants/Countries";

interface PersonalInfoStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

export const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({
  onNext,
}) => {
  const { verificationData, updatePersonalInfo, isLoading, refreshData } = useVerification();
  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    nationalIdNumber: "",
    phoneNumber: "",
    email: "",
    address: {
      street: "",
      area: "",
      city: "",
      postalCode: "",
    },
    emergencyContact: {
      name: "",
      relationship: "",
      phoneNumber: "",
      countryCode: "",
    },
  });
  const [hasPrefilledData, setHasPrefilledData] = useState(false);

  // Relationships list aligned with profile editor
  const RELATIONSHIPS = [
    "Spouse", "Parent", "Child", "Sibling", "Friend",
    "Colleague", "Neighbor", "Other"
  ];

  // Update form data when verification data changes
  useEffect(() => {
    if (verificationData?.personal_info) {
      const personalInfo = verificationData.personal_info;
      const newFormData = {
        fullName: String((personalInfo as any)?.fullName || ""),
        dateOfBirth: String((personalInfo as any)?.dateOfBirth || ""),
        nationalIdNumber: String((personalInfo as any)?.nationalIdNumber || ""),
        phoneNumber: String((personalInfo as any)?.phoneNumber || ""),
        email: String((personalInfo as any)?.email || ""),
        address: {
          street: String((personalInfo as any)?.address?.street || ""),
          area: String((personalInfo as any)?.address?.area || ""),
          city: String((personalInfo as any)?.address?.city || ""),
          postalCode: String((personalInfo as any)?.address?.postalCode || ""),
        },
        emergencyContact: {
          name: String((personalInfo as any)?.emergencyContact?.name || ""),
          relationship: String((personalInfo as any)?.emergencyContact?.relationship || ""),
          phoneNumber: String((personalInfo as any)?.emergencyContact?.phoneNumber || ""),
          countryCode: String((personalInfo as any)?.emergencyContact?.countryCode || ""),
        },
      };
      
      setFormData(newFormData);
      
      // Check if we have pre-filled data from profile
      const hasData = personalInfo.fullName || personalInfo.phoneNumber || personalInfo.email;
      setHasPrefilledData(!!hasData);
    }
  }, [verificationData]);

  const validateInternationalPhone = (phone: string): boolean => {
    // Basic international phone validation (E.164-like or common local formats)
    // 1) Allow leading '+' followed by 8-15 digits
    // 2) Or allow digits with spaces/hyphens/parentheses, total digits 7-15
    const trimmed = phone.trim();
    const plusFormat = /^\+[0-9\s\-()]{8,20}$/; // coarse pre-check for plus format with separators
    if (plusFormat.test(trimmed)) {
      const digits = trimmed.replace(/[^0-9]/g, "");
      return digits.length >= 8 && digits.length <= 15;
    }
    const digitsOnly = trimmed.replace(/[^0-9]/g, "");
    return digitsOnly.length >= 7 && digitsOnly.length <= 15;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.dateOfBirth || !formData.nationalIdNumber) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Emergency contact required fields
    const ec = formData.emergencyContact;
    if (!ec.name.trim() || !ec.relationship || !ec.countryCode || !ec.phoneNumber.trim()) {
      toast.error("Please provide emergency contact name, relationship, country, and phone");
      return;
    }
    if (!validateInternationalPhone(ec.phoneNumber)) {
      toast.error("Enter a valid international emergency contact phone number");
      return;
    }

    try {
      await updatePersonalInfo(formData);
      toast.success("Personal information saved successfully!");
      onNext();
    } catch (error) {
      console.error("Failed to save personal information:", error);
      toast.error("Failed to save personal information");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.includes("address.")) {
      const addressField = field.split(".")[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else if (field.includes("emergencyContact.")) {
      const ecField = field.split(".")[1];
      setFormData(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [ecField]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleRefreshFromProfile = async () => {
    if (!verificationData?.user_id) return;
    
    try {
      const success = await VerificationService.refreshFromProfile(verificationData.user_id);
      if (success) {
        await refreshData();
        toast.success("Profile data refreshed successfully!");
      } else {
        toast.error("Failed to refresh profile data");
      }
    } catch (error) {
      console.error("Failed to refresh from profile:", error);
      toast.error("Failed to refresh profile data");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Personal Information</h2>
        <p className="text-muted-foreground">
          Please provide your personal details for verification
        </p>
      </div>

      {hasPrefilledData && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Profile Data Imported
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  We've pre-filled some fields from your profile. Please review and update as needed.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshFromProfile}
                  className="text-blue-700 border-blue-300 hover:bg-blue-100 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh from Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Basic Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="nationalIdNumber">National ID Number *</Label>
                <Input
                  id="nationalIdNumber"
                  value={formData.nationalIdNumber}
                  onChange={(e) => handleInputChange("nationalIdNumber", e.target.value)}
                  placeholder="Enter your Omang number"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  placeholder="+267 XX XXX XXX"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Address Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={formData.address.street}
                    onChange={(e) => handleInputChange("address.street", e.target.value)}
                    placeholder="Street address"
                  />
                </div>

                <div>
                  <Label htmlFor="area">Area/Suburb</Label>
                  <Input
                    id="area"
                    value={formData.address.area}
                    onChange={(e) => handleInputChange("address.area", e.target.value)}
                    placeholder="Area or suburb"
                  />
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.address.city}
                    onChange={(e) => handleInputChange("address.city", e.target.value)}
                    placeholder="City"
                  />
                </div>

                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={formData.address.postalCode}
                    onChange={(e) => handleInputChange("address.postalCode", e.target.value)}
                    placeholder="Postal code"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact Section */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2"><Phone className="h-4 w-4" />Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ec_name">Name *</Label>
                  <Input
                    id="ec_name"
                    value={formData.emergencyContact.name}
                    onChange={(e) => handleInputChange("emergencyContact.name", e.target.value)}
                    placeholder="Enter contact name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="ec_relationship">Relationship *</Label>
                  <Select
                    value={formData.emergencyContact.relationship}
                    onValueChange={(value) => handleInputChange("emergencyContact.relationship", value)}
                  >
                    <SelectTrigger id="ec_relationship">
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATIONSHIPS.map((relationship) => (
                        <SelectItem key={relationship} value={relationship}>
                          {relationship}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ec_country">Country *</Label>
                  <Select
                    value={formData.emergencyContact.countryCode}
                    onValueChange={(value) => handleInputChange("emergencyContact.countryCode", value)}
                  >
                    <SelectTrigger id="ec_country">
                      <SelectValue placeholder="Select country code" />
                    </SelectTrigger>
                    <SelectContent>
                      {countryCodes.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.country} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ec_phone">Phone Number *</Label>
                  <Input
                    id="ec_phone"
                    type="tel"
                    value={formData.emergencyContact.phoneNumber}
                    onChange={(e) => handleInputChange("emergencyContact.phoneNumber", e.target.value)}
                    placeholder="Enter phone number (e.g., +1234567890)"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <span>{isLoading ? "Saving..." : "Continue to Documents"}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
