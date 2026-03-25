import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check, X } from "lucide-react";
import { InsurancePackage } from "@/types/insurance-schema";

export const InsuranceSettingsSection = () => {
  const [packages, setPackages] = useState<InsurancePackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const { data, error } = await supabase
          .from("insurance_packages")
          .select("*")
          .order("sort_order", { ascending: true });
          
        if (!error && data) {
          setPackages(data as any); 
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchPackages();
  }, []);

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Insurance Packages (Read-Only Viewer)</CardTitle>
          <CardDescription>
            Overview of the insurance tiers configured in the system. Full editing flow to be implemented in a subsequent update.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Premium %</TableHead>
                <TableHead>Daily Rate (Flat)</TableHead>
                <TableHead>Coverage Cap</TableHead>
                <TableHead>Minor Dmg</TableHead>
                <TableHead>Major Incidents</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell>
                    {pkg.is_active ? 
                      <Badge className="bg-green-100 text-green-800 border-none hover:bg-green-200">Active</Badge> : 
                      <Badge variant="secondary">Inactive</Badge>}
                  </TableCell>
                  <TableCell className="font-medium">
                    {pkg.name}
                    <div className="text-xs text-muted-foreground font-normal">{pkg.display_name}</div>
                  </TableCell>
                  <TableCell>{(pkg.premium_percentage * 100).toFixed(1)}%</TableCell>
                  <TableCell>{pkg.daily_premium_amount ? `P ${pkg.daily_premium_amount}` : "-"}</TableCell>
                  <TableCell>{pkg.coverage_cap ? `P ${pkg.coverage_cap.toLocaleString()}` : "None"}</TableCell>
                  <TableCell>
                    {pkg.covers_minor_damage ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-500" />}
                  </TableCell>
                  <TableCell>
                    {pkg.covers_major_incidents ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-500" />}
                  </TableCell>
                </TableRow>
              ))}
              {packages.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                    No insurance packages found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
