import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const AuthDebug = () => {
  const [authInfo, setAuthInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkAuth = async () => {
    setLoading(true);
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      let adminStatus = null;
      let adminError = null;
      
      if (session?.user) {
        // Check admin status
        try {
          const { data: isAdminResult, error: adminCheckError } = await supabase
            .rpc('is_admin', { user_uuid: session.user.id });
          adminStatus = isAdminResult;
          adminError = adminCheckError;
        } catch (err) {
          adminError = err;
        }
      }

      setAuthInfo({
        session: session ? {
          user: {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role
          },
          access_token: session.access_token ? 'Present' : 'Missing',
          refresh_token: session.refresh_token ? 'Present' : 'Missing'
        } : null,
        sessionError,
        adminStatus,
        adminError
      });
    } catch (error) {
      setAuthInfo({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testEdgeFunction = async () => {
    setLoading(true);
    try {
      // First, get a real user ID from the profiles table (excluding current user)
      const { data: session } = await supabase.auth.getSession();
      const currentUserId = session?.session?.user?.id;

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .neq('id', currentUserId || '')
        .neq('role', 'admin') // Don't try to suspend other admins
        .limit(1);

      if (profilesError || !profiles || profiles.length === 0) {
        setEdgeFunctionTest({
          data: null,
          error: { message: "No suitable test user found in profiles table", context: { profilesError } }
        });
        return;
      }

      const testUserId = profiles[0].id;

      const { data, error } = await supabase.functions.invoke('suspend-user', {
        body: {
          userId: testUserId,
          restrictionType: 'suspend',
          reason: 'Test suspension from AuthDebug',
          duration: 'hours',
          durationValue: 1
        }
      });

      setEdgeFunctionTest({ data, error });
    } catch (err) {
      setEdgeFunctionTest({
        data: null,
        error: { message: err instanceof Error ? err.message : 'Unknown error', context: {} }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Authentication Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={checkAuth} disabled={loading}>
            Check Auth Status
          </Button>
          <Button onClick={testEdgeFunction} disabled={loading}>
            Test Edge Function
          </Button>
        </div>
        
        {authInfo && (
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
            {JSON.stringify(authInfo, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  );
};