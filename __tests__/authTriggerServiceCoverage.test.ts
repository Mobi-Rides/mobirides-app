describe("AuthTriggerService coverage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetModules();
    localStorage.clear();
    jest.spyOn(window, "dispatchEvent");
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    localStorage.clear();
  });

  const loadService = async () => (await import("@/services/authTriggerService")).default;

  it("stores, reads, clears, and ignores malformed pending actions", async () => {
    const AuthTriggerService = await loadService();

    AuthTriggerService.storePendingAction({
      type: "booking",
      payload: { bookingId: "booking-1" },
      context: "checkout",
    });

    expect(AuthTriggerService.getPendingAction()).toEqual({
      type: "booking",
      payload: { bookingId: "booking-1" },
      context: "checkout",
    });

    AuthTriggerService.clearPendingAction();
    expect(AuthTriggerService.getPendingAction()).toBeNull();

    localStorage.setItem("pending_auth_action", "{bad-json");
    expect(AuthTriggerService.getPendingAction()).toBeNull();
  });

  it.each([
    ["booking", "execute-booking"],
    ["save_car", "execute-save-car"],
    ["contact_host", "execute-contact-host"],
  ] as const)("dispatches a %s pending action once per auth session", async (type, eventName) => {
    const AuthTriggerService = await loadService();
    AuthTriggerService.storePendingAction({ type, payload: { id: "entity-1" } });

    const resultPromise = AuthTriggerService.executePendingAction("session-1");
    jest.advanceTimersByTime(300);

    await expect(resultPromise).resolves.toBe(true);
    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: eventName,
        detail: { id: "entity-1" },
      }),
    );
    expect(AuthTriggerService.getPendingAction()).toBeNull();

    AuthTriggerService.storePendingAction({ type, payload: { id: "entity-1" } });
    await expect(AuthTriggerService.executePendingAction("session-1")).resolves.toBe(false);
  });

  it("rate limits rapid executions and can clear session tracking", async () => {
    const AuthTriggerService = await loadService();

    AuthTriggerService.storePendingAction({ type: "booking", payload: { id: "first" } });
    const first = AuthTriggerService.executePendingAction("session-1");
    jest.advanceTimersByTime(300);
    await expect(first).resolves.toBe(true);

    AuthTriggerService.storePendingAction({ type: "booking", payload: { id: "second" } });
    await expect(AuthTriggerService.executePendingAction("session-2")).resolves.toBe(false);

    AuthTriggerService.clearSessionTracker();
    jest.advanceTimersByTime(5000);
    const second = AuthTriggerService.executePendingAction("session-2");
    jest.advanceTimersByTime(300);
    await expect(second).resolves.toBe(true);
  });

  it("returns false when there is no pending action", async () => {
    const AuthTriggerService = await loadService();

    await expect(AuthTriggerService.executePendingAction("session-1")).resolves.toBe(false);
  });
});
