import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

export const CommissionSettingsSection = () => {
  const { getSetting, updateSetting, loading: settingsLoading } = usePlatformSettings();
  const { toast } = useToast();
  
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [fallbackRate, setFallbackRate] = useState(getSetting('commission_rate_default', 0.15).toString());
  
  useEffect(() => {
    if (!settingsLoading) {
      setFallbackRate(getSetting('commission_rate_default', 0.15).toString());
    }
  }, [settingsLoading, getSetting]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from("commission_rates")
          .select("*")
          .order("effective_from", { ascending: false });
          
        if (!error && data) {
          setHistory(data);
        }
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSetting('commission_rate_default', Number(fallbackRate));
      toast({
        title: "Settings Saved",
        description: "Commission fallback rate updated successfully.",
      });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const activeRate = history.find(h => 
    new Date(h.effective_from) <= new Date() && 
    (!h.effective_until || new Date(h.effective_until) > new Date())
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Active Commission Rate</CardTitle>
            <CardDescription>Currently applied to all new bookings.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {activeRate ? `${(activeRate.rate * 100).toFixed(1)}%` : "Not Set"}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {activeRate ? `Effective since ${format(new Date(activeRate.effective_from), 'PP')}` : "Using fallback rate"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fallback Commission Rate</CardTitle>
            <CardDescription>Used if no effective commission rate is configured in the database.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default Rate (Decimal, e.g. 0.15 for 15%)</Label>
              <Input 
                type="number" 
                step="0.01"
                value={fallbackRate} 
                onChange={(e) => setFallbackRate(e.target.value)} 
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end bg-muted/50 p-4 border-t">
            <Button onClick={handleSave} disabled={isSaving || settingsLoading}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rate History</CardTitle>
          <CardDescription>Chronological log of commission rate changes.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rate</TableHead>
                  <TableHead>Effective From</TableHead>
                  <TableHead>Effective Until</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((rate, i) => {
                  const isActive = rate.id === activeRate?.id;
                  return (
                    <TableRow key={rate.id}>
                      <TableCell className="font-medium">{(rate.rate * 100).toFixed(1)}%</TableCell>
                      <TableCell>{format(new Date(rate.effective_from), 'PPp')}</TableCell>
                      <TableCell>{rate.effective_until ? format(new Date(rate.effective_until), 'PPp') : 'Ongoing'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {isActive ? 'Active' : 'Archived'}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {history.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      No commission history found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
