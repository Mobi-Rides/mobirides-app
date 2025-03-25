
import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CarDescriptionProps {
  description: string | null;
}

export const CarDescription = ({ description }: CarDescriptionProps) => {
  if (!description) return null;
  
  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
          <FileText className="h-5 w-5 text-primary dark:text-primary-foreground" />
          Description
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground dark:text-gray-300">{description}</p>
      </CardContent>
    </Card>
  );
};
