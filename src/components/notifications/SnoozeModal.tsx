import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

interface SnoozeModalProps {
  open: boolean;
  onClose: () => void;
  onSnooze: (snoozeUntil: Date) => void;
  notification: any;
}

const PRESETS = [
  { label: "1 hour", value: 1 * 60 * 60 * 1000 },
  { label: "1 day", value: 24 * 60 * 60 * 1000 },
  { label: "1 week", value: 7 * 24 * 60 * 60 * 1000 },
];

export const SnoozeModal: React.FC<SnoozeModalProps> = ({ open, onClose, onSnooze, notification }) => {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customDate, setCustomDate] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handlePreset = (ms: number) => {
    setSelectedPreset(ms);
    setCustomDate("");
    setError("");
  };

  const handleCustomDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomDate(e.target.value);
    setSelectedPreset(null);
    setError("");
  };

  const handleConfirm = () => {
    let snoozeUntil: Date | null = null;
    if (selectedPreset) {
      snoozeUntil = new Date(Date.now() + selectedPreset);
    } else if (customDate) {
      const d = new Date(customDate);
      if (isNaN(d.getTime()) || d <= new Date()) {
        setError("Please select a valid future date/time.");
        return;
      }
      snoozeUntil = d;
    } else {
      setError("Please select a snooze duration.");
      return;
    }
    onSnooze(snoozeUntil!);
    onClose();
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Snooze Notification</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            {PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant={selectedPreset === preset.value ? "default" : "outline"}
                onClick={() => handlePreset(preset.value)}
                className="flex-1"
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <input
              type="datetime-local"
              value={customDate}
              onChange={handleCustomDate}
              className="border rounded px-2 py-1 w-full"
              min={new Date(Date.now() + 60 * 1000).toISOString().slice(0, 16)}
            />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
        </div>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Snooze</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SnoozeModal; 