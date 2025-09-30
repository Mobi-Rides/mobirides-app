// Conversation System Functionality Test
// Legacy Message System Removal - Post-Implementation Verification
// This script tests the core messaging functionality after legacy removal

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types';

// Test configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your_supabase_url';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your_supabase_anon_key';

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

interface TestUser {
  id: string;
  email: string;
  token: string;
}

interface TestConversation {
  id: string;
  title: string;
  participants: string[];
}

interface TestMessage {
  id?: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type?: string;
}

/**
 * Test Suite: Conversation System Functionality
 * Verifies all core messaging features work correctly after legacy removal
 */
export class ConversationSystemTest {
  private testUsers: TestUser[] = [];
  private testConversation: TestConversation | null = null;
  private testResults: { test: string; passed: boolean; error?: string }[] = [];

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Conversation System Functionality Tests...\n');

    try {
      // Authentication Tests
      await this.testAuthentication();
      
      // Conversation Management Tests
      await this.testConversationCreation();
      await this.testConversationRetrieval();
      await this.testConversationSearch();
      
      // Message Functionality Tests
      await this.testMessageSending();
      await this.testMessageRetrieval();
      await this.testMessageSearch();
      
      // Participant Management Tests
      await this.testParticipantManagement();
      
      // Real-time Functionality Tests
      await this.testRealTimeUpdates();
      
      // Admin Functionality Tests
      await this.testAdminFunctions();

      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    }
  }

  private async testAuthentication(): Promise<void> {
    console.log('🔐 Testing Authentication...');
    
    try {
      // Test anonymous access to public data
      const { data: publicConversations, error: publicError } = await supabase
        .from('conversations')
        .select('id, title')
        .limit(1);

      if (publicError) {
        this.recordTestResult('Anonymous Conversation Access', false, publicError.message);
      } else {
        this.recordTestResult('Anonymous Conversation Access', true);
      }

      // Test authenticated user simulation (would need actual auth in real scenario)
      console.log('✅ Authentication tests completed\n');
      
    } catch (error) {
      this.recordTestResult('Authentication', false, (error as Error).message);
    }
  }

  private async testConversationCreation(): Promise<void> {
    console.log('💬 Testing Conversation Creation...');
    
    try {
      // Create test conversation
      const { data: conversation, error: createError } = await supabase
        .from('conversations')
        .insert([
          {
            title: 'Test Conversation - Legacy Removal Verification',
            created_by: 'test-user-id',
            metadata: { test: true, purpose: 'legacy_removal_verification' }
          }
        ])
        .select()
        .single();

      if (createError) {
        this.recordTestResult('Conversation Creation', false, createError.message);
        return;
      }

      this.testConversation = {
        id: conversation.id,
        title: conversation.title,
        participants: []
      };

      this.recordTestResult('Conversation Creation', true);
      console.log(`✅ Created test conversation: ${conversation.id}\n`);
      
    } catch (error) {
      this.recordTestResult('Conversation Creation', false, (error as Error).message);
    }
  }

  private async testConversationRetrieval(): Promise<void> {
    console.log('📋 Testing Conversation Retrieval...');
    
    if (!this.testConversation) {
      this.recordTestResult('Conversation Retrieval', false, 'No test conversation available');
      return;
    }

    try {
      // Test single conversation retrieval
      const { data: conversation, error: singleError } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_participants (
            user_id,
            role,
            joined_at
          ),
          conversation_messages (
            id,
            content,
            sender_id,
            created_at
          )
        `)
        .eq('id', this.testConversation.id)
        .single();

      if (singleError) {
        this.recordTestResult('Single Conversation Retrieval', false, singleError.message);
      } else {
        this.recordTestResult('Single Conversation Retrieval', true);
      }

      // Test conversation list retrieval
      const { data: conversations, error: listError } = await supabase
        .from('conversations')
        .select('id, title, created_at, created_by')
        .order('created_at', { ascending: false })
        .limit(10);

      if (listError) {
        this.recordTestResult('Conversation List Retrieval', false, listError.message);
      } else {
        this.recordTestResult('Conversation List Retrieval', true);
      }

      console.log('✅ Conversation retrieval tests completed\n');
      
    } catch (error) {
      this.recordTestResult('Conversation Retrieval', false, (error as Error).message);
    }
  }

  private async testConversationSearch(): Promise<void> {
    console.log('🔍 Testing Conversation Search...');
    
    try {
      // Test conversation search by title
      const { data: searchResults, error: searchError } = await supabase
        .from('conversations')
        .select('id, title, created_at')
        .ilike('title', '%Test Conversation%')
        .limit(5);

      if (searchError) {
        this.recordTestResult('Conversation Search', false, searchError.message);
      } else {
        this.recordTestResult('Conversation Search', true);
      }

      console.log('✅ Conversation search tests completed\n');
      
    } catch (error) {
      this.recordTestResult('Conversation Search', false, (error as Error).message);
    }
  }

  private async testMessageSending(): Promise<void> {
    console.log('💌 Testing Message Sending...');
    
    if (!this.testConversation) {
      this.recordTestResult('Message Sending', false, 'No test conversation available');
      return;
    }

    try {
      // Test message creation
      const testMessage: TestMessage = {
        conversation_id: this.testConversation.id,
        sender_id: 'test-sender-id',
        content: 'Test message - Legacy removal verification',
        message_type: 'text'
      };

      const { data: message, error: sendError } = await supabase
        .from('conversation_messages')
        .insert([testMessage])
        .select()
        .single();

      if (sendError) {
        this.recordTestResult('Message Sending', false, sendError.message);
      } else {
        this.recordTestResult('Message Sending', true);
        console.log(`✅ Sent test message: ${message.id}\n`);
      }
      
    } catch (error) {
      this.recordTestResult('Message Sending', false, (error as Error).message);
    }
  }

  private async testMessageRetrieval(): Promise<void> {
    console.log('📨 Testing Message Retrieval...');
    
    if (!this.testConversation) {
      this.recordTestResult('Message Retrieval', false, 'No test conversation available');
      return;
    }

    try {
      // Test message retrieval with pagination
      const { data: messages, error: retrieveError } = await supabase
        .from('conversation_messages')
        .select(`
          *,
          sender:sender_id (
            email,
            raw_user_meta_data
          )
        `)
        .eq('conversation_id', this.testConversation.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (retrieveError) {
        this.recordTestResult('Message Retrieval', false, retrieveError.message);
      } else {
        this.recordTestResult('Message Retrieval', true);
        console.log(`✅ Retrieved ${messages?.length || 0} messages\n`);
      }
      
    } catch (error) {
      this.recordTestResult('Message Retrieval', false, (error as Error).message);
    }
  }

  private async testMessageSearch(): Promise<void> {
    console.log('🔎 Testing Message Search...');
    
    try {
      // Test message content search
      const { data: searchResults, error: searchError } = await supabase
        .from('conversation_messages')
        .select('id, content, conversation_id, created_at')
        .ilike('content', '%test%')
        .limit(10);

      if (searchError) {
        this.recordTestResult('Message Search', false, searchError.message);
      } else {
        this.recordTestResult('Message Search', true);
        console.log(`✅ Found ${searchResults?.length || 0} messages matching search\n`);
      }
      
    } catch (error) {
      this.recordTestResult('Message Search', false, (error as Error).message);
    }
  }

  private async testParticipantManagement(): Promise<void> {
    console.log('👥 Testing Participant Management...');
    
    if (!this.testConversation) {
      this.recordTestResult('Participant Management', false, 'No test conversation available');
      return;
    }

    try {
      // Test participant addition
      const { error: addError } = await supabase
        .from('conversation_participants')
        .insert([
          {
            conversation_id: this.testConversation.id,
            user_id: 'test-participant-id',
            role: 'member',
            joined_at: new Date().toISOString()
          }
        ]);

      if (addError) {
        this.recordTestResult('Participant Addition', false, addError.message);
      } else {
        this.recordTestResult('Participant Addition', true);
      }

      // Test participant retrieval
      const { data: participants, error: retrieveError } = await supabase
        .from('conversation_participants')
        .select(`
          *,
          user:user_id (
            email,
            raw_user_meta_data
          )
        `)
        .eq('conversation_id', this.testConversation.id);

      if (retrieveError) {
        this.recordTestResult('Participant Retrieval', false, retrieveError.message);
      } else {
        this.recordTestResult('Participant Retrieval', true);
      }

      console.log('✅ Participant management tests completed\n');
      
    } catch (error) {
      this.recordTestResult('Participant Management', false, (error as Error).message);
    }
  }

  private async testRealTimeUpdates(): Promise<void> {
    console.log('⚡ Testing Real-time Updates...');
    
    try {
      // Test real-time subscription setup (basic test)
      const subscription = supabase
        .channel('test-conversation-updates')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'conversation_messages' },
          (payload) => {
            console.log('Real-time update received:', payload);
          }
        )
        .subscribe();

      // Allow subscription to establish
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Test subscription status
      const status = subscription.state;
      this.recordTestResult('Real-time Subscription', status === 'joined');

      // Clean up subscription
      await supabase.removeChannel(subscription);

      console.log('✅ Real-time update tests completed\n');
      
    } catch (error) {
      this.recordTestResult('Real-time Updates', false, (error as Error).message);
    }
  }

  private async testAdminFunctions(): Promise<void> {
    console.log('🔧 Testing Admin Functions...');
    
    try {
      // Test admin message query (simulating admin panel)
      const { data: allMessages, error: adminError } = await supabase
        .from('conversation_messages')
        .select(`
          *,
          conversation:conversation_id (
            id,
            title
          ),
          sender:sender_id (
            email,
            raw_user_meta_data
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (adminError) {
        this.recordTestResult('Admin Message Query', false, adminError.message);
      } else {
        this.recordTestResult('Admin Message Query', true);
        console.log(`✅ Admin query returned ${allMessages?.length || 0} messages\n`);
      }

      // Test conversation statistics (admin dashboard)
      const { count: conversationCount, error: statsError } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true });

      if (statsError) {
        this.recordTestResult('Admin Statistics', false, statsError.message);
      } else {
        this.recordTestResult('Admin Statistics', true);
        console.log(`✅ Total conversations: ${conversationCount || 0}\n`);
      }
      
    } catch (error) {
      this.recordTestResult('Admin Functions', false, (error as Error).message);
    }
  }

  private recordTestResult(testName: string, passed: boolean, error?: string): void {
    this.testResults.push({ test: testName, passed, error });
    
    if (passed) {
      console.log(`✅ ${testName}: PASSED`);
    } else {
      console.log(`❌ ${testName}: FAILED${error ? ' - ' + error : ''}`);
    }
  }

  private generateTestReport(): void {
    console.log('\n📊 TEST EXECUTION REPORT');
    console.log('=' .repeat(50));
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${successRate.toFixed(2)}%`);
    
    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults
        .filter(r => !r.passed)
        .forEach(result => {
          console.log(`  - ${result.test}: ${result.error || 'No error message'}`);
        });
    }

    console.log('\n🎯 OVERALL RESULT:');
    if (successRate >= 90) {
      console.log('✅ EXCELLENT - Conversation system fully functional after legacy removal');
    } else if (successRate >= 80) {
      console.log('✅ GOOD - Conversation system mostly functional with minor issues');
    } else if (successRate >= 70) {
      console.log('⚠️  FAIR - Conversation system functional but requires attention');
    } else {
      console.log('❌ POOR - Conversation system has significant issues, review required');
    }

    console.log('\n📋 LEGACY REMOVAL VERIFICATION COMPLETE');
    console.log('=' .repeat(50));
  }
}

// Export for use in test scenarios
export default ConversationSystemTest;

// Usage example (would need proper setup in real environment):
// const test = new ConversationSystemTest();
// await test.runAllTests();