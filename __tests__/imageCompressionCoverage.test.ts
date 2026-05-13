import { compressImage, formatFileSize, isImageFile } from "@/utils/imageCompression";

describe("imageCompression coverage", () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  const originalImage = global.Image;
  const originalCreateElement = document.createElement.bind(document);

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    global.Image = originalImage;
    document.createElement = originalCreateElement;
    jest.restoreAllMocks();
  });

  it("formats file sizes and identifies image files", () => {
    expect(formatFileSize(0)).toBe("0 Bytes");
    expect(formatFileSize(512)).toBe("512 Bytes");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5 MB");

    expect(isImageFile(new File(["x"], "photo.png", { type: "image/png" }))).toBe(true);
    expect(isImageFile(new File(["x"], "notes.txt", { type: "text/plain" }))).toBe(false);
  });

  it("returns the original file when it is already under the size limit", async () => {
    const file = new File(["small"], "small.jpg", { type: "image/jpeg" });

    await expect(compressImage(file, { maxSizeKB: 10 })).resolves.toBe(file);
  });

  it("compresses with canvas, preserves aspect ratio, and revokes object URLs", async () => {
    const drawImage = jest.fn();
    const toBlob = jest.fn((callback: BlobCallback) => {
      callback(new Blob(["compressed"], { type: "image/webp" }));
    });
    const canvas = {
      width: 0,
      height: 0,
      getContext: jest.fn(() => ({ drawImage })),
      toBlob,
    } as unknown as HTMLCanvasElement;

    jest.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "canvas") return canvas;
      return originalCreateElement(tagName);
    });
    URL.createObjectURL = jest.fn(() => "blob:source");
    URL.revokeObjectURL = jest.fn();

    class MockImage {
      width = 4000;
      height = 2000;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        this.onload?.();
      }
    }
    global.Image = MockImage as unknown as typeof Image;

    const file = new File([new Uint8Array(2 * 1024 * 1024)], "large.png", { type: "image/png" });
    const compressed = await compressImage(file, { maxWidth: 1000, maxHeight: 600, maxSizeKB: 1024, quality: 0.7 });

    expect(compressed.name).toBe("large.png");
    expect(compressed.type).toBe("image/webp");
    expect(canvas.width).toBe(1000);
    expect(canvas.height).toBe(500);
    expect(drawImage).toHaveBeenCalledWith(expect.any(MockImage), 0, 0, 1000, 500);
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), "image/png", 0.7);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:source");
  });

  it("rejects image load failures and missing compressed blobs", async () => {
    URL.createObjectURL = jest.fn(() => "blob:source");
    URL.revokeObjectURL = jest.fn();

    jest.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "canvas") {
        return {
          getContext: jest.fn(() => ({ drawImage: jest.fn() })),
          toBlob: jest.fn((callback: BlobCallback) => callback(null)),
        } as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tagName);
    });

    class ErrorImage {
      width = 10;
      height = 10;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        this.onerror?.();
      }
    }
    global.Image = ErrorImage as unknown as typeof Image;

    const file = new File([new Uint8Array(2 * 1024 * 1024)], "broken.jpg", { type: "image/jpeg" });
    await expect(compressImage(file, { maxSizeKB: 1 })).rejects.toThrow("Failed to load image");

    class LoadImage {
      width = 10;
      height = 10;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        this.onload?.();
      }
    }
    global.Image = LoadImage as unknown as typeof Image;

    await expect(compressImage(file, { maxSizeKB: 1 })).rejects.toThrow("Failed to compress image");
  });
});
