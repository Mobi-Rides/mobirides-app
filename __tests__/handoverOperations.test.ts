import {
  markUserReady,
  subscribeToHandoverUpdates,
  updateHandoverLocation,
} from "../src/services/handoverService";

jest.mock("@/utils/toast-utils", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
  },
}));

const makeMutationChain = (result: { data: unknown; error: unknown }) => {
  const chain: any = {
    eq: jest.fn(() => chain),
    then: (onFulfilled: (value: { data: unknown; error: unknown }) => unknown) =>
      Promise.resolve(result).then(onFulfilled),
  };
  return chain;
};

jest.mock("@/integrations/supabase/client", () => {
  const subscribeMock = jest.fn();
  const onMock = jest.fn();
  const unsubscribeMock = jest.fn();

  const channelMock = {
    on: onMock,
    subscribe: subscribeMock,
    unsubscribe: unsubscribeMock,
  };

  onMock.mockImplementation((_event: string, _filter: unknown, _cb: unknown) => channelMock);
  subscribeMock.mockImplementation((_cb: unknown) => channelMock);

  return {
    supabase: {
      from: jest.fn(),
      channel: jest.fn(() => channelMock),
      auth: {
        getUser: jest.fn(),
      },
      rpc: jest.fn(),
    },
  };
});

import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/utils/toast-utils";

describe("handover operations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates host location successfully", async () => {
    const updateChain = makeMutationChain({ data: null, error: null });
    const fromChain: any = {
      update: jest.fn(() => updateChain),
    };

    (supabase.from as jest.Mock).mockReturnValue(fromChain);

    const result = await updateHandoverLocation("handover-1", "host-1", true, {
      latitude: -24.6,
      longitude: 25.9,
      address: "Gaborone",
      timestamp: Date.now(),
    });

    expect(result).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith("handover_sessions");
    expect(fromChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ host_location: expect.any(Object), updated_at: expect.any(String) }),
    );
    expect(updateChain.eq).toHaveBeenCalledWith("id", "handover-1");
    expect(updateChain.eq).toHaveBeenCalledWith("host_id", "host-1");
  });

  it("returns false and toasts when renter location update fails", async () => {
    const updateChain = makeMutationChain({ data: null, error: new Error("db-fail") });
    const fromChain: any = {
      update: jest.fn(() => updateChain),
    };

    (supabase.from as jest.Mock).mockReturnValue(fromChain);

    const result = await updateHandoverLocation("handover-2", "renter-2", false, {
      latitude: -24.7,
      longitude: 25.8,
      address: "Francistown",
      timestamp: Date.now(),
    });

    expect(result).toBe(false);
    expect(toast.error).toHaveBeenCalledWith("Failed to update your location");
    expect(updateChain.eq).toHaveBeenCalledWith("renter_id", "renter-2");
  });

  it("marks host ready successfully", async () => {
    const updateChain = makeMutationChain({ data: null, error: null });
    const fromChain: any = {
      update: jest.fn(() => updateChain),
    };

    (supabase.from as jest.Mock).mockReturnValue(fromChain);

    const result = await markUserReady("handover-3", "host-3", true);

    expect(result).toBe(true);
    expect(fromChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ host_ready: true, updated_at: expect.any(String) }),
    );
    expect(updateChain.eq).toHaveBeenCalledWith("host_id", "host-3");
  });

  it("returns false and toasts when mark ready fails", async () => {
    const updateChain = makeMutationChain({ data: null, error: new Error("write failed") });
    const fromChain: any = {
      update: jest.fn(() => updateChain),
    };

    (supabase.from as jest.Mock).mockReturnValue(fromChain);

    const result = await markUserReady("handover-4", "renter-4", false);

    expect(result).toBe(false);
    expect(toast.error).toHaveBeenCalledWith("Failed to update your status");
  });

  it("subscribes, emits updates, and unsubscribes channels", () => {
    const payloadHandler: { current?: (payload: { new: unknown }) => void } = {};
    const statusHandler: { current?: (status: string) => void } = {};
    const unsubscribeMock = jest.fn();

    const channelMock = {
      on: jest.fn((_event: string, _filter: unknown, cb: (payload: { new: unknown }) => void) => {
        payloadHandler.current = cb;
        return channelMock;
      }),
      subscribe: jest.fn((cb: (status: string) => void) => {
        statusHandler.current = cb;
        cb("SUBSCRIBED");
        return channelMock;
      }),
      unsubscribe: unsubscribeMock,
    };

    (supabase.channel as jest.Mock).mockReturnValue(channelMock);

    const onUpdate = jest.fn();
    const unsubscribeFirst = subscribeToHandoverUpdates("handover-5", onUpdate);

    payloadHandler.current?.({ new: { id: "handover-5", host_ready: true } });
    expect(onUpdate).toHaveBeenCalledWith({ id: "handover-5", host_ready: true });

    const unsubscribeSecond = subscribeToHandoverUpdates("handover-6", onUpdate);
    expect(unsubscribeMock).toHaveBeenCalledTimes(1);

    statusHandler.current?.("CHANNEL_ERROR");

    unsubscribeFirst();
    unsubscribeSecond();
    expect(unsubscribeMock).toHaveBeenCalledTimes(3);
  });
});