import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getAvailablePromoCodes, getUserPromoCodeHistory, PromoCode, PromoCodeUsage } from "@/services/promoCodeService";

interface UsePromoCodeHistoryReturn {
  availableCodes: PromoCode[];
  usedCodes: PromoCodeUsage[];
  totalSavings: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function usePromoCodeHistory(): UsePromoCodeHistoryReturn {
  const { user } = useAuth();
  const [availableCodes, setAvailableCodes] = useState<PromoCode[]>([]);
  const [usedCodes, setUsedCodes] = useState<PromoCodeUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [available, used] = await Promise.all([
        getAvailablePromoCodes(user.id),
        getUserPromoCodeHistory(user.id)
      ]);

      setAvailableCodes(available);
      setUsedCodes(used);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch promo history'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const totalSavings = usedCodes.reduce((sum, usage) => sum + usage.discount_applied, 0);

  return {
    availableCodes,
    usedCodes,
    totalSavings,
    isLoading,
    error,
    refetch: fetchData
  };
}
