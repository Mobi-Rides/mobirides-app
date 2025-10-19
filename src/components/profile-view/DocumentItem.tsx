import { FileText, CheckCircle2, Clock, XCircle, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface DocumentItemProps {
  document: {
    id: string;
    document_type: string;
    status: 'pending' | 'verified' | 'rejected';
    uploaded_at: string;
    rejection_reason?: string | null;
  };
  onUpdate: () => void;
}

export const DocumentItem = ({ document, onUpdate }: DocumentItemProps) => {
  const navigate = useNavigate();
  const getStatusBadge = () => {
    switch (document.status) {
      case 'verified':
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
    }
  };

  const formatDocumentType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
      <div className="flex items-start gap-3 flex-1">
        <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">
              {formatDocumentType(document.document_type)}
            </p>
            {getStatusBadge()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Uploaded {format(new Date(document.uploaded_at), 'MMM dd, yyyy')}
          </p>
          {document.status === 'rejected' && document.rejection_reason && (
            <p className="text-xs text-destructive mt-1">
              {document.rejection_reason}
            </p>
          )}
        </div>
      </div>
      
      {document.status === 'rejected' && (
        <Button 
          size="sm" 
          variant="outline" 
          className="ml-2"
          onClick={() => navigate('/verification')}
        >
          <Upload className="w-3 h-3 mr-1" />
          Re-upload
        </Button>
      )}
    </div>
  );
};
