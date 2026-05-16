import React, { PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockUseAuth = jest.fn();
const mockSupabase = {
  from: jest.fn(),
  channel: jest.fn(),
};

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/integrations/supabase/client", () => ({
  supabase: mockSupabase,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const guideQuery = (response: unknown) => {
  const query = {
    select: jest.fn(),
    in: jest.fn(),
    eq: jest.fn(),
    or: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    then: (resolve: (value: unknown) => unknown, reject: (reason?: unknown) => unknown) =>
      Promise.resolve(response).then(resolve, reject),
  };

  query.select.mockReturnValue(query);
  query.in.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.or.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.limit.mockResolvedValue(response);

  return query;
};

describe("guide, presence, and auth prompt hook coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: "user-1" } });
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    jest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows and hides auth prompts only for anonymous users", async () => {
    const { useAuthPrompt } = await import("@/hooks/useAuthPrompt");
    const config = {
      title: "Sign in",
      description: "Required",
      feature: "saved cars",
      benefits: ["Save cars"],
      primaryAction: "signin" as const,
    };

    mockUseAuth.mockReturnValue({ user: null });
    const anonymous = renderHook(() => useAuthPrompt());

    act(() => {
      expect(anonymous.result.current.showAuthPrompt(config)).toBe(true);
    });
    expect(anonymous.result.current.isPromptOpen).toBe(true);
    expect(anonymous.result.current.promptConfig).toEqual(config);
    expect(anonymous.result.current.isAuthenticated).toBe(false);

    act(() => {
      anonymous.result.current.hideAuthPrompt();
    });
    expect(anonymous.result.current.isPromptOpen).toBe(false);
    expect(anonymous.result.current.promptConfig).toBeNull();

    mockUseAuth.mockReturnValue({ user: { id: "user-1" } });
    const authenticated = renderHook(() => useAuthPrompt());
    act(() => {
      expect(authenticated.result.current.showAuthPrompt(config)).toBe(false);
    });
    expect(authenticated.result.current.isPromptOpen).toBe(false);
    expect(authenticated.result.current.isAuthenticated).toBe(true);
  });

  it("fetches guide lists, popular guides, and search results", async () => {
    const { useGuides, usePopularGuides, useSearchGuides } = await import("@/hooks/useGuides");
    const rows = [
      {
        id: "guide-1",
        title: "Pickup",
        description: "How pickup works",
        section: "bookings",
        read_time: "2 min",
        is_popular: true,
        sort_order: 1,
      },
    ];

    const guides = guideQuery({ data: rows, error: null });
    mockSupabase.from.mockReturnValueOnce(guides);
    const guidesHook = renderHook(() => useGuides("renter"), { wrapper: createWrapper() });
    await waitFor(() => expect(guidesHook.result.current.isSuccess).toBe(true));
    expect(guidesHook.result.current.data).toEqual(rows);
    expect(guides.in).toHaveBeenCalledWith("role", ["renter", "shared"]);
    expect(guides.order).toHaveBeenCalledWith("sort_order", { ascending: true });

    const popular = guideQuery({ data: rows, error: null });
    mockSupabase.from.mockReturnValueOnce(popular);
    const popularHook = renderHook(() => usePopularGuides("host"), { wrapper: createWrapper() });
    await waitFor(() => expect(popularHook.result.current.isSuccess).toBe(true));
    expect(popular.eq).toHaveBeenCalledWith("is_popular", true);
    expect(popular.in).toHaveBeenCalledWith("role", ["host", "shared"]);
    expect(popular.limit).toHaveBeenCalledWith(4);

    const search = guideQuery({ data: rows, error: null });
    mockSupabase.from.mockReturnValueOnce(search);
    const searchHook = renderHook(() => useSearchGuides("pickup", "renter"), { wrapper: createWrapper() });
    await waitFor(() => expect(searchHook.result.current.isSuccess).toBe(true));
    expect(search.or).toHaveBeenCalledWith("title.ilike.%pickup%,description.ilike.%pickup%");
  });

  it("surfaces guide query errors and keeps blank searches disabled", async () => {
    const { useGuides, useSearchGuides } = await import("@/hooks/useGuides");
    const failing = guideQuery({ data: null, error: new Error("guides failed") });
    mockSupabase.from.mockReturnValueOnce(failing);

    const failingHook = renderHook(() => useGuides("host"), { wrapper: createWrapper() });
    await waitFor(() => expect(failingHook.result.current.isError).toBe(true));
    expect(failingHook.result.current.error).toEqual(new Error("guides failed"));

    const disabledSearch = renderHook(() => useSearchGuides("", "host"), { wrapper: createWrapper() });
    expect(disabledSearch.result.current.fetchStatus).toBe("idle");
    expect(mockSupabase.from).toHaveBeenCalledTimes(1);
  });

  it("tracks presence sync, join, leave, and cleanup events", async () => {
    const { usePresence } = await import("@/hooks/usePresence");
    const handlers: Record<string, (payload?: any) => void> = {};
    const channel = {
      on: jest.fn((type: string, filter: { event: string }, handler: (payload?: any) => void) => {
        handlers[`${type}:${filter.event}`] = handler;
        return channel;
      }),
      subscribe: jest.fn((callback: (status: string) => void) => {
        callback("SUBSCRIBED");
        return channel;
      }),
      track: jest.fn().mockResolvedValue(undefined),
      presenceState: jest.fn(() => ({ "user-1": [{}], "user-2": [{}] })),
      unsubscribe: jest.fn(),
    };
    mockSupabase.channel.mockReturnValue(channel);

    const { result, unmount } = renderHook(() => usePresence("conversation-1", "user-1"));

    await waitFor(() => expect(channel.track).toHaveBeenCalledWith({ online_at: expect.any(String) }));
    expect(mockSupabase.channel).toHaveBeenCalledWith("presence-conversation-1", {
      config: { presence: { key: "user-1" } },
    });

    act(() => {
      handlers["presence:sync"]();
    });
    expect(Array.from(result.current.onlineUsers)).toEqual(["user-1", "user-2"]);

    act(() => {
      handlers["presence:join"]({ key: "user-3", newPresences: [{}] });
    });
    expect(result.current.onlineUsers.has("user-3")).toBe(true);

    act(() => {
      handlers["presence:leave"]({ key: "user-2", leftPresences: [{}] });
    });
    expect(result.current.onlineUsers.has("user-2")).toBe(false);

    unmount();
    expect(channel.unsubscribe).toHaveBeenCalledTimes(1);

    renderHook(() => usePresence(undefined, "user-1"));
    expect(mockSupabase.channel).toHaveBeenCalledTimes(1);
  });
});
