import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type Capability = {
  id: string;
  name: string;
  description: string;
};

type UserCapability = {
  user_id: string;
  capability_id: string;
  assigned: boolean;
};

interface CapabilityAssignmentProps {
  userId?: string;
  userName?: string;
}

export function CapabilityAssignment({
  userId,
  userName,
}: CapabilityAssignmentProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    userId || null
  );
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  // Update selectedUserId when userId prop changes
  useEffect(() => {
    if (userId) {
      setSelectedUserId(userId);
    }
  }, [userId]);

  // Fetch all available capabilities
  const { data: capabilities } = useQuery({
    queryKey: ["capabilities"],
    queryFn: async (): Promise<Capability[]> => {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/capabilities`;
      const response = await fetch(url, { method: 'GET' });
      if (!response.ok) throw new Error('Failed to fetch capabilities');
      const json = await response.json();
      const source = json?.data || json;
      const flattened: Capability[] = [];
      for (const section of Object.keys(source || {})) {
        const entries = source[section] || {};
        for (const key of Object.keys(entries)) {
          const capKey = `${section}.${key}`;
          const name = key.replace(/_/g, ' ');
          flattened.push({ id: capKey, name, description: section });
        }
      }
      return flattened;
    },
  });

  // Fetch user's current capabilities
  const { data: userCapabilities } = useQuery({
    queryKey: ["user_capabilities", selectedUserId],
    queryFn: async (): Promise<Array<{ capability_key: string }>> => {
      if (!selectedUserId) return [];
      const { data, error } = await supabase
        .from('admin_capabilities')
        .select('capability_key')
        .eq('admin_id', selectedUserId);
      if (error) throw error;
      return (data || []) as Array<{ capability_key: string }>;
    },
    enabled: !!selectedUserId,
  });

  // Mutation for updating capabilities
  const { mutate: updateCapability } = useMutation({
    mutationFn: async ({
      capabilityId,
      assigned,
    }: {
      capabilityId: string;
      assigned: boolean;
    }): Promise<void> => {
      if (!selectedUserId) throw new Error("No user selected");
      if (assigned) {
        const { error } = await supabase
          .from('admin_capabilities')
          .upsert({ admin_id: selectedUserId, capability_key: capabilityId, capability: capabilityId.split('.').pop() });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('admin_capabilities')
          .delete()
          .eq('admin_id', selectedUserId)
          .eq('capability_key', capabilityId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["user_capabilities", selectedUserId],
      });
      toast.success("Capability updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update capability: ${error.message}`);
    },
  });

  const handleCapabilityChange = (capabilityId: string, assigned: boolean) => {
    updateCapability({ capabilityId, assigned });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSelectedUserId(userId || null);
    }
  };

  // If userId is provided (from parent component), show capabilities directly
  if (userId && selectedUserId) {
    return (
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="text-lg font-medium">
          Capabilities for {userName || "Selected User"}
        </h3>
        
        <div className="space-y-3">
          {capabilities?.map((capability) => {
            const isAssigned = userCapabilities?.some(
              (uc) => uc.capability_key === capability.id
            );

            return (
              <div key={capability.id} className="flex items-start space-x-2">
                <Checkbox
                  id={capability.id}
                  checked={isAssigned}
                  onCheckedChange={(checked) => {
                    handleCapabilityChange(capability.id, Boolean(checked));
                  }}
                  className="mt-1"
                />
                <Label
                  htmlFor={capability.id}
                  className="text-sm cursor-pointer"
                >
                  <div className="font-medium">{capability.name}</div>
                  <div className="text-gray-500 text-xs">
                    {capability.description}
                  </div>
                </Label>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Default dialog behavior for manual selection
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          {userId
            ? `Manage Capabilities for ${userName || "User"}`
            : "Assign Capabilities"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Admin Capabilities</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!selectedUserId && (
            <p className="text-sm text-gray-500">Please select a user first.</p>
          )}
          {selectedUserId &&
            capabilities?.map((capability) => {
              const isAssigned = userCapabilities?.some(
                (uc) => uc.capability_key === capability.id
              );

              return (
                <div key={capability.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={capability.id}
                    checked={isAssigned}
                    onCheckedChange={(checked) => {
                      handleCapabilityChange(capability.id, Boolean(checked));
                    }}
                    className="mt-1"
                  />
                  <Label
                    htmlFor={capability.id}
                    className="text-sm cursor-pointer"
                  >
                    <div className="font-medium">{capability.name}</div>
                    <div className="text-gray-500 text-xs">
                      {capability.description}
                    </div>
                  </Label>
                </div>
              );
            })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
