import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { InsuranceService } from '@/services/insuranceService';

interface ClaimResponseDialogProps {
    claimId: string;
    claimNumber: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const ClaimResponseDialog: React.FC<ClaimResponseDialogProps> = ({
    claimId,
    claimNumber,
    isOpen,
    onClose,
    onSuccess
}) => {
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim()) {
            toast.error('Please enter a response comment');
            return;
        }

        setIsSubmitting(true);
        setUploading(true);

        try {
            const fileUrls: string[] = [];

            // Upload files if any
            if (files.length > 0) {
                for (const file of files) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${claimId}/${Math.random().toString(36).substring(7)}.${fileExt}`;
                    const filePath = `${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('insurance-claims')
                        .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    fileUrls.push(filePath);
                }
            }

            await InsuranceService.addClaimResponse(claimId, comment, fileUrls);

            toast.success('Response submitted successfully');
            setComment('');
            setFiles([]);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to submit response:', error);
            toast.error('Failed to submit response. Please try again.');
        } finally {
            setIsSubmitting(false);
            setUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Respond to Request</DialogTitle>
                    <DialogDescription>
                        Provide the additional information requested for claim #{claimNumber}.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="comment">Your Response</Label>
                        <Textarea
                            id="comment"
                            placeholder="Enter your response here..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="files">Additional Documents (Optional)</Label>
                        <div className="flex items-center gap-2">
                            <input
                                type="file"
                                id="files"
                                multiple
                                className="hidden"
                                onChange={handleFileChange}
                                accept="image/*,.pdf"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById('files')?.click()}
                                className="w-full"
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                {files.length > 0 ? `${files.length} file(s) selected` : 'Select Files'}
                            </Button>
                        </div>
                        {files.length > 0 && (
                            <ul className="text-sm text-gray-500 list-disc pl-4">
                                {files.map((f, i) => (
                                    <li key={i}>{f.name}</li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || uploading}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting
                                </>
                            ) : (
                                'Submit Response'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
