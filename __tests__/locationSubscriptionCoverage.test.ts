import {
  broadcastLocationUpdate,
  subscribeToLocationUpdates,
  unsubscribeFromLocationUpdates,
} from "@/services/locationSubscription";
import { supabase } from "@/integrations/supabase/client";
import { eventBus } from "@/utils/mapbox/core/eventBus";
import { toast } from "sonner";

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    channel: jest.fn(),
  },
}));

jest.mock("@/utils/mapbox/core/eventBus", () => ({
  eventBus: {
    emit: jest.fn(),
  },
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
  },
}));

const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

const makeChannel = () => {
  const handlers: Array<{ kind: string; filter: unknown; callback: Function }> = [];
  const channel = {
    on: jest.fn((kind: string, filter: unknown, callback: Function) => {
      handlers.push({ kind, filter, callback });
      return channel;
    }),
    subscribe: jest.fn((callback: Function) => {
      Promise.resolve().then(() => callback("SUBSCRIBED"));
      return channel;
    }),
    track: jest.fn().mockResolvedValue(undefined),
    presenceState: jest.fn(() => ({ present: [] })),
    unsubscribe: jest.fn(),
    send: jest.fn().mockResolvedValue(undefined),
    handlers,
  };
  return channel;
};

describe("locationSubscription coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("requires authentication before subscribing to location updates", async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null } });

    await subscribeToLocationUpdates(makeId("car"));

    expect(supabase.channel).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("You must be logged in to subscribe to location updates");
  });

  it("subscribes, tracks presence, and emits incoming broadcast updates", async () => {
    const carId = makeId("car");
    const userId = makeId("user");
    const channel = makeChannel();
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: userId } } });
    (supabase.channel as jest.Mock).mockReturnValue(channel);

    await subscribeToLocationUpdates(carId);
    await Promise.resolve();

    expect(supabase.channel).toHaveBeenCalledWith(`car-location-${carId}`);
    expect(channel.track).toHaveBeenCalledWith(expect.objectContaining({ user_id: userId }));

    const broadcastHandler = channel.handlers.find((handler) => handler.kind === "broadcast")?.callback;
    broadcastHandler?.({
      payload: {
        carId,
        userId,
        latitude: -24.6,
        longitude: 25.9,
        accuracy: 8,
        timestamp: "2099-01-01T00:00:00.000Z",
        scope: "all",
      },
    });

    expect(eventBus.emit).toHaveBeenCalledWith(expect.objectContaining({
      type: "realtimeLocationUpdate",
      payload: expect.objectContaining({
        carId,
        userId,
        location: { latitude: -24.6, longitude: 25.9, accuracy: 8 },
      }),
    }));

    unsubscribeFromLocationUpdates(carId);
  });

  it("broadcasts only for the user that owns the active subscription", async () => {
    const carId = makeId("car");
    const userId = makeId("user");
    const channel = makeChannel();
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: userId } } });
    (supabase.channel as jest.Mock).mockReturnValue(channel);

    await subscribeToLocationUpdates(carId);
    await Promise.resolve();
    await broadcastLocationUpdate({ latitude: -24.7, longitude: 25.8, accuracy: 5 } as any, carId);

    expect(channel.send).toHaveBeenCalledWith({
      type: "broadcast",
      event: "location-update",
      payload: expect.objectContaining({
        carId,
        userId,
        latitude: -24.7,
        longitude: 25.8,
        accuracy: 5,
        scope: "all",
      }),
    });

    unsubscribeFromLocationUpdates(carId);
  });

  it("unsubscribes active channels and ignores missing channels", async () => {
    const carId = makeId("car");
    const channel = makeChannel();
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: makeId("user") } } });
    (supabase.channel as jest.Mock).mockReturnValue(channel);

    await subscribeToLocationUpdates(carId);
    await Promise.resolve();
    unsubscribeFromLocationUpdates(carId);
    unsubscribeFromLocationUpdates(makeId("missing-car"));

    expect(channel.unsubscribe).toHaveBeenCalledTimes(1);
  });
});
