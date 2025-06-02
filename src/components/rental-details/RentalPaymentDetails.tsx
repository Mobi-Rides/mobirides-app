
import { CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface RentalPaymentDetailsProps {
  pricePerDay: number;
  durationDays: number;
  totalPrice: number;
}

export const RentalPaymentDetails = ({ pricePerDay, durationDays, totalPrice }: RentalPaymentDetailsProps) => {
  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
          <CreditCard className="h-5 w-5 text-primary dark:text-primary-foreground" />
          Payment Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between">
          <p>Daily Rate</p>
          <p>BWP {pricePerDay}</p>
        </div>
        <div className="flex justify-between">
          <p>Duration</p>
          <p>
            {durationDays} day{durationDays !== 1 ? "s" : ""}
          </p>
        </div>
        <Separator />
        <div className="flex justify-between font-bold">
          <p>Total</p>
          <p>BWP {totalPrice}</p>
        </div>
      </CardContent>
    </Card>
  );
};
