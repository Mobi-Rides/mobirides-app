import { ChatMigrationService, chatMigrationService } from "@/services/chatMigrationService";
import { assignUserRole, listAdminCapabilities, listUserRoles } from "@/services/superAdminService";
import { supabase } from "@/integrations/supabase/client";

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe("chat migration and super admin service coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("keeps the retired chat migration API as no-op behavior", async () => {
    await expect(ChatMigrationService.hasMigratedMessages("user-1")).resolves.toBe(false);
    await expect(ChatMigrationService.getUnmigratedMessageCount("user-1")).resolves.toBe(0);
    await expect(ChatMigrationService.triggerUserMigration("user-1")).resolves.toBe(false);
    await expect(ChatMigrationService.createConversationFromLegacyMessage("user-1", "host-1")).resolves.toBeNull();
    await expect(ChatMigrationService.getMigrationStatus("user-1")).resolves.toEqual({
      isMigrated: true,
      unmigratedCount: 0,
      shouldUseLegacy: false,
      recommendation: "Legacy migration retired.",
    });
    expect(chatMigrationService).toBeInstanceOf(ChatMigrationService);
  });

  it("lists user roles and admin capabilities with empty fallbacks", async () => {
    const roles = [{ user_id: "user-1", role: "admin", assigned_by: "owner-1", created_at: "2026-05-12" }];
    const capabilities = [{ admin_id: "admin-1", capability: "reports", created_at: "2026-05-12" }];

    (supabase.from as jest.Mock)
      .mockReturnValueOnce({ select: jest.fn().mockResolvedValue({ data: roles }) })
      .mockReturnValueOnce({ select: jest.fn().mockResolvedValue({ data: null }) })
      .mockReturnValueOnce({ select: jest.fn().mockResolvedValue({ data: capabilities }) })
      .mockReturnValueOnce({ select: jest.fn().mockResolvedValue({ data: undefined }) });

    await expect(listUserRoles()).resolves.toEqual(roles);
    await expect(listUserRoles()).resolves.toEqual([]);
    await expect(listAdminCapabilities()).resolves.toEqual(capabilities);
    await expect(listAdminCapabilities()).resolves.toEqual([]);
  });

  it("assigns user roles through the upsert chain and returns data with errors", async () => {
    const inserted = { user_id: "user-1", role: "admin" };
    const firstSingle = jest.fn().mockResolvedValue({ data: inserted, error: null });
    const firstSelect = jest.fn().mockReturnValue({ single: firstSingle });
    const firstUpsert = jest.fn().mockReturnValue({ select: firstSelect });

    const error = new Error("role denied");
    const secondSingle = jest.fn().mockResolvedValue({ data: null, error });
    const secondSelect = jest.fn().mockReturnValue({ single: secondSingle });
    const secondUpsert = jest.fn().mockReturnValue({ select: secondSelect });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce({ upsert: firstUpsert })
      .mockReturnValueOnce({ upsert: secondUpsert });

    await expect(assignUserRole("user-1", "admin" as never)).resolves.toEqual({ data: inserted, error: null });
    expect(supabase.from).toHaveBeenCalledWith("user_roles");
    expect(firstUpsert).toHaveBeenCalledWith({ user_id: "user-1", role: "admin" });
    expect(firstSelect).toHaveBeenCalledTimes(1);
    expect(firstSingle).toHaveBeenCalledTimes(1);

    await expect(assignUserRole("user-2", "moderator" as never)).resolves.toEqual({ data: null, error });
    expect(secondUpsert).toHaveBeenCalledWith({ user_id: "user-2", role: "moderator" });
  });
});
