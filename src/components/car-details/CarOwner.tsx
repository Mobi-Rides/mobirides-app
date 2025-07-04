import { Button } from "@/components/ui/button";
import { MessageCircle, User } from "lucide-react";
import { useState, useEffect } from "react";
import { ChatDrawer } from "@/components/chat/ChatDrawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { AuthModal } from "@/components/auth/AuthModal";
import { toast } from "sonner";
import { AuthTriggerService } from "@/services/authTriggerService";
import { SignUpRequiredModal } from "@/components/auth/SignUpRequiredModal";
import { useNavigate } from "react-router-dom";

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
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const navigate = useNavigate();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const handleContactHost = () => {
    if (!isAuthenticated) {
      sessionStorage.setItem(
        "postAuthIntent",
        JSON.stringify({
          action: "contact",
          carId: carId,
          ownerId: ownerId,
          page: window.location.pathname + window.location.search,
          timestamp: Date.now(),
        })
      );
      setShowSignUpModal(true);
      return;
    }
    setIsChatOpen(true);
  };

  const handleSignUpNow = () => {
    setShowSignUpModal(false);
    navigate("/signup");
  };

  const handleCancelSignUp = () => {
    setShowSignUpModal(false);
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
                  <Button className="gap-2" onClick={handleContactHost}>
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

      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        receiverId={ownerId}
        receiverName={ownerName}
        carId={carId}
      />
      
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab="signin"
      />

      <SignUpRequiredModal
        open={showSignUpModal}
        onSignUp={handleSignUpNow}
        onCancel={handleCancelSignUp}
      />
    </>
  );
};
