import {
  ensureAuthenticatedOperation,
  getCurrentUser,
  validateConversationAccess,
  validateUserId,
} from "@/utils/authUtils";
import { supabase } from "@/integrations/supabase/client";

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      refreshSession: jest.fn(),
    },
    from: jest.fn(),
  },
}));

const sessionFor = (userId: string) => ({
  data: { session: { user: { id: userId, email: `${userId}@example.com` } } },
  error: null,
});

const noSession = {
  data: { session: null },
  error: null,
};

describe("auth utilities", () => {
  const userId = `user-${Math.random().toString(16).slice(2)}`;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("runs authenticated operations when a session exists", async () => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue(sessionFor(userId));
    const operation = jest.fn(async (user) => ({ userId: user.id }));

    const result = await ensureAuthenticatedOperation(operation, false);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ userId });
    expect(operation).toHaveBeenCalledWith(expect.objectContaining({ id: userId }));
  });

  it("blocks authenticated operations without a user session", async () => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue(noSession);

    const result = await ensureAuthenticatedOperation(jest.fn(), false);

    expect(result).toMatchObject({
      success: false,
      error: "User not authenticated",
    });
  });

  it("validates the current user id against the session", async () => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue(sessionFor(userId));

    await expect(validateUserId(userId)).resolves.toBe(true);
    await expect(validateUserId(`${userId}-different`)).resolves.toBe(false);
  });

  it("returns the current user or null when unavailable", async () => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce(sessionFor(userId));
    await expect(getCurrentUser()).resolves.toMatchObject({ id: userId });

    (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
      data: { session: null },
      error: { message: "session failed" },
    });
    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("validates conversation participant access without fixed participant row keys", async () => {
    const participantId = `participant-${Math.random().toString(16).slice(2)}`;
    const query = {
      select: jest.fn(() => query),
      eq: jest.fn(() => query),
      single: jest.fn(() => Promise.resolve({
        data: {
          id: participantId,
          user_id: userId,
          conversation_id: "conversation-under-test",
        },
        error: null,
      })),
    };
    (supabase.from as jest.Mock).mockReturnValue(query);

    const result = await validateConversationAccess("conversation-under-test", userId);

    expect(result).toEqual({
      hasAccess: true,
      participantId,
    });
    expect(query.eq).toHaveBeenCalledWith("user_id", userId);
  });

  it("returns a clear access error for missing participants", async () => {
    const query = {
      select: jest.fn(() => query),
      eq: jest.fn(() => query),
      single: jest.fn(() => Promise.resolve({
        data: null,
        error: { code: "PGRST116", message: "not found" },
      })),
    };
    (supabase.from as jest.Mock).mockReturnValue(query);

    await expect(validateConversationAccess("conversation-under-test", userId)).resolves.toMatchObject({
      hasAccess: false,
      error: "User is not a participant in this conversation",
    });
  });
});
