import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { LOCATION_SETTINGS } from '@/utils/locationConstants';

export const useLocationAccuracy = () => {
  const [bestAccuracy, setBestAccuracy] = useState<number | null>(null);
  const [toastId, setToastId] = useState<string | number | null>(null);

  const updateAccuracy = useCallback((accuracy: number) => {
    setBestAccuracy(prev => {
      if (!prev || accuracy < prev) {
        console.log("New best accuracy achieved:", accuracy, "meters");
        return accuracy;
      }
      return prev;
    });

    // Update or create accuracy toast
    const message = `Location accuracy: ${Math.round(accuracy)}m`;
    const { HIGH, GOOD } = LOCATION_SETTINGS.ACCURACY_THRESHOLDS;
    
    if (!toastId) {
      // Create initial toast
      const id = toast.info(message, {
        duration: Infinity,
      });
      setToastId(id);
    } else {
      // Update existing toast
      toast.message(message, {
        id: toastId,
        duration: Infinity,
      });
    }
  }, [toastId]);

  return { bestAccuracy, updateAccuracy };
};