
/**
 * Personal Information Step Component
 * Collects user's basic personal details
 */

import React, { useState, useEffect } from "react";
import { useVerification } from "@/contexts/VerificationContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, User, RefreshCw, Info } from "lucide-react";
import { toast } from "sonner";

interface PersonalInfoStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

export const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({
  onNext,
}) => {
  const { verificationData, updatePersonalInfo, isLoading, refreshFromProfile } = useVerification();
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
  });
  const [hasPrefilledData, setHasPrefilledData] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update form data when verification data changes
  useEffect(() => {
    console.log("[PersonalInfoStep] Verification data updated:", verificationData);
    
    if (verificationData?.personal_info) {
      const personalInfo = verificationData.personal_info;
      console.log("[PersonalInfoStep] Setting form data from personal_info:", personalInfo);
      
      const newFormData = {
        fullName: personalInfo.fullName || "",
        dateOfBirth: personalInfo.dateOfBirth || "",
        nationalIdNumber: personalInfo.nationalIdNumber || "",
        phoneNumber: personalInfo.phoneNumber || "",
        email: personalInfo.email || "",
        address: {
          street: personalInfo.address?.street || "",
          area: personalInfo.address?.area || "",
          city: personalInfo.address?.city || "",
          postalCode: personalInfo.address?.postalCode || "",
        },
      };
      
      console.log("[PersonalInfoStep] New form data:", newFormData);
      setFormData(newFormData);
      
      // Check if we have pre-filled data from profile
      const hasData = personalInfo.fullName || personalInfo.phoneNumber || personalInfo.email;
      console.log("[PersonalInfoStep] Has prefilled data:", hasData);
      setHasPrefilledData(!!hasData);
    }
  }, [verificationData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.dateOfBirth || !formData.nationalIdNumber) {
      toast.error("Please fill in all required fields");
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
      setIsRefreshing(true);
      console.log("[PersonalInfoStep] Refreshing from profile");
      await refreshFromProfile();
      toast.success("Profile data refreshed successfully!");
    } catch (error) {
      console.error("Failed to refresh from profile:", error);
      toast.error("Failed to refresh profile data");
    } finally {
      setIsRefreshing(false);
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

      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {hasPrefilledData ? "Profile Data Available" : "Import Profile Data"}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {hasPrefilledData 
                  ? "Some fields have been pre-filled from your profile. You can refresh or update as needed."
                  : "Click to import available data from your profile to speed up the process."
                }
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRefreshFromProfile}
                disabled={isRefreshing}
                className="text-blue-700 border-blue-300 hover:bg-blue-100 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh from Profile'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
