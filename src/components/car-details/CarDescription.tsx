
import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CarDescriptionProps {
  description: string | null;
}

export const CarDescription = ({ description }: CarDescriptionProps) => {
  if (!description) return null;
  
  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700 border-border shadow-sm overflow-hidden">
      <CardHeader className="pb-2 bg-muted/30">
        <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
          <FileText className="h-5 w-5 text-primary dark:text-primary-foreground" />
          Description
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <p className="text-muted-foreground dark:text-gray-300 leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
};
