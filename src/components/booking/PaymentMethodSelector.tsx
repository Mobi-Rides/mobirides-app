import React from 'react';
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export type PaymentMethodType = 'card' | 'orange_money' | 'myzaka' | 'smega';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethodType;
  onSelect: (method: PaymentMethodType) => void;
  className?: string;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onSelect,
  className
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      <Label className="text-base">Select Payment Method</Label>
      <RadioGroup
        value={selectedMethod}
        onValueChange={(value) => onSelect(value as PaymentMethodType)}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <Card
          className={cn(
            "relative p-4 cursor-pointer transition-all hover:border-primary",
            selectedMethod === 'card' ? "border-primary bg-primary/5" : "border-border"
          )}
          onClick={() => onSelect('card')}
        >
          <div className="flex items-center gap-3">
            <RadioGroupItem value="card" id="card" className="sr-only" />
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <Label htmlFor="card" className="font-medium cursor-pointer">Card Payment</Label>
              <p className="text-xs text-muted-foreground">Visa, Mastercard</p>
            </div>
          </div>
        </Card>

        <Card
          className={cn(
            "relative p-4 cursor-pointer transition-all hover:border-primary",
            selectedMethod === 'orange_money' ? "border-primary bg-primary/5" : "border-border"
          )}
          onClick={() => onSelect('orange_money')}
        >
          <div className="flex items-center gap-3">
            <RadioGroupItem value="orange_money" id="orange_money" className="sr-only" />
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <Label htmlFor="orange_money" className="font-medium cursor-pointer">Orange Money</Label>
              <p className="text-xs text-muted-foreground">Mobile Money</p>
            </div>
          </div>
        </Card>
      </RadioGroup>
    </div>
  );
};
