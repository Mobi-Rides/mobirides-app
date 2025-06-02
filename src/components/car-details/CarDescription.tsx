
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
        <CardTitle className="text-base text-left text-muted-foreground dark:text-white font-medium">
          Description
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed text-left">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};
