import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useDynamicPricingRules } from "@/hooks/useDynamicPricingRules";
import { Loader2 } from "lucide-react";
import { PricingRule } from "@/types/pricing";

export const DynamicPricingRulesSection = () => {
  const { rules, loading, error, updateRule } = useDynamicPricingRules();

  const handleToggleActive = async (rule: PricingRule, checked: boolean) => {
    await updateRule(rule.id, { is_active: checked });
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error) {
    return <div className="text-red-500 p-4 border border-red-200 bg-red-50 rounded-md">Error loading pricing rules: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Algorithm Rules Configuration</CardTitle>
          <CardDescription>
            Manage the individual conditions and multipliers for the dynamic pricing algorithm.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Rule Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Multiplier</TableHead>
                <TableHead>Priority</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <Switch 
                      checked={rule.is_active} 
                      onCheckedChange={(checked) => handleToggleActive(rule, checked)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{rule.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className={rule.multiplier > 1 ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
                      x {rule.multiplier.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>{rule.priority}</TableCell>
                </TableRow>
              ))}
              {rules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    No dynamic pricing rules configured.
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
