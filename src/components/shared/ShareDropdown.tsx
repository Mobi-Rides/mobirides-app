import { useState } from "react";
import { FiShare2 } from "react-icons/fi";
import { FaFacebook, FaTwitter, FaWhatsapp } from "react-icons/fa";
import { MdContentCopy } from "react-icons/md";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareData {
  title: string;
  text: string;
  url: string;
}

interface ShareDropdownProps {
  shareData: ShareData;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
}

export const ShareDropdown = ({ 
  shareData, 
  variant = "outline", 
  size = "icon", 
  showLabel = false 
}: ShareDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setIsOpen(false);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareData.url);
      toast.success("Link copied to clipboard!");
      setIsOpen(false);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error("Failed to copy link");
    }
  };

  const handleSocialShare = (platform: 'facebook' | 'twitter' | 'whatsapp') => {
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${shareData.text} ${shareData.url}`)}`;
        break;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className="rounded-2xl md:size-auto md:px-4 md:py-2 md:flex md:items-center md:gap-2"
        >
          <FiShare2 className="h-4 w-4 text-primary dark:text-white" />
          {showLabel && (
            <span className="hidden md:inline-block">
              <p className="text-primary dark:text-white text-xs md:text-sm lg:text-base font-semibold">
                Share
              </p>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {navigator.share && (
          <DropdownMenuItem onClick={handleNativeShare} className="flex items-center gap-2">
            <FiShare2 className="h-4 w-4" />
            Share
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleCopyLink} className="flex items-center gap-2">
          <MdContentCopy className="h-4 w-4" />
          Copy Link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSocialShare('facebook')} className="flex items-center gap-2">
          <FaFacebook className="h-4 w-4 text-blue-600" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSocialShare('twitter')} className="flex items-center gap-2">
          <FaTwitter className="h-4 w-4 text-blue-400" />
          Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSocialShare('whatsapp')} className="flex items-center gap-2">
          <FaWhatsapp className="h-4 w-4 text-green-500" />
          WhatsApp
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};