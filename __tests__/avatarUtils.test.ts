import { getAvatarPublicUrl, getAvatarUrlWithFallback, getUserInitials } from "@/utils/avatarUtils";
import { supabase } from "@/integrations/supabase/client";

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    storage: {
      from: jest.fn(),
    },
  },
}));

describe("avatar utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null for blank avatar paths and preserves absolute URLs", () => {
    expect(getAvatarPublicUrl(null)).toBeNull();
    expect(getAvatarPublicUrl(undefined)).toBeNull();
    expect(getAvatarPublicUrl("   ")).toBeNull();

    const absoluteUrl = "https://cdn.example.com/avatar.png";
    expect(getAvatarPublicUrl(absoluteUrl)).toBe(absoluteUrl);
  });

  it("builds public avatar URLs through Supabase storage", () => {
    const storagePath = "users/avatar.png";
    const publicUrl = "https://project.supabase.co/storage/v1/object/public/avatars/users/avatar.png";
    (supabase.storage.from as jest.Mock).mockReturnValue({
      getPublicUrl: jest.fn(() => ({ data: { publicUrl } })),
    });

    expect(getAvatarPublicUrl(storagePath)).toBe(publicUrl);
    expect(supabase.storage.from).toHaveBeenCalledWith("avatars");
  });

  it("falls back when public URL generation fails", () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    (supabase.storage.from as jest.Mock).mockImplementation(() => {
      throw new Error("storage unavailable");
    });

    expect(getAvatarPublicUrl("users/avatar.png")).toBeNull();
    expect(getAvatarUrlWithFallback("users/avatar.png", "/fallback.svg")).toBe("/fallback.svg");
  });

  it("creates initials from single and multi-word names", () => {
    expect(getUserInitials(null)).toBe("?");
    expect(getUserInitials("")).toBe("?");
    expect(getUserInitials("modisa")).toBe("M");
    expect(getUserInitials("Modisa Maphanyane", 2)).toBe("MM");
    expect(getUserInitials("  first middle last  ", 3)).toBe("FML");
  });
});
