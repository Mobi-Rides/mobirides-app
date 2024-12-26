import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { LOCATION_SETTINGS } from '@/utils/locationConstants';

export const useLocationAccuracy = () => {
  const [bestAccuracy, setBestAccuracy] = useState<number | null>(null);

  const updateAccuracy = useCallback((accuracy: number) => {
    setBestAccuracy(prev => {
      if (!prev || accuracy < prev) {
        console.log("New best accuracy achieved:", accuracy, "meters");
        return accuracy;
      }
      return prev;
    });

    // Provide feedback about location accuracy
    const { HIGH, GOOD } = LOCATION_SETTINGS.ACCURACY_THRESHOLDS;
    if (accuracy <= GOOD) {
      if (accuracy <= HIGH) {
        toast.success(`High accuracy location obtained (${Math.round(accuracy)}m)`);
      } else {
        toast.success(`Good accuracy location obtained (${Math.round(accuracy)}m)`);
      }
    } else {
      toast.warning(`Still improving accuracy... Current: ${Math.round(accuracy)}m`);
    }
  }, []);

  return { bestAccuracy, updateAccuracy };
};