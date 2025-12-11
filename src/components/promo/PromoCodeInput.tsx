import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { validatePromoCode, calculateDiscount, PromoCode } from "@/services/promoCodeService";
import { useToast } from "@/hooks/use-toast";

interface PromoCodeInputProps {
  userId: string | null;
  bookingAmount: number;
  onApply: (promo: PromoCode) => void;
  onRemove?: () => void;
  appliedPromo?: PromoCode | null;
  className?: string;
  disabled?: boolean;
}

export const PromoCodeInput = ({
  userId,
  bookingAmount,
  onApply,
  onRemove,
  appliedPromo,
  className,
  disabled = false
}: PromoCodeInputProps) => {
  const [inputCode, setInputCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleApply = async () => {
    if (!inputCode.trim() || !userId) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const validation = await validatePromoCode(inputCode, userId, bookingAmount);
      
      if (validation.valid && validation.promoCode) {
        onApply(validation.promoCode);
        toast({ 
          title: "Promo code applied!", 
          description: `You saved P${calculateDiscount(validation.promoCode, bookingAmount)}` 
        });
        setInputCode(""); // Clear input on success
      } else {
        setError(validation.error || "Invalid promo code");
      }
    } catch (err) {
      setError("Failed to validate code");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
      setInputCode("");
      setError(null);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex gap-2">
        <Input 
          placeholder="Promo Code (e.g. FIRST100)" 
          value={inputCode} 
          onChange={(e) => {
            setInputCode(e.target.value.toUpperCase());
            if (error) setError(null);
          }}
          disabled={!!appliedPromo || isLoading || disabled}
          className="h-9 text-sm"
        />
        <Button 
          onClick={handleApply} 
          disabled={!!appliedPromo || isLoading || !inputCode.trim() || disabled}
          size="sm"
          variant={appliedPromo ? "secondary" : "default"}
          className="h-9"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : appliedPromo ? (
            "Applied"
          ) : (
            "Apply"
          )}
        </Button>
      </div>
      
      {error && <p className="text-destructive text-xs">{error}</p>}
      
      {appliedPromo && (
        <div className="flex justify-between items-center text-green-600 font-medium text-sm bg-green-50 p-2 rounded-md border border-green-100">
          <div className="flex flex-col">
            <span>Promo applied ({appliedPromo.code})</span>
            <span className="text-xs opacity-90">- P{calculateDiscount(appliedPromo, bookingAmount)} off</span>
          </div>
          {onRemove && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRemove}
              className="h-6 px-2 text-green-700 hover:text-green-800 hover:bg-green-100"
            >
              Remove
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
