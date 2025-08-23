import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export function NotificationDebugTest() {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDebugTest = async () => {
    setLoading(true);
    const info: any = {
      timestamp: new Date().toISOString(),
      user: null,
      notifications: null,
      error: null,
      rlsTest: null
    };

    try {
      // 1. Check current user
      console.log('🔍 Current user:', user);
      info.user = {
        id: user?.id || 'No user',
        email: user?.email || 'No email',
        authenticated: !!user
      };

      if (!user) {
        info.error = 'User not authenticated';
        setDebugInfo(info);
        setLoading(false);
        return;
      }

      // 2. Direct Supabase query for notifications
      console.log('🔍 Fetching notifications for user:', user.id);
      const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('🔍 Notifications query result:', { notifications, error: notifError });
      info.notifications = {
        count: notifications?.length || 0,
        data: notifications,
        error: notifError?.message || null
      };

      // 3. Test RLS policies
      console.log('🔍 Testing RLS policies...');
      const { data: rlsTest, error: rlsError } = await supabase
        .from('notifications')
        .select('count')
        .eq('user_id', user.id);

      info.rlsTest = {
        success: !rlsError,
        error: rlsError?.message || null,
        result: rlsTest
      };

      // 4. Create a test notification if none exist
      if (notifications && notifications.length === 0) {
        console.log('🔍 Creating test notification...');
        const { data: testNotif, error: createError } = await supabase
          .from('notifications')
          .insert({
            user_id: user.id,
            type: 'system_notification',
            title: 'Debug Test Notification',
            description: 'This is a test notification created for debugging purposes.',
            is_read: false
          })
          .select()
          .single();

        info.testNotificationCreated = {
          success: !createError,
          data: testNotif,
          error: createError?.message || null
        };
      }

    } catch (error: any) {
      console.error('🚨 Debug test error:', error);
      info.error = error.message;
    }

    setDebugInfo(info);
    setLoading(false);
  };

  return (
    <Card className="mb-6 border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-yellow-800">🐛 Notification Debug Test</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button 
            onClick={runDebugTest} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Running Debug Test...' : 'Run Notification Debug Test'}
          </Button>

          {debugInfo && (
            <div className="bg-white p-4 rounded border">
              <h4 className="font-semibold mb-2">Debug Results:</h4>
              <pre className="text-xs overflow-auto max-h-96 bg-gray-100 p-2 rounded">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}