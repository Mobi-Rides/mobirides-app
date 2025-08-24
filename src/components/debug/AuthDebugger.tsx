import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const AuthDebugger = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const runDiagnostics = async () => {
      console.log('🔍 [AUTH DEBUGGER] Running comprehensive auth diagnostics...');
      
      const results: any = {
        timestamp: new Date().toISOString()
      };

      // Test 1: Frontend session state
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        results.frontendSession = {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          email: session?.user?.email,
          tokenPresent: !!session?.access_token,
          tokenLength: session?.access_token?.length || 0,
          error: error?.message
        };
        console.log('✅ [AUTH DEBUGGER] Frontend session:', results.frontendSession);
      } catch (error) {
        results.frontendSession = { error: (error as Error).message };
        console.error('❌ [AUTH DEBUGGER] Frontend session failed:', error);
      }

      // Test 2: Database auth context with direct query
      try {
        const { data: directAuth, error: directError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('id', results.frontendSession?.userId)
          .maybeSingle();
        
        results.databaseAuth = { 
          directQuery: { data: directAuth, error: directError?.message }
        };
        console.log('✅ [AUTH DEBUGGER] Direct database query:', results.databaseAuth);
      } catch (directError) {
        results.databaseAuth = { error: (directError as Error).message };
        console.error('❌ [AUTH DEBUGGER] Database auth test failed:', directError);
      }

      // Test 3: Simple authenticated query
      try {
        const { data: profileTest, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .limit(1);
        
        results.simpleQuery = { 
          success: !profileError,
          dataCount: profileTest?.length || 0,
          error: profileError?.message 
        };
        console.log('✅ [AUTH DEBUGGER] Simple query test:', results.simpleQuery);
      } catch (error) {
        results.simpleQuery = { error: (error as Error).message };
        console.error('❌ [AUTH DEBUGGER] Simple query failed:', error);
      }

      // Test 4: Conversation participant query (the failing one)
      if (results.frontendSession?.userId) {
        try {
          const { data: participantTest, error: participantError } = await supabase
            .from('conversation_participants')
            .select('conversation_id, user_id')
            .eq('user_id', results.frontendSession.userId)
            .limit(1);
          
          results.conversationQuery = {
            success: !participantError,
            dataCount: participantTest?.length || 0,
            error: participantError?.message,
            errorDetails: participantError
          };
          console.log('✅ [AUTH DEBUGGER] Conversation query test:', results.conversationQuery);
        } catch (error) {
          results.conversationQuery = { error: (error as Error).message };
          console.error('❌ [AUTH DEBUGGER] Conversation query failed:', error);
        }
      }

      setDebugInfo(results);
      console.log('🎯 [AUTH DEBUGGER] Complete diagnostic results:', results);
    };

    runDiagnostics();
  }, []);

  if (Object.keys(debugInfo).length === 0) {
    return <div className="p-4 bg-yellow-100 text-yellow-800">Running auth diagnostics...</div>;
  }

  return (
    <div className="p-4 bg-gray-100 text-xs font-mono">
      <h3 className="font-bold text-lg mb-2">🔍 Auth Diagnostics</h3>
      <pre className="whitespace-pre-wrap overflow-auto max-h-96 bg-white p-2 rounded">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  );
};