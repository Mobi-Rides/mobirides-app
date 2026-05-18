import React from 'react';
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Wallet, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";

export type PaymentMethodType = 'card' | 'orange_money' | 'myzaka' | 'smega' | 'eft';

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
      <Label className="text-base font-semibold">Select Payment Method</Label>
      <RadioGroup
        value={selectedMethod}
        onValueChange={(value) => onSelect(value as PaymentMethodType)}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Card
          className={cn(
            "relative p-4 cursor-pointer transition-all hover:border-primary hover:shadow-md",
            selectedMethod === 'card' ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
          )}
          onClick={() => onSelect('card')}
        >
          <div className="flex items-center gap-3">
            <RadioGroupItem value="card" id="card" className="sr-only" />
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <Label htmlFor="card" className="font-semibold cursor-pointer text-sm">Card Payment</Label>
              <p className="text-xs text-muted-foreground">Visa, Mastercard</p>
            </div>
          </div>
        </Card>

        <Card
          className={cn(
            "relative p-4 cursor-pointer transition-all hover:border-primary hover:shadow-md",
            selectedMethod === 'orange_money' ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
          )}
          onClick={() => onSelect('orange_money')}
        >
          <div className="flex items-center gap-3">
            <RadioGroupItem value="orange_money" id="orange_money" className="sr-only" />
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <Label htmlFor="orange_money" className="font-semibold cursor-pointer text-sm">Orange Money</Label>
              <p className="text-xs text-muted-foreground">Mobile Money</p>
            </div>
          </div>
        </Card>

        <Card
          className={cn(
            "relative p-4 cursor-pointer transition-all hover:border-primary hover:shadow-md",
            selectedMethod === 'eft' ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
          )}
          onClick={() => onSelect('eft')}
        >
          <div className="flex items-center gap-3">
            <RadioGroupItem value="eft" id="eft" className="sr-only" />
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <Label htmlFor="eft" className="font-semibold cursor-pointer text-sm">Bank Transfer (EFT)</Label>
              <p className="text-xs text-muted-foreground">Proof of Payment required</p>
            </div>
          </div>
        </Card>
      </RadioGroup>
    </div>
  );
};
