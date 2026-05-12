import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useDebounce } from "@/hooks/useDebounce";

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("small hooks coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("debounces changing values", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 250),
      { initialProps: { value: "first" } }
    );

    expect(result.current).toBe("first");

    rerender({ value: "second" });
    expect(result.current).toBe("first");

    act(() => {
      jest.advanceTimersByTime(250);
    });
    expect(result.current).toBe("second");
  });

  it("executes successful async actions with callbacks and toast", async () => {
    const onSuccess = jest.fn();
    const action = jest.fn(async (value: string) => value.toUpperCase());
    const { result } = renderHook(() => useAsyncAction(action, {
      onSuccess,
      successMessage: "Done",
    }));

    let value: string | undefined;
    await act(async () => {
      value = await result.current.execute("ok");
    });

    expect(value).toBe("OK");
    expect(action).toHaveBeenCalledWith("ok");
    expect(onSuccess).toHaveBeenCalledWith("OK");
    expect(toast.success).toHaveBeenCalledWith("Done");
    expect(result.current.error).toBeNull();
  });

  it("captures async action errors with fallback error instances", async () => {
    const onError = jest.fn();
    const { result } = renderHook(() => useAsyncAction(async () => {
      throw "not-an-error";
    }, {
      onError,
      errorMessage: "Failed",
    }));

    let thrownError: unknown;
    await act(async () => {
      try {
        await result.current.execute();
      } catch (error) {
        thrownError = error;
      }
    });

    expect(thrownError).toEqual(expect.any(Error));
    expect((thrownError as Error).message).toBe("An unexpected error occurred");
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(toast.error).toHaveBeenCalledWith("Failed");

    act(() => {
      result.current.clearError();
    });
    expect(result.current.error).toBeNull();
  });
});
