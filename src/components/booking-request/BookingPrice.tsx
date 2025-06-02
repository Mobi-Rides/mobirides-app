
import { CreditCard } from "lucide-react";

interface BookingPriceProps {
  totalPrice: number;
}

export const BookingPrice = ({ totalPrice }: BookingPriceProps) => {
  return (
    <div className="bg-card rounded-lg p-4 border">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <span className="p-1.5 rounded-full bg-primary/10 dark:bg-primary/20 mr-2">
            <CreditCard className="h-4 w-4 text-primary" />
          </span>
          <p className="font-semibold">Total Price</p>
        </div>
        <p className="text-xl font-bold">BWP {totalPrice}</p>
      </div>
    </div>
  );
};
