
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Use Service Role Key to bypass RLS for testing, or fallback to Anon Key (which might fail RLS)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/.env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testVoiceFeature() {
  console.log('🎤 Starting Voice Feature Backend Test...');

  try {
    // 1. Find a valid conversation and sender
    console.log('🔍 Finding a conversation...');
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        participants:conversation_participants(user_id)
      `)
      .limit(1);

    if (convError) throw new Error(`Failed to fetch conversations: ${convError.message}`);
    
    let conversation = conversations?.[0];
    let senderId: string | undefined;

    if (!conversation) {
      console.log('⚠️ No existing conversations found. Attempting to create one...');
      
      // Fetch 2 users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id')
        .limit(2);

      if (usersError || !users || users.length < 2) {
        throw new Error('Not enough users found to create a test conversation.');
      }

      const user1 = users[0].id;
      const user2 = users[1].id;
      
      // Create conversation via manual insert if needed
      const { data: manualConv, error: manualError } = await supabase
          .from('conversations')
          .insert({ type: 'direct' })
          .select()
          .single();
          
      if (manualError) throw manualError;
      
      await supabase.from('conversation_participants').insert([
          { conversation_id: manualConv.id, user_id: user1 },
          { conversation_id: manualConv.id, user_id: user2 }
      ]);
      
      conversation = manualConv;
      senderId = user1;
      console.log('✅ Created temporary test conversation');
    } else {
      senderId = conversation.participants[0]?.user_id;
    }
    
    if (!senderId) {
      console.warn('⚠️ Conversation has no participants.');
      return;
    }

    console.log(`✅ Found Conversation ID: ${conversation.id}`);
    console.log(`✅ Using Sender ID: ${senderId}`);

    // 2. Test Storage Upload
    console.log('\n📤 Testing Audio Upload...');
    const fileName = `test-audio-${Date.now()}.webm`;
    const filePath = `${senderId}/${fileName}`;
    
    const dummyContent = 'This is a test audio file content';
    const fileBody = Buffer.from(dummyContent, 'utf-8');

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(filePath, fileBody, {
        contentType: 'audio/webm',
        upsert: true
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
    console.log(`✅ Upload successful: ${uploadData?.path}`);

    const { data: { publicUrl } } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(filePath);
    
    console.log(`✅ Public URL generated: ${publicUrl}`);

    // 3. Test Database Insertion
    console.log('\n📝 Testing Database Insertion (message_type: "audio")...');
    const { data: msgData, error: msgError } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: senderId,
        content: 'Test Voice Message (Script)',
        message_type: 'audio',
        metadata: {
          url: publicUrl,
          duration: 5,
          fileName: fileName,
          fileSize: fileBody.length,
          mimeType: 'audio/webm'
        }
      })
      .select()
      .single();

    if (msgError) throw new Error(`Message insertion failed: ${msgError.message}`);
    
    if (msgData.message_type !== 'audio') {
      throw new Error(`Message type mismatch. Expected 'audio', got '${msgData.message_type}'`);
    }

    console.log(`✅ Message inserted successfully with ID: ${msgData.id}`);
    console.log(`✅ Verified message_type is 'audio'`);

    // 4. Cleanup
    console.log('\n🧹 Cleaning up...');
    
    const { error: delMsgError } = await supabase
      .from('conversation_messages')
      .delete()
      .eq('id', msgData.id);
    
    if (delMsgError) console.error(`⚠️ Failed to delete test message: ${delMsgError.message}`);
    else console.log('✅ Test message deleted');

    const { error: delFileError } = await supabase.storage
      .from('chat-attachments')
      .remove([filePath]);

    if (delFileError) console.error(`⚠️ Failed to delete test file: ${delFileError.message}`);
    else console.log('✅ Test file deleted');

    console.log('\n🎉 Voice Feature Backend Verification PASSED!');

  } catch (error: any) {
    console.error('\n❌ Test Failed:', error.message);
    process.exit(1);
  }
}

testVoiceFeature();
