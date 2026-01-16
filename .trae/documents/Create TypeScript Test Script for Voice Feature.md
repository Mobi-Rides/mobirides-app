I will create a TypeScript script `scripts/test-voice-feature.ts` to verify the backend support for voice messages (Database and Storage).

### **Plan: Create Voice Feature Test Script**

1.  **Create Script File**: `scripts/test-voice-feature.ts`
2.  **Dependencies**: Use `dotenv` for environment variables and `@supabase/supabase-js` for API interaction.
3.  **Script Logic**:
    *   **Setup**: Initialize Supabase client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
    *   **Prerequisite**: Dynamically find an existing `conversation_id` and `sender_id` (participant) to use for the test. If none found, abort with a clear message.
    *   **Test 1: Storage Upload**:
        *   Create a dummy audio buffer (mock `.webm` file).
        *   Upload it to `chat-attachments/test-audio-[timestamp].webm`.
        *   **Verify**: Check for upload errors and retrieve the public URL.
    *   **Test 2: Message Insertion**:
        *   Insert a new message into `conversation_messages` with:
            *   `conversation_id`: (Found above)
            *   `sender_id`: (Found above)
            *   `content`: "Test Voice Message [Timestamp]"
            *   `type`: "audio"
            *   `metadata`: `{ url: publicUrl, duration: 5 }`
        *   **Verify**: Ensure the insertion succeeds (confirming the database constraint allows `'audio'`).
    *   **Cleanup**:
        *   Delete the test message from the database.
        *   Delete the test file from storage.
    *   **Reporting**: Log "✅ Voice feature backend verification passed" if all steps succeed.

### **Execution**
After creating the script, I will run it using:
`npx ts-node scripts/test-voice-feature.ts`
