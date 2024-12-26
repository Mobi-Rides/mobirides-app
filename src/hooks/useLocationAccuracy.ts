import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { LOCATION_SETTINGS } from '@/utils/locationConstants';
import { X } from 'lucide-react';

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
      // Create initial toast with close button
      const id = toast.info(message, {
        duration: Infinity,
        dismissible: true,
        closeButton: true,
        icon: null,
        style: {
          position: 'relative',
          paddingRight: '32px', // Make room for the close button
        },
        className: 'group',
        closeButtonStyle: {
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0,
          transition: 'opacity 0.2s',
          padding: '8px',
          scale: '1.5',
        },
        classNames: {
          closeButton: 'group-hover:opacity-100'
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
        style: {
          position: 'relative',
          paddingRight: '32px', // Make room for the close button
        },
        className: 'group',
        closeButtonStyle: {
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0,
          transition: 'opacity 0.2s',
          padding: '8px',
          scale: '1.5',
        },
        classNames: {
          closeButton: 'group-hover:opacity-100'
        }
      });
    }
  }, [toastId]);

  return { bestAccuracy, updateAccuracy };
};