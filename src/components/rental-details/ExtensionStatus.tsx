import React, { useState, useEffect, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { Clock, CheckCircle, XCircle, AlertCircle, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RentalExtensionService } from "@/services/rentalExtensionService";
import { RentalExtensionRequest, ExtensionStatus } from "@/types/extension";

interface ExtensionStatusProps {
  bookingId: string;
  isRenter: boolean;
  onExtensionUpdate?: () => void;
}

export const ExtensionStatusCard = ({ 
  bookingId, 
  isRenter, 
  onExtensionUpdate 
}: ExtensionStatusProps) => {
  const [extensions, setExtensions] = useState<RentalExtensionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadExtensions = useCallback(async () => {
    setIsLoading(true);
    try {
      const extensionList = await RentalExtensionService.getBookingExtensions(bookingId);
      setExtensions(extensionList);
    } catch (error) {
      console.error("Error loading extensions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadExtensions();
  }, [bookingId, loadExtensions]);

  const handleCancelExtension = async (extensionId: string) => {
    setCancellingId(extensionId);
    try {
      const success = await RentalExtensionService.cancelExtensionRequest(extensionId);
      if (success) {
        await loadExtensions();
        onExtensionUpdate?.();
      }
    } catch (error) {
      console.error("Error cancelling extension:", error);
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusIcon = (status: ExtensionStatus) => {
    switch (status) {
      case ExtensionStatus.PENDING:
        return <Clock className="h-4 w-4" />;
      case ExtensionStatus.APPROVED:
        return <CheckCircle className="h-4 w-4" />;
      case ExtensionStatus.REJECTED:
        return <XCircle className="h-4 w-4" />;
      case ExtensionStatus.CANCELLED:
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: ExtensionStatus) => {
    switch (status) {
      case ExtensionStatus.PENDING:
        return "secondary" as const;
      case ExtensionStatus.APPROVED:
        return "default" as const;
      case ExtensionStatus.REJECTED:
        return "destructive" as const;
      case ExtensionStatus.CANCELLED:
        return "outline" as const;
      default:
        return "secondary" as const;
    }
  };

  const getStatusLabel = (status: ExtensionStatus) => {
    switch (status) {
      case ExtensionStatus.PENDING:
        return "Pending Approval";
      case ExtensionStatus.APPROVED:
        return "Approved";
      case ExtensionStatus.REJECTED:
        return "Rejected";
      case ExtensionStatus.CANCELLED:
        return "Cancelled";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Extension Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (extensions.length === 0) {
    return null; // Don't show anything if no extensions
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Extension Requests
        </CardTitle>
        <CardDescription>
          {extensions.length === 1 
            ? "1 extension request" 
            : `${extensions.length} extension requests`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {extensions.map((extension) => (
          <div
            key={extension.id}
            className="border rounded-lg p-4 space-y-3"
          >
            {/* Status Header */}
            <div className="flex items-center justify-between">
              <Badge variant={getStatusVariant(extension.status)} className="flex items-center gap-1">
                {getStatusIcon(extension.status)}
                {getStatusLabel(extension.status)}
              </Badge>
              <span className="text-sm text-gray-500">
                {format(parseISO(extension.requested_at), "MMM dd, yyyy")}
              </span>
            </div>

            {/* Extension Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Current End:</span>
                <p className="font-medium">
                  {format(parseISO(extension.current_end_date), "PPP")}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Requested End:</span>
                <p className="font-medium">
                  {format(parseISO(extension.requested_end_date), "PPP")}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Additional Days:</span>
                <p className="font-medium">{extension.additional_days} days</p>
              </div>
              <div>
                <span className="text-gray-600">Additional Cost:</span>
                <p className="font-medium">P{extension.additional_cost.toFixed(2)}</p>
              </div>
            </div>

            {/* Reason */}
            {extension.reason && (
              <div>
                <span className="text-sm text-gray-600">Reason:</span>
                <p className="text-sm bg-gray-50 p-2 rounded mt-1">
                  {extension.reason}
                </p>
              </div>
            )}

            {/* Rejection Reason */}
            {extension.status === ExtensionStatus.REJECTED && extension.rejected_reason && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Rejection Reason:</strong> {extension.rejected_reason}
                </AlertDescription>
              </Alert>
            )}

            {/* Approval Info */}
            {extension.status === ExtensionStatus.APPROVED && extension.approved_at && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Approved on {format(parseISO(extension.approved_at), "PPP")}. 
                  Your rental period has been extended successfully.
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            {isRenter && extension.status === ExtensionStatus.PENDING && (
              <div className="flex justify-end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-2"
                      disabled={cancellingId === extension.id}
                    >
                      {cancellingId === extension.id ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-3 w-3" />
                          Cancel Request
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Extension Request</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel this extension request? 
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Request</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleCancelExtension(extension.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Cancel Request
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}; 