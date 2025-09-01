// Deprecated ChatMigrationService stub
// The legacy migration logic has been retired. This file keeps the same API surface
// but implements no-op behavior to avoid runtime calls to the `messages` table.
export class ChatMigrationService {
  static async hasMigratedMessages(_: string): Promise<boolean> {
    return false;
  }

  static async getUnmigratedMessageCount(_: string): Promise<number> {
    return 0;
  }

  static async triggerUserMigration(_: string): Promise<boolean> {
    // No-op: migration handled via DB migration scripts. Return false to indicate
    // no action taken.
    return false;
  }

  static async createConversationFromLegacyMessage(_: string, __: string): Promise<string | null> {
    return null;
  }

  static async getMigrationStatus(_: string) {
    return {
      isMigrated: true,
      unmigratedCount: 0,
      shouldUseLegacy: false,
      recommendation: 'Legacy migration retired.'
    };
  }
}

export const chatMigrationService = new ChatMigrationService();