import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X } from "lucide-react";

interface EditableFieldProps {
  label: string;
  value: string;
  onSave: (value: string) => Promise<void>;
  icon?: React.ReactNode;
  showLabel?: boolean;
}

export const EditableField = ({ 
  label, 
  value, 
  onSave, 
  icon,
  showLabel = true 
}: EditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      setEditValue(value);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div>
        {showLabel && (
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
            {icon}
            {label}
          </label>
        )}
        <div className="flex gap-2">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            disabled={isSaving}
            className="flex-1"
          />
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="px-3"
          >
            <Check className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
            className="px-3"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {showLabel && (
        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
          {icon}
          {label}
        </label>
      )}
      <div className="flex items-center justify-between group">
        <p className="text-sm text-foreground">{value || "Not provided"}</p>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsEditing(true)}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Pencil className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};
