
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@supabase/auth-helpers-react";
import { hasLocationFields } from "@/utils/profileTypes";

export interface SharingScopeProps {
  initialScope: string;
  isLoading: boolean;
  disabled?: boolean;
}

export const SharingScope = ({ initialScope, isLoading, disabled = false }: SharingScopeProps) => {
  const [sharingScope, setSharingScope] = useState(initialScope);
  const user = useUser();

  const handleScopeChange = async (value: string) => {
    if (!user) return;

    try {
      // Check if the location_sharing_scope column exists
      const { data: columnExists } = await supabase
        .from("profiles")
        .select("*")
        .limit(1);

      if (!hasLocationFields(columnExists?.[0])) {
        toast.error("Location sharing scope is not supported in this database");
        return;
      }

      // Update the profile with the new scope value
      const { error } = await supabase
        .from("profiles")
        .update({
          location_sharing_scope: value,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) throw error;

      setSharingScope(value);
      toast.success(`Location sharing scope set to ${value}`);
    } catch (error) {
      console.error("Error updating sharing scope:", error);
      toast.error("Could not update sharing scope");
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <Label className="text-xs text-muted-foreground whitespace-nowrap">To:</Label>
      <Select 
        value={sharingScope} 
        onValueChange={handleScopeChange} 
        disabled={isLoading || disabled}
      >
        <SelectTrigger className="h-7 w-[100px] text-xs">
          <SelectValue placeholder="Who can see you" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Everyone</SelectItem>
          <SelectItem value="hosts">Hosts Only</SelectItem>
          <SelectItem value="renters">Renters Only</SelectItem>
          <SelectItem value="none">No One</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
