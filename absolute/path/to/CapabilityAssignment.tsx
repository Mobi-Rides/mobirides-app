
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

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

export function CapabilityAssignment({ userId }: { userId: string }) {
  // Fetch all available capabilities
  const { data: capabilities } = useQuery<Capability[]>({
    queryKey: ['capabilities'],
    queryFn: async () => {
      const { data, error } = await supabase.from('capabilities').select('*');
      if (error) throw error;
      return data;
    },
  });

  // Fetch user's current capabilities
  const { data: userCapabilities } = useQuery<UserCapability[]>({
    queryKey: ['user_capabilities', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_capabilities')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data;
    },
  });

  // Mutation for updating capabilities
  const { mutate: updateCapability } = useMutation({
    mutationFn: async ({ capabilityId, assigned }: { capabilityId: string; assigned: boolean }) => {
      if (assigned) {
        const { error } = await supabase
          .from('user_capabilities')
          .upsert({ user_id: userId, capability_id: capabilityId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_capabilities')
          .delete()
          .eq('user_id', userId)
          .eq('capability_id', capabilityId);
        if (error) throw error;
      }
    },
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Admin Capabilities</h3>
      {capabilities?.map((capability) => {
        const isAssigned = userCapabilities?.some(
          (uc) => uc.capability_id === capability.id
        );
        
        return (
          <div key={capability.id} className="flex items-center space-x-2">
            <Checkbox
              id={capability.id}
              checked={isAssigned}
              onCheckedChange={(checked) => {
                updateCapability({
                  capabilityId: capability.id,
                  assigned: Boolean(checked),
                });
              }}
            />
            <Label htmlFor={capability.id}>
              {capability.name} - {capability.description}
            </Label>
          </div>
        );
      })}
    </div>
  );
}