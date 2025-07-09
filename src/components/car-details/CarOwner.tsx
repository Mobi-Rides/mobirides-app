
import { Button } from "@/components/ui/button";
import { MessageCircle, User } from "lucide-react";
import { useState, useEffect } from "react";
import { ChatDrawer } from "@/components/chat/ChatDrawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { AuthContextModal } from "@/components/auth/AuthContextModal";
import AuthTriggerService from "@/services/authTriggerService";

interface CarOwnerProps {
  ownerName: string;
  avatarUrl: string;
  ownerId: string;
  carId: string;
}

export const CarOwner = ({ ownerName, avatarUrl, ownerId, carId }: CarOwnerProps) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    };
    
    checkAuth();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // Listen for pending action execution events
  useEffect(() => {
    const handleExecuteContactHost = (event: CustomEvent) => {
      if (event.detail.carId === carId && isAuthenticated) {
        setIsChatOpen(true);
      }
    };

    window.addEventListener('execute-contact-host', handleExecuteContactHost as EventListener);

    return () => {
      window.removeEventListener('execute-contact-host', handleExecuteContactHost as EventListener);
    };
  }, [carId, isAuthenticated]);

  const handleContactClick = () => {
    if (!isAuthenticated) {
      AuthTriggerService.storePendingAction({
        type: 'contact_host',
        payload: { carId },
        context: ownerName
      });
      
      setIsAuthModalOpen(true);
      return;
    }
    
    setIsChatOpen(true);
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
                    ? supabase.storage.from("avatars").getPublicUrl(avatarUrl)
                        .data.publicUrl
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

      {isAuthenticated && (
        <ChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          receiverId={ownerId}
          receiverName={ownerName}
          carId={carId}
        />
      )}

      <AuthContextModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        context={{
          action: 'contact_host',
          title: `Sign up to contact ${ownerName}`,
          description: 'Create an account to message the host and ask questions about the car.'
        }}
        defaultTab="signup"
      />
    </>
  );
};
