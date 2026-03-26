import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export const PlatformSettingsSection = () => {
  const { getSetting, updateSetting, loading } = usePlatformSettings();
  const { toast } = useToast();
  
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for forms
  const [dynamicPricingEnabled, setDynamicPricingEnabled] = 
    useState(() => typeof getSetting('dynamic_pricing_enabled', true) === 'boolean' 
      ? getSetting('dynamic_pricing_enabled', true) 
      : getSetting('dynamic_pricing_enabled', "true") === "true");
  
  const [adminFee, setAdminFee] = useState(getSetting('insurance_admin_fee_pula', 150).toString());
  const [silverTier, setSilverTier] = useState(getSetting('loyalty_tier_silver_threshold', 5).toString());
  const [goldTier, setGoldTier] = useState(getSetting('loyalty_tier_gold_threshold', 10).toString());
  const [platinumTier, setPlatinumTier] = useState(getSetting('loyalty_tier_platinum_threshold', 20).toString());

  // Update local state when remote loads
  React.useEffect(() => {
    if (!loading) {
      const dpEval = getSetting('dynamic_pricing_enabled', true);
      setDynamicPricingEnabled(typeof dpEval === 'boolean' ? dpEval : dpEval === "true");
      setAdminFee(getSetting('insurance_admin_fee_pula', 150).toString());
      setSilverTier(getSetting('loyalty_tier_silver_threshold', 5).toString());
      setGoldTier(getSetting('loyalty_tier_gold_threshold', 10).toString());
      setPlatinumTier(getSetting('loyalty_tier_platinum_threshold', 20).toString());
    }
  }, [loading]);

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSetting('dynamic_pricing_enabled', dynamicPricingEnabled);
      await updateSetting('insurance_admin_fee_pula', Number(adminFee));
      await updateSetting('loyalty_tier_silver_threshold', Number(silverTier));
      await updateSetting('loyalty_tier_gold_threshold', Number(goldTier));
      await updateSetting('loyalty_tier_platinum_threshold', Number(platinumTier));
      
      toast({
        title: "Settings Saved",
        description: "Platform settings updated successfully.",
      });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please ensure you have super admin access.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Global Platform Toggles</CardTitle>
          <CardDescription>Master switches for major platform features.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Dynamic Pricing</Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable dynamic pricing algorithms globally.
              </p>
            </div>
            <Switch 
              checked={dynamicPricingEnabled} 
              onCheckedChange={setDynamicPricingEnabled} 
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Insurance & Fees</CardTitle>
          <CardDescription>Configure fixed values for insurance processing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Insurance Admin Fee (BWP)</Label>
            <Input 
              type="number" 
              value={adminFee} 
              onChange={(e) => setAdminFee(e.target.value)} 
            />
            <p className="text-xs text-muted-foreground">Fixed fee applied to processed insurance claims.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Loyalty Tiers</CardTitle>
          <CardDescription>Configure the number of trips required for loyalty tiers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Silver Tier Minimum</Label>
              <Input type="number" value={silverTier} onChange={(e) => setSilverTier(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Gold Tier Minimum</Label>
              <Input type="number" value={goldTier} onChange={(e) => setGoldTier(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Platinum Tier Minimum</Label>
              <Input type="number" value={platinumTier} onChange={(e) => setPlatinumTier(e.target.value)} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end bg-muted/50 p-4 border-t">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
