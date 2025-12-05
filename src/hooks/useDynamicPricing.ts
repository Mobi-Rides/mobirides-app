import { useEffect, useMemo, useState } from "react";
import { DynamicPricingService } from "@/services/dynamicPricingService";
import { PricingCalculation } from "@/types/pricing";

export const useDynamicPricing = (
  carId: string | undefined,
  basePrice: number | undefined,
  startDate: Date | undefined,
  endDate: Date | undefined,
  pickupLatitude?: number,
  pickupLongitude?: number,
  userId?: string,
) => {
  const [calculation, setCalculation] = useState<PricingCalculation | null>(null);
  const [loading, setLoading] = useState(false);

  const canCalculate = useMemo(() => {
    return !!carId && !!basePrice && !!startDate && !!endDate;
  }, [carId, basePrice, startDate, endDate]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!canCalculate || !carId || !basePrice || !startDate || !endDate) return;
      setLoading(true);
      const result = await DynamicPricingService.calculateBookingPrice(
        carId,
        basePrice,
        startDate,
        endDate,
        pickupLatitude,
        pickupLongitude,
        userId,
      );
      if (active) setCalculation(result);
      setLoading(false);
    };
    const timeout = setTimeout(run, 250);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [canCalculate, carId, basePrice, startDate, endDate, pickupLatitude, pickupLongitude, userId]);

  const finalPrice = useMemo(() => {
    return calculation?.final_price ?? basePrice ?? 0;
  }, [calculation?.final_price, basePrice]);

  return { calculation, finalPrice, loading };
};

