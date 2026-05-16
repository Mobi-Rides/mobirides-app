import { toast } from "@/utils/toast-utils";
import { toast as sonnerToast } from "sonner";
import { toast as shadcnToast } from "@/hooks/use-toast";

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    loading: jest.fn(() => "loading-id"),
    promise: jest.fn(),
    dismiss: jest.fn(),
  },
}));

jest.mock("@/hooks/use-toast", () => ({
  toast: jest.fn(() => ({ id: "custom-toast" })),
  useToast: jest.fn(),
}));

describe("toast utility facade", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("delegates common toast variants with default and custom durations", () => {
    toast.success("Saved");
    toast.error("Failed", { duration: 1000 });
    toast.info("Heads up");
    toast.warning("Careful");

    expect(sonnerToast.success).toHaveBeenCalledWith("Saved", { duration: 4000 });
    expect(sonnerToast.error).toHaveBeenCalledWith("Failed", { duration: 1000 });
    expect(sonnerToast.info).toHaveBeenCalledWith("Heads up", { duration: 4000 });
    expect(sonnerToast.warning).toHaveBeenCalledWith("Careful", { duration: 5000 });
  });

  it("delegates loading, promise, dismiss, and custom shadcn toasts", () => {
    const promise = Promise.resolve("done");
    const messages = {
      loading: "Loading",
      success: "Done",
      error: "Failed",
    };

    expect(toast.loading("Loading")).toBe("loading-id");
    toast.promise(promise, messages);
    toast.dismiss("loading-id");
    const customResult = toast.custom({
      title: "Title",
      description: "Description",
      variant: "destructive",
      duration: 1234,
    });

    expect(sonnerToast.promise).toHaveBeenCalledWith(promise, messages);
    expect(sonnerToast.dismiss).toHaveBeenCalledWith("loading-id");
    expect(shadcnToast).toHaveBeenCalledWith({
      title: "Title",
      description: "Description",
      variant: "destructive",
      action: undefined,
      duration: 1234,
    });
    expect(customResult).toEqual({ id: "custom-toast" });
  });
});
