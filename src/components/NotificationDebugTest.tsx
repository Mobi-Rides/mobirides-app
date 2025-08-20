import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DebugResult {
  step: string;
  success: boolean;
  data?: any;
  error?: string;
}

export const NotificationDebugTest: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [results, setResults] = useState<DebugResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (result: DebugResult) => {
    setResults(prev => [...prev, result]);
  };

  const runDatabaseTest = async () => {
    setIsLoading(true);
    setResults([]);

    try {
      // Step 1: Check authentication
      addResult({
        step: '1. Authentication Check',
        success: isAuthenticated,
        data: {
          isAuthenticated,
          userId: user?.id,
          userEmail: user?.email
        }
      });

      if (!user?.id) {
        addResult({
          step: 'Error',
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      // Step 2: Direct query to notifications table
      const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select(`
          *,
          bookings:related_booking_id(
            id,
            car_id,
            cars(make, model)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      addResult({
        step: '2. Direct Notifications Query',
        success: !notifError,
        data: {
          count: notifications?.length || 0,
          notifications: notifications?.slice(0, 3), // Show first 3
          error: notifError?.message
        },
        error: notifError?.message
      });

      // Step 3: Check RLS policies by trying to access all notifications
      const { data: allNotifications, error: rlsError } = await supabase
        .from('notifications')
        .select('id, user_id, title')
        .limit(5);

      addResult({
        step: '3. RLS Policy Test (All Notifications)',
        success: !rlsError,
        data: {
          accessible: allNotifications?.length || 0,
          userSpecific: allNotifications?.filter(n => n.user_id === user.id).length || 0,
          error: rlsError?.message
        },
        error: rlsError?.message
      });

      // Step 4: Check if we can create a test notification
      const testNotification = {
        user_id: user.id,
        type: 'general',
        role_target: 'both',
        title: 'Debug Test Notification',
        description: 'This is a test notification created for debugging',
        is_read: false
      };

      const { data: createdNotif, error: createError } = await supabase
        .from('notifications')
        .insert(testNotification)
        .select()
        .single();

      addResult({
        step: '4. Create Test Notification',
        success: !createError,
        data: {
          created: !!createdNotif,
          notification: createdNotif,
          error: createError?.message
        },
        error: createError?.message
      });

      // Step 5: Check current session and permissions
      const { data: session } = await supabase.auth.getSession();
      const { data: userInfo } = await supabase.auth.getUser();

      addResult({
        step: '5. Session & User Info',
        success: true,
        data: {
          hasSession: !!session.session,
          sessionUserId: session.session?.user?.id,
          userInfoId: userInfo.user?.id,
          role: session.session?.user?.role,
          aud: session.session?.user?.aud
        }
      });

    } catch (error) {
      addResult({
        step: 'Unexpected Error',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Notification Debug Test</CardTitle>
        <div className="flex gap-2">
          <Button 
            onClick={runDatabaseTest} 
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Running Tests...' : 'Run Database Test'}
          </Button>
          <Button 
            onClick={clearResults} 
            variant="outline"
            disabled={isLoading}
          >
            Clear Results
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {results.map((result, index) => (
            <div 
              key={index} 
              className={`p-4 rounded-lg border ${
                result.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-3 h-3 rounded-full ${
                  result.success ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <h3 className="font-semibold">{result.step}</h3>
              </div>
              
              {result.error && (
                <div className="text-red-600 mb-2">
                  <strong>Error:</strong> {result.error}
                </div>
              )}
              
              {result.data && (
                <div className="bg-gray-100 p-3 rounded text-sm">
                  <pre className="whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
          
          {results.length === 0 && !isLoading && (
            <div className="text-gray-500 text-center py-8">
              Click "Run Database Test" to start debugging
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationDebugTest;