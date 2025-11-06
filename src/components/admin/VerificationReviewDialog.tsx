import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { VerificationData } from "@/types/verification";

interface AdminVerificationData extends Pick<VerificationData,
  'id' | 'user_id' | 'overall_status' | 'current_step' | 'personal_info_completed' |
  'documents_completed' | 'selfie_completed' | 'phone_verified' | 'address_confirmed'
> {
  started_at: string | null;
  profiles?: {
    full_name: string;
    role: string;
  };
}

interface VerificationDocumentRow {
  id: string;
  user_id: string;
  document_type: string;
  file_path: string;
  file_name: string;
  file_size: number;
  document_number?: string | null;
  expiry_date?: string | null;
  status: string;
  rejection_reason?: string | null;
  uploaded_at: string;
}

interface VerificationReviewDialogProps {
  verification: AdminVerificationData | null;
  isOpen: boolean;
  onClose: () => void;
}

const isImageFile = (fileName: string) => {
  const lower = fileName.toLowerCase();
  return lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png") || lower.endsWith(".webp");
};

export const VerificationReviewDialog: React.FC<VerificationReviewDialogProps> = ({ verification, isOpen, onClose }) => {
  const [docs, setDocs] = useState<VerificationDocumentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const userId = verification?.user_id;

  useEffect(() => {
    const fetchDocs = async () => {
      if (!isOpen || !userId) return;
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("verification_documents")
          .select("id, user_id, document_type, file_path, file_name, file_size, document_number, expiry_date, status, rejection_reason, uploaded_at")
          .eq("user_id", userId);

        if (error) throw error;
        let rows = (data || []) as VerificationDocumentRow[];

        // If no rows but user reported uploads, try backfill from storage
        if (rows.length === 0) {
          try {
            const changed = await (await import("@/services/verificationService")).VerificationService.syncDocumentsFromStorageForUser(userId);
            if (changed > 0) {
              const { data: after, error: afterErr } = await supabase
                .from("verification_documents")
                .select("id, user_id, document_type, file_path, file_name, file_size, document_number, expiry_date, status, rejection_reason, uploaded_at")
                .eq("user_id", userId);
              if (!afterErr) {
                rows = (after || []) as VerificationDocumentRow[];
              }
            }
          } catch (syncErr) {
            console.warn("[VerificationReviewDialog] Backfill sync failed:", syncErr);
          }
        }
        setDocs(rows);

        // Create signed URLs for previews; choose bucket per document type
        const urlPairs: Array<[string, string]> = [];
        for (const row of rows) {
          const bucket = row.document_type === "selfie_photo" ? "verification-selfies" : "verification-documents";
          const { data: signed, error: signedErr } = await supabase.storage
            .from(bucket)
            .createSignedUrl(row.file_path, 300);
          if (!signedErr && signed?.signedUrl) {
            urlPairs.push([row.id, signed.signedUrl]);
          }
        }
        const urlMap = Object.fromEntries(urlPairs);
        setSignedUrls(urlMap);
      } catch (e: any) {
        console.error("[VerificationReviewDialog] Failed to fetch documents:", e);
        setError("Failed to load documents for review");
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, [isOpen, userId]);

  const headerTitle = useMemo(() => {
    const name = verification?.profiles?.full_name || "Unknown User";
    return `Review Verification — ${name}`;
  }, [verification?.profiles?.full_name]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {headerTitle}
          </DialogTitle>
        </DialogHeader>

        {!verification ? (
          <div className="text-muted-foreground">No verification selected.</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">Status</div>
                <Badge variant="outline" className="mt-1 capitalize">{verification.overall_status.replace("_", " ")}</Badge>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">Current Step</div>
                <div className="mt-1 capitalize">{verification.current_step.replace("_", " ")}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">Started</div>
                <div className="mt-1">{verification.started_at ? new Date(verification.started_at).toLocaleString() : "—"}</div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Uploaded Documents</h3>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, idx) => (
                    <div key={idx} className="space-y-2">
                      <Skeleton className="h-40 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-destructive">{error}</div>
              ) : docs.length === 0 ? (
                <div className="text-muted-foreground">No documents uploaded.</div>
              ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {docs.map((doc) => {
                    const previewUrl = signedUrls[doc.id];
                    const isImage = isImageFile(doc.file_name);
                    return (
                      <div key={doc.id} className="border rounded-lg overflow-hidden">
                        <div className="p-3 border-b">
                          <div className="flex items-center justify-between">
                            <div className="font-medium capitalize">{doc.document_type.replace(/_/g, " ")}</div>
                            <Badge variant="outline" className="capitalize">{doc.status.replace("_", " ")}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">{doc.file_name}</div>
                        </div>
                        <div className="p-3">
                          {previewUrl ? (
                            isImage ? (
                              <img src={previewUrl} alt={doc.file_name} className="w-full h-40 object-cover rounded" />
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="text-sm">PDF document</div>
                                <Button asChild variant="outline" size="sm">
                                  <a href={previewUrl} target="_blank" rel="noreferrer">Open</a>
                                </Button>
                              </div>
                            )
                          ) : (
                            <div className="text-sm text-muted-foreground">No preview available</div>
                          )}
                          <div className="mt-2 flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                              Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                            </div>
                            {previewUrl && (
                              <Button asChild variant="ghost" size="sm">
                                <a href={previewUrl} target="_blank" rel="noreferrer">View</a>
                              </Button>
                            )}
                          </div>
                          {doc.rejection_reason && (
                            <div className="mt-2 text-xs text-destructive">Reason: {doc.rejection_reason}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Admin Actions */}
            <AdminActions
              verificationId={verification.id}
              overallStatus={verification.overall_status as Database["public"]["Enums"]["verification_status"]}
              userId={verification.user_id}
              onClose={onClose}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Admin approve/reject actions embedded in the dialog
const AdminActions = ({
  verificationId,
  overallStatus,
  userId,
  onClose,
}: {
  verificationId: string;
  overallStatus: Database["public"]["Enums"]["verification_status"];
  userId: string;
  onClose: () => void;
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const updateVerificationStatus = async (
    newStatus: Database["public"]["Enums"]["verification_status"],
    reason?: string
  ) => {
    try {
      setIsSubmitting(true);
      const payload: any = {
        overall_status: newStatus,
        completed_at: newStatus === "completed" ? new Date().toISOString() : null,
      };
      if (newStatus === "rejected" && reason) {
        payload.rejection_reasons = [reason];
        payload.admin_notes = reason;
      }

      const { error } = await supabase
        .from("user_verifications")
        .update(payload)
        .eq("id", verificationId);

      if (error) throw error;
      // After successful status update, create system notification for the verification user
      try {
        const title = newStatus === "completed" ? "Verification Approved" : "Verification Rejected";
        const description = newStatus === "completed"
          ? "Your identity verification has been approved."
          : `Your identity verification was rejected${reason ? `: ${reason}` : "."}`;
        const metadata = {
          source: "verification_admin_action",
          verification_id: verificationId,
          status: newStatus,
          ...(newStatus === "rejected" && reason ? { rejection_reason: reason } : {}),
        };

        const { error: notifyError } = await supabase.rpc("create_system_notification", {
          p_user_id: userId,
          p_title: title,
          p_description: description,
          p_metadata: metadata,
        });
        if (notifyError) {
          console.warn("[VerificationReviewDialog] Failed to create system notification:", notifyError);
        }
      } catch (notifyErr) {
        console.warn("[VerificationReviewDialog] Notification RPC error:", notifyErr);
      }
      toast.success(`Verification ${newStatus} successfully`);
      onClose();
    } catch (err) {
      console.error("[VerificationReviewDialog] Error updating verification:", err);
      toast.error("Failed to update verification");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Allow actions when verification is awaiting admin decision
  const canAct = overallStatus === "pending_review";
  if (!canAct) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 border-t pt-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={isSubmitting}
          onClick={() => updateVerificationStatus("completed")}
        >
          Approve
        </Button>
        {!showReject ? (
          <Button
            variant="destructive"
            size="sm"
            disabled={isSubmitting}
            onClick={() => setShowReject(true)}
          >
            Reject
          </Button>
        ) : null}
      </div>

      {showReject && (
        <div className="space-y-2">
          <Textarea
            placeholder="Provide rejection reason for audit trail"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
          />
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              disabled={isSubmitting || !rejectionReason.trim()}
              onClick={() => updateVerificationStatus("rejected", rejectionReason.trim())}
            >
              Confirm Reject
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => {
                setShowReject(false);
                setRejectionReason("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};