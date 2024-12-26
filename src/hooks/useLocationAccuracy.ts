import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { LOCATION_SETTINGS } from '@/utils/locationConstants';
import { X } from 'lucide-react';

export const useLocationAccuracy = () => {
  const [bestAccuracy, setBestAccuracy] = useState<number | null>(null);
  const [toastId, setToastId] = useState<string | number | null>(null);
  const [isToastDismissed, setIsToastDismissed] = useState(false);

  const updateAccuracy = useCallback((accuracy: number) => {
    setBestAccuracy(prev => {
      if (!prev || accuracy < prev) {
        console.log("New best accuracy achieved:", accuracy, "meters");
        return accuracy;
      }
      return prev;
    });

    // Only show toast if it hasn't been manually dismissed
    if (!isToastDismissed) {
      const message = `Location accuracy: ${Math.round(accuracy)}m`;
      const { HIGH, GOOD } = LOCATION_SETTINGS.ACCURACY_THRESHOLDS;
      
      if (!toastId) {
        // Create initial toast with close button
        const id = toast.info(message, {
          duration: Infinity,
          dismissible: true,
          closeButton: true,
          icon: null,
          className: 'group relative',
          classNames: {
            closeButton: 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-150 opacity-0 transition-opacity duration-200 p-2 group-hover:opacity-100'
          },
          onDismiss: () => {
            console.log("Toast manually dismissed by user");
            setIsToastDismissed(true);
            setToastId(null);
          }
        });
        setToastId(id);
      } else {
        // Update existing toast
        toast.message(message, {
          id: toastId,
          duration: Infinity,
          dismissible: true,
          closeButton: true,
          icon: null,
          className: 'group relative',
          classNames: {
            closeButton: 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-150 opacity-0 transition-opacity duration-200 p-2 group-hover:opacity-100'
          },
          onDismiss: () => {
            console.log("Toast manually dismissed by user");
            setIsToastDismissed(true);
            setToastId(null);
          }
        });
      }
    }
  }, [toastId, isToastDismissed]);

  return { bestAccuracy, updateAccuracy };
};