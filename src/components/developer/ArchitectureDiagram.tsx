
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const ArchitectureDiagram = () => {
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Mobirides Architecture Deep Dive
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-6">
            
            {/* Frontend Layer */}
            <div className="w-full bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-3 text-center">
                Frontend Layer (React + TypeScript)
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded border">
                  <div className="font-medium text-sm">Pages</div>
                  <div className="text-xs text-gray-600">Index, Profile, Map, Dashboard</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="font-medium text-sm">Components</div>
                  <div className="text-xs text-gray-600">Header, Navigation, CarCard</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="font-medium text-sm">Hooks</div>
                  <div className="text-xs text-gray-600">useAuth, useMap, useLocation</div>
                </div>
              </div>
            </div>

            {/* Arrow Down */}
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-8 bg-gray-400"></div>
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-gray-400"></div>
            </div>

            {/* Service Layer */}
            <div className="w-full bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-800 mb-3 text-center">
                Service Layer
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded border">
                  <div className="font-medium text-sm">Business Logic</div>
                  <div className="text-xs text-gray-600">
                    bookingService, walletService, commissionService
                  </div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="font-medium text-sm">External APIs</div>
                  <div className="text-xs text-gray-600">
                    Mapbox, Payment Processing
                  </div>
                </div>
              </div>
            </div>

            {/* Arrow Down */}
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-8 bg-gray-400"></div>
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-gray-400"></div>
            </div>

            {/* Data Layer */}
            <div className="w-full bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-800 mb-3 text-center">
                Data Layer (Supabase)
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded border">
                  <div className="font-medium text-sm">Authentication</div>
                  <div className="text-xs text-gray-600">Auth, Profiles, Roles</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="font-medium text-sm">Database</div>
                  <div className="text-xs text-gray-600">PostgreSQL, RLS Policies</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="font-medium text-sm">Real-time</div>
                  <div className="text-xs text-gray-600">Subscriptions, Live Updates</div>
                </div>
              </div>
            </div>

            {/* Arrow Down */}
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-8 bg-gray-400"></div>
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-gray-400"></div>
            </div>

            {/* Core Business Logic */}
            <div className="w-full bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-orange-800 mb-3 text-center">
                Core Business Logic
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white p-4 rounded border">
                  <div className="font-medium text-sm mb-2">Commission System</div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>• 15% commission deducted from host wallet</div>
                    <div>• Minimum P50 wallet balance required</div>
                    <div>• Real-time wallet validation</div>
                    <div>• Automatic commission calculation</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Flow Indicators */}
            <div className="mt-6 bg-gray-50 p-4 rounded-lg w-full">
              <h4 className="font-semibold text-center mb-3">Data Flow Patterns</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium text-blue-600">User Interaction</div>
                  <div className="text-xs">Pages → Components → Hooks</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-green-600">Business Logic</div>
                  <div className="text-xs">Services → Validation → Processing</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-purple-600">Data Persistence</div>
                  <div className="text-xs">Database → Real-time → Updates</div>
                </div>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
};
