import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { PromoCode, PromoCodeUsage } from "@/services/promoCodeService";
import { useNavigate } from "react-router-dom";

interface PromoCodeCardProps {
  promoCode: PromoCode;
  usage?: PromoCodeUsage;
  status: 'available' | 'used' | 'expired';
}

export const PromoCodeCard = ({ promoCode, usage, status }: PromoCodeCardProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showTerms, setShowTerms] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(promoCode.code);
    toast({
      title: "Code copied!",
      description: "Promo code copied to clipboard",
    });
  };

  const getStatusColor = () => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'used': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'available': return <Clock className="w-4 h-4 mr-1" />;
      case 'used': return <CheckCircle className="w-4 h-4 mr-1" />;
      case 'expired': return <XCircle className="w-4 h-4 mr-1" />;
    }
  };

  return (
    <Card className={`border ${status === 'available' ? 'border-primary/20 shadow-sm' : 'border-border/50'}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-mono font-bold text-lg tracking-wide">{promoCode.code}</h3>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-sm font-medium text-primary">
              {promoCode.discount_type === 'fixed' 
                ? `P${promoCode.discount_amount} OFF` 
                : `${promoCode.discount_amount}% OFF`}
            </p>
          </div>
          <Badge variant="outline" className={`${getStatusColor()} flex items-center`}>
            {getStatusIcon()}
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          {promoCode.description}
        </p>

        <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3 mt-3">
          {status === 'used' && usage ? (
            <span>Used on {format(new Date(usage.used_at), 'MMM d, yyyy')}</span>
          ) : (
            <span>Valid until {promoCode.valid_until ? format(new Date(promoCode.valid_until), 'MMM d, yyyy') : 'Forever'}</span>
          )}
          
          {status === 'available' && (
             <Button size="sm" onClick={() => navigate('/')} className="h-7 text-xs">
               Use Now
             </Button>
          )}
        </div>

        {promoCode.terms_conditions && (
          <div className="mt-2">
            <button 
              onClick={() => setShowTerms(!showTerms)}
              className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showTerms ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
              Terms & Conditions
            </button>
            {showTerms && (
              <p className="text-xs text-muted-foreground mt-1 p-2 bg-muted rounded-md">
                {promoCode.terms_conditions}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
