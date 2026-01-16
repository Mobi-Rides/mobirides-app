
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Using Key (length):', supabaseKey?.length);

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Testing conversation messages query (Manual 2-Step Fetch)...');

async function testQuery() {
    try {
        if (!supabaseUrl || !supabaseKey) {
            throw new Error(`Missing Env Vars: URL=${!!supabaseUrl}, KEY=${!!supabaseKey}`);
        }

        // Get a conversation ID that HAS replies
        console.log('Finding a conversation that has replies...');
        const { data: replyMsg, error: replyError } = await supabase
            .from('conversation_messages')
            .select('conversation_id')
            .not('reply_to_message_id', 'is', null)
            .limit(1);

        if (replyError) {
            console.error('Failed to find a reply:', replyError);
            return;
        }

        if (!replyMsg || replyMsg.length === 0) {
            console.error('❌ No replies found in ANY conversation.');
            return;
        }

        const conversationId = replyMsg[0].conversation_id;
        console.log('Using conversation ID:', conversationId);

        console.log('Step 1: Fetching messages (without embedding)...');
        const { data, error } = await supabase
            .from('conversation_messages')
            .select(`
          id,
          content,
          sender_id,
          reply_to_message_id,
          sender:profiles!sender_id (
            full_name
          )
        `)
            .eq('conversation_id', conversationId)
            .not('reply_to_message_id', 'is', null) // Only get replies for test
            .limit(1);

        if (error) {
            console.error('❌ Query Error:', JSON.stringify(error, null, 2));
        } else {
            console.log('✅ Step 1 Success. Count:', data?.length);
            if (data && data.length > 0) {
                const msg = data[0];
                console.log('Message ID:', msg.id);
                console.log('Reply To ID:', msg.reply_to_message_id);

                if (msg.reply_to_message_id) {
                    console.log('Step 2: Fetching referenced message directly...');
                    const { data: refMsg, error: refError } = await supabase
                        .from('conversation_messages')
                        .select(`
                            id, 
                            content, 
                            sender_id,
                            sender:profiles!sender_id (
                                full_name
                            )
                        `)
                        .eq('id', msg.reply_to_message_id)
                        .single();

                    if (refError) {
                        console.error('❌ Failed to fetch referenced message:', refError);
                    } else {
                        console.log('✅ Step 2 Success. Referenced message:', refMsg);
                        console.log('🎉 Sender Name:', refMsg.sender?.full_name);
                    }
                }
            } else {
                console.log('No reply messages found in this conversation to test.');
            }
        }
    } catch (err) {
        console.error('❌ Unexpected script error:', err);
    }
}

testQuery();
