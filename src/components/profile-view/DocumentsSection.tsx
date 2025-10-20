import { FileText, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DocumentItem } from "./DocumentItem";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface DocumentsSectionProps {
  userId: string;
}

export const DocumentsSection = ({ userId }: DocumentsSectionProps) => {
  const navigate = useNavigate();
  
  const { data: documents, isLoading, refetch } = useQuery({
    queryKey: ['documents', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <Card className="shadow-sm">
      <CardHeader className="bg-muted/30 pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading documents...</p>
        ) : documents && documents.length > 0 ? (
          <>
            {documents.map((doc) => (
              <DocumentItem key={doc.id} document={doc} onUpdate={refetch} />
            ))}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-4"
              onClick={() => navigate('/verification')}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload New Document
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-4"
              onClick={() => navigate('/verification')}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
