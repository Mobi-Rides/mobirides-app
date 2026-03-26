import React from 'react';
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlatformSettingsSection } from "@/components/admin/settings/PlatformSettingsSection";
import { CommissionSettingsSection } from "@/components/admin/settings/CommissionSettingsSection";
import { DynamicPricingRulesSection } from "@/components/admin/settings/DynamicPricingRulesSection";
import { InsuranceSettingsSection } from "@/components/admin/settings/InsuranceSettingsSection";

const AdminSettings = () => {
  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Platform Settings</h1>
            <p className="text-muted-foreground">
              Manage global configurations and business rules
            </p>
          </div>
          
          <Tabs defaultValue="platform" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="platform">General</TabsTrigger>
              <TabsTrigger value="commission">Commission</TabsTrigger>
              <TabsTrigger value="pricing">Dynamic Pricing</TabsTrigger>
              <TabsTrigger value="insurance">Insurance Packages</TabsTrigger>
            </TabsList>
            
            <TabsContent value="platform">
              <PlatformSettingsSection />
            </TabsContent>
            
            <TabsContent value="commission">
              <CommissionSettingsSection />
            </TabsContent>
            
            <TabsContent value="pricing">
              <DynamicPricingRulesSection />
            </TabsContent>
            
            <TabsContent value="insurance">
              <InsuranceSettingsSection />
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default AdminSettings;
