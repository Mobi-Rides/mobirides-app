
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CarOwnerProps {
  ownerName: string;
  avatarUrl: string;
  ownerId: string;
}

export const CarOwner = ({ ownerName, avatarUrl, ownerId }: CarOwnerProps) => {
  const navigate = useNavigate();

  const handleContactClick = () => {
    navigate("/messages", { state: { recipientId: ownerId, recipientName: ownerName } });
  };

  return (
    <>
      <Card className="dark:bg-gray-800 dark:border-gray-700 border-border shadow-sm overflow-hidden">
        <CardHeader className="pb-2 bg-muted/30">
          <CardTitle className="text-base text-left text-muted-foreground dark:text-white font-medium">
            Host
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={
                  avatarUrl
                    ? avatarUrl
                    : "/placeholder.svg"
                }
                alt={ownerName || "Car Owner"}
                className="w-8 h-8 rounded-full object-cover bg-muted"
              />
              <div className="flex flex-col gap-0.5 items-start">
                <p className="text-sm md:text-base text-gray-700 dark:text-white ">
                  {ownerName || "Car Owner"}
                </p>

                <p className="text-xs md:text-sm text-muted-foreground ">
                  Vehicle Host
                </p>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button className="gap-2" onClick={handleContactClick}>
                    <MessageCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Contact</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Message the vehicle owner</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
