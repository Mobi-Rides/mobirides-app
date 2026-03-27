import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Percent, DollarSign, Calculator } from 'lucide-react';

export const CommissionSettingsSection = () => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // Commission settings
  const [platformFeePercent, setPlatformFeePercent] = useState('10');
  const [hostCommissionPercent, setHostCommissionPercent] = useState('85');
  const [insuranceCommissionPercent, setInsuranceCommissionPercent] = useState('5');
  const [minimumBookingAmount, setMinimumBookingAmount] = useState('500');
  const [maximumBookingAmount, setMaximumBookingAmount] = useState('50000');

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: 'Commission settings saved',
        description: 'Platform commission rules have been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const calculateHostPayout = (bookingAmount: number) => {
    const platformFee = bookingAmount * (parseFloat(platformFeePercent) / 100);
    const hostShare = bookingAmount * (parseFloat(hostCommissionPercent) / 100);
    return { platformFee, hostShare };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Commission Structure
          </CardTitle>
          <CardDescription>
            Configure how platform fees and commissions are calculated
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="platformFee">Platform Fee (%)</Label>
              <Input
                id="platformFee"
                type="number"
                min="0"
                max="100"
                value={platformFeePercent}
                onChange={(e) => setPlatformFeePercent(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Platform takes this percentage from each booking
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hostCommission">Host Commission (%)</Label>
              <Input
                id="hostCommission"
                type="number"
                min="0"
                max="100"
                value={hostCommissionPercent}
                onChange={(e) => setHostCommissionPercent(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Percentage host receives from booking
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="insuranceCommission">Insurance Commission (%)</Label>
              <Input
                id="insuranceCommission"
                type="number"
                min="0"
                max="100"
                value={insuranceCommissionPercent}
                onChange={(e) => setInsuranceCommissionPercent(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Insurance provider commission
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">Commission Breakdown Verification:</p>
            <p className="text-sm text-muted-foreground">
              Platform ({platformFeePercent}%) + Host ({hostCommissionPercent}%) + Insurance ({insuranceCommissionPercent}%) =
              {parseFloat(platformFeePercent) + parseFloat(hostCommissionPercent) + parseFloat(insuranceCommissionPercent)}%
              {parseFloat(platformFeePercent) + parseFloat(hostCommissionPercent) + parseFloat(insuranceCommissionPercent) !== 100 && (
                <span className="text-red-500 ml-2">(Should equal 100%)</span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Booking Limits
          </CardTitle>
          <CardDescription>
            Set minimum and maximum booking amounts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minBooking">Minimum Booking Amount (BWP)</Label>
              <Input
                id="minBooking"
                type="number"
                min="0"
                value={minimumBookingAmount}
                onChange={(e) => setMinimumBookingAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxBooking">Maximum Booking Amount (BWP)</Label>
              <Input
                id="maxBooking"
                type="number"
                min="0"
                value={maximumBookingAmount}
                onChange={(e) => setMaximumBookingAmount(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Commission Calculator
          </CardTitle>
          <CardDescription>
            Preview commission calculations for a sample booking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Sample Booking: BWP 1,000</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Platform Fee ({platformFeePercent}%):</span>
                  <span>BWP {(1000 * parseFloat(platformFeePercent) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Host Payout ({hostCommissionPercent}%):</span>
                  <span>BWP {(1000 * parseFloat(hostCommissionPercent) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Insurance Commission ({insuranceCommissionPercent}%):</span>
                  <span>BWP {(1000 * parseFloat(insuranceCommissionPercent) / 100).toFixed(2)}</span>
                </div>
                <div className="border-t pt-1 mt-2 font-medium flex justify-between">
                  <span>Total:</span>
                  <span>BWP 1,000.00</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => {
          setPlatformFeePercent('10');
          setHostCommissionPercent('85');
          setInsuranceCommissionPercent('5');
          setMinimumBookingAmount('500');
          setMaximumBookingAmount('50000');
          toast({ title: 'Reset to defaults' });
        }}>
          Reset to Defaults
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};
