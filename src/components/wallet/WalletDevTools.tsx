
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockPaymentService } from "@/services/mockPaymentService";
import { walletService } from "@/services/walletService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Settings, TestTube, Zap, RefreshCw } from "lucide-react";

export const WalletDevTools = () => {
  const [testAmount, setTestAmount] = useState("100");
  const [failureRate, setFailureRate] = useState("0.1");
  const [processingDelay, setProcessingDelay] = useState("2000");
  const [enableFailures, setEnableFailures] = useState(false);

  const handleAddTestFunds = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please log in first");
      return;
    }

    const amount = parseFloat(testAmount);
    if (amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const success = await walletService.addTestFunds(user.id, amount);
    if (success) {
      toast.success(`Added P${amount} test funds`);
    }
  };

  const handleResetWallet = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please log in first");
      return;
    }

    const success = await walletService.resetWallet(user.id);
    if (success) {
      window.location.reload(); // Refresh to update UI
    }
  };

  const handleConfigurePaymentService = () => {
    mockPaymentService.configure({
      enableFailures,
      failureRate: parseFloat(failureRate),
      processingDelay: parseInt(processingDelay)
    });
    
    toast.success("Payment service configured");
  };

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
          <Settings className="h-5 w-5" />
          Wallet Development Tools
        </CardTitle>
        <CardDescription className="text-orange-600 dark:text-orange-400">
          Tools for testing wallet functionality. Only visible in development mode.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="test-funds" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="test-funds">Test Funds</TabsTrigger>
            <TabsTrigger value="payment-config">Payment Config</TabsTrigger>
            <TabsTrigger value="console-helpers">Console</TabsTrigger>
          </TabsList>
          
          <TabsContent value="test-funds" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-amount">Test Amount (BWP)</Label>
              <Input
                id="test-amount"
                type="number"
                value={testAmount}
                onChange={(e) => setTestAmount(e.target.value)}
                placeholder="100"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddTestFunds} className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Add Test Funds
              </Button>
              <Button variant="destructive" onClick={handleResetWallet} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Reset Wallet
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="payment-config" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-failures">Enable Payment Failures</Label>
                <Switch
                  id="enable-failures"
                  checked={enableFailures}
                  onCheckedChange={setEnableFailures}
                />
              </div>
              
              {enableFailures && (
                <div className="space-y-2">
                  <Label htmlFor="failure-rate">Failure Rate (0.0 - 1.0)</Label>
                  <Input
                    id="failure-rate"
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={failureRate}
                    onChange={(e) => setFailureRate(e.target.value)}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="processing-delay">Processing Delay (ms)</Label>
                <Input
                  id="processing-delay"
                  type="number"
                  value={processingDelay}
                  onChange={(e) => setProcessingDelay(e.target.value)}
                />
              </div>
              
              <Button onClick={handleConfigurePaymentService} className="w-full">
                Apply Configuration
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="console-helpers" className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Available in browser console for testing:
              </p>
              <div className="space-y-1">
                <Badge variant="secondary" className="font-mono">
                  mockPaymentService
                </Badge>
                <Badge variant="secondary" className="font-mono">
                  walletService
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• mockPaymentService.simulateSuccess()</p>
                <p>• mockPaymentService.simulateFailures(0.5)</p>
                <p>• walletService.addTestFunds(userId, amount)</p>
                <p>• walletService.resetWallet(userId)</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
