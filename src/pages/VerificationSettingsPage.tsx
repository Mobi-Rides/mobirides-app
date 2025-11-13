import React from 'react';
import { ShieldCheck, ArrowLeft, CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVerificationStatus } from '@/hooks/useVerificationStatus';
import { format } from 'date-fns';

const VerificationSettingsPage = () => {
  const navigate = useNavigate();
  const { verificationData, isVerified, isLoading } = useVerificationStatus();

  const getStatusBadge = () => {
    if (isLoading) {
      return <Badge variant="outline">Loading...</Badge>;
    }

    switch (verificationData?.overall_status) {
      case 'completed':
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case 'pending_review':
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Pending Review
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      case 'requires_reverification':
        return (
          <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Re-verification Required
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            Not Started
          </Badge>
        );
    }
  };

  const getProgressPercentage = () => {
    if (!verificationData) return 0;
    
    let completed = 0;
    if (verificationData.personal_info_completed) completed++;
    if (verificationData.documents_completed) completed++;
    if (verificationData.overall_status === 'completed') completed++;
    
    return Math.round((completed / 3) * 100);
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 p-4 max-w-5xl mx-auto">
      <SettingsSidebar activeItem="verification" />
      <main className="flex-1">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="md:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Verification</h1>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Verification Status</CardTitle>
              {getStatusBadge()}
            </div>
            <CardDescription>
              Manage your identity verification for MobiRides
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{getProgressPercentage()}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </div>

            {/* Verification Details */}
            {verificationData && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Personal Info</p>
                    <p className="font-medium">
                      {verificationData.personal_info_completed ? (
                        <span className="text-green-600 dark:text-green-400">✓ Completed</span>
                      ) : (
                        <span className="text-muted-foreground">Not completed</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Documents</p>
                    <p className="font-medium">
                      {verificationData.documents_completed ? (
                        <span className="text-green-600 dark:text-green-400">✓ Completed</span>
                      ) : (
                        <span className="text-muted-foreground">Not completed</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Started</p>
                    <p className="font-medium">
                      {format(new Date(verificationData.started_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p className="font-medium">
                      {format(new Date(verificationData.last_updated_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>

                {/* Admin Notes */}
                {verificationData.admin_notes && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Admin Notes</p>
                    <p className="text-sm text-muted-foreground">
                      {verificationData.admin_notes}
                    </p>
                  </div>
                )}

                {/* Rejection Reasons */}
                {verificationData.rejection_reasons && verificationData.rejection_reasons.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2 text-destructive">Rejection Reasons</p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                      {verificationData.rejection_reasons.map((reason, index) => (
                        <li key={index}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => navigate('/verification')}
                className="flex-1"
                variant={verificationData?.overall_status === 'requires_reverification' ? 'destructive' : 'default'}
              >
                {isVerified ? 'View Verification' : verificationData?.overall_status === 'requires_reverification' ? 'Re-verify Now' : 'Start Verification'}
              </Button>
            </div>

            {/* Info Message */}
            {verificationData?.overall_status === 'requires_reverification' && (
              <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  <strong>Action Required:</strong> MobiRides has updated the verification process. 
                  Please complete the new 3-step verification to continue using all features.
                </p>
              </div>
            )}

            {!verificationData && (
              <div className="text-center py-8">
                <ShieldCheck className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  You haven't started verification yet. Complete verification to unlock all features.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default VerificationSettingsPage;
