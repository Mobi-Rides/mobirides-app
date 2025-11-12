import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, Clock, FileText, Phone, User, MapPin } from "lucide-react";

interface UserVerificationTabProps {
  userId: string;
}

const useUserVerification = (userId: string) => {
  return useQuery({
    queryKey: ["user-verification", userId],
    queryFn: async () => {
      // Get user verification status
      const { data: verification, error: verError } = await supabase
        .from("user_verifications")
        .select("*")
        .eq("user_id", userId)
        .single();

      // Get license verification
      const { data: license, error: licError } = await supabase
        .from("license_verifications")
        .select("*")
        .eq("user_id", userId)
        .single();

      return {
        verification: verError ? null : verification,
        license: licError ? null : license,
      };
    },
  });
};

const getStatusIcon = (status: string | boolean) => {
  if (status === true || status === "completed" || status === "verified") {
    return <CheckCircle className="h-5 w-5 text-green-600" />;
  } else if (status === false || status === "rejected") {
    return <XCircle className="h-5 w-5 text-red-600" />;
  } else {
    return <Clock className="h-5 w-5 text-yellow-600" />;
  }
};

const getStatusBadge = (status: string | boolean) => {
  if (status === true || status === "completed" || status === "verified") {
    return <Badge variant="default">Verified</Badge>;
  } else if (status === false || status === "rejected") {
    return <Badge variant="destructive">Rejected</Badge>;
  } else {
    return <Badge variant="outline">Pending</Badge>;
  }
};

export const UserVerificationTab = ({ userId }: UserVerificationTabProps) => {
  const { data, isLoading, error } = useUserVerification(userId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Failed to load verification data</p>
        </CardContent>
      </Card>
    );
  }

  const { verification, license } = data || {};

  return (
    <div className="space-y-6">
      {/* Verification Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {!verification ? (
            <p className="text-center text-muted-foreground py-8">
              No verification process started
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(verification.overall_status)}
                  <div>
                    <h4 className="font-medium">Overall Status</h4>
                    <p className="text-sm text-muted-foreground">
                      Current step: {verification.current_step}
                    </p>
                  </div>
                </div>
                {getStatusBadge(verification.overall_status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm">Personal Info</span>
                  </div>
                  {getStatusBadge(verification.personal_info_completed)}
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">Phone Verified</span>
                  </div>
                  {getStatusBadge(verification.phone_verified)}
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">Documents</span>
                  </div>
                  {getStatusBadge(verification.documents_completed)}
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">Address Confirmed</span>
                  </div>
                  {getStatusBadge(verification.address_confirmed)}
                </div>
              </div>

              {verification.rejection_reasons && verification.rejection_reasons.length > 0 && (
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-600">Rejection Reasons</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1">
                      {verification.rejection_reasons.map((reason, index) => (
                        <li key={index} className="text-sm text-red-600">{reason}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {verification.admin_notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Admin Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{verification.admin_notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* License Verification */}
      <Card>
        <CardHeader>
          <CardTitle>Driver's License Verification</CardTitle>
        </CardHeader>
        <CardContent>
          {!license ? (
            <p className="text-center text-muted-foreground py-8">
              No license verification submitted
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(license.status)}
                  <div>
                    <h4 className="font-medium">License Status</h4>
                    <p className="text-sm text-muted-foreground">
                      {license.license_number ? `License: ${license.license_number}` : "No license number"}
                    </p>
                  </div>
                </div>
                {getStatusBadge(license.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h5 className="font-medium">Personal Details</h5>
                  <div className="text-sm space-y-1">
                    {license.date_of_birth && (
                      <p>Date of Birth: {new Date(license.date_of_birth).toLocaleDateString()}</p>
                    )}
                    {license.country_of_issue && (
                      <p>Country: {license.country_of_issue}</p>
                    )}
                    {license.expiry_date && (
                      <p>Expires: {new Date(license.expiry_date).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="font-medium">Documents</h5>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Front Image</span>
                      <Badge variant={license.front_image_path ? "default" : "outline"}>
                        {license.front_image_path ? "Uploaded" : "Missing"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Back Image</span>
                      <Badge variant={license.back_image_path ? "default" : "outline"}>
                        {license.back_image_path ? "Uploaded" : "Missing"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {license.rejection_reason && (
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-600">Rejection Reason</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-red-600">{license.rejection_reason}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {verification && (
              <>
                <div className="flex items-center space-x-3 p-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div className="text-sm">
                    <span className="font-medium">Verification Started</span>
                    <span className="text-muted-foreground ml-2">
                      {new Date(verification.started_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                {verification.last_updated_at !== verification.started_at && (
                  <div className="flex items-center space-x-3 p-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="text-sm">
                      <span className="font-medium">Last Updated</span>
                      <span className="text-muted-foreground ml-2">
                        {new Date(verification.last_updated_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
                {verification.completed_at && (
                  <div className="flex items-center space-x-3 p-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="text-sm">
                      <span className="font-medium">Verification Completed</span>
                      <span className="text-muted-foreground ml-2">
                        {new Date(verification.completed_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
            {license && (
              <>
                <div className="flex items-center space-x-3 p-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="text-sm">
                    <span className="font-medium">License Submitted</span>
                    <span className="text-muted-foreground ml-2">
                      {new Date(license.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};