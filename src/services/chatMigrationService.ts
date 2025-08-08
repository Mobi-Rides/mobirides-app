import { supabase } from "@/integrations/supabase/client";

/**
 * Service to handle migration from legacy message system to conversation system
 */
export class ChatMigrationService {
  /**
   * Check if user has migrated messages
   */
  static async hasMigratedMessages(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, migrated_to_conversation_id')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .not('migrated_to_conversation_id', 'is', null)
        .limit(1);

      if (error) {
        console.error('Error checking migration status:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error in hasMigratedMessages:', error);
      return false;
    }
  }

  /**
   * Get count of unmigrated messages for user
   */
  static async getUnmigratedMessageCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .is('migrated_to_conversation_id', null);

      if (error) {
        console.error('Error getting unmigrated count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getUnmigratedMessageCount:', error);
      return 0;
    }
  }

  /**
   * Trigger manual migration for a user's messages
   * This calls the database function to migrate legacy messages
   */
  static async triggerUserMigration(userId: string): Promise<boolean> {
    try {
      // Call the migration function
      const { error } = await supabase.rpc('migrate_legacy_messages_to_conversations');

      if (error) {
        console.error('Error triggering migration:', error);
        return false;
      }

      console.log('Migration triggered successfully for user:', userId);
      return true;
    } catch (error) {
      console.error('Error in triggerUserMigration:', error);
      return false;
    }
  }

  /**
   * Create a conversation directly from legacy message participants
   */
  static async createConversationFromLegacyMessage(
    senderId: string, 
    receiverId: string
  ): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Create new conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          type: 'direct',
          created_by: senderId
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        return null;
      }

      // Add participants
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: conversation.id, user_id: senderId },
          { conversation_id: conversation.id, user_id: receiverId }
        ]);

      if (participantsError) {
        console.error('Error adding participants:', participantsError);
        return null;
      }

      return conversation.id;
    } catch (error) {
      console.error('Error in createConversationFromLegacyMessage:', error);
      return null;
    }
  }

  /**
   * Check migration status and return guidance
   */
  static async getMigrationStatus(userId: string): Promise<{
    isMigrated: boolean;
    unmigratedCount: number;
    shouldUseLegacy: boolean;
    recommendation: string;
  }> {
    const [isMigrated, unmigratedCount] = await Promise.all([
      this.hasMigratedMessages(userId),
      this.getUnmigratedMessageCount(userId)
    ]);

    const shouldUseLegacy = !isMigrated && unmigratedCount > 0;

    let recommendation = '';
    if (shouldUseLegacy) {
      recommendation = `You have ${unmigratedCount} legacy messages. Consider migrating to the new conversation system.`;
    } else if (isMigrated) {
      recommendation = 'Your messages have been migrated to the new conversation system.';
    } else {
      recommendation = 'You can start using the new conversation system directly.';
    }

    return {
      isMigrated,
      unmigratedCount,
      shouldUseLegacy,
      recommendation
    };
  }
}

export const chatMigrationService = new ChatMigrationService();