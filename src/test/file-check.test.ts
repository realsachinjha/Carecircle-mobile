import { describe, expect, it } from "vitest";
import { checkFileSize, detectFileType } from "@/lib/documents/file-check";

describe("file-check", () => {
  it("detects valid signatures", () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 1]);
    expect(detectFileType(png)).toBe("image/png");

    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);
    expect(detectFileType(jpeg)).toBe("image/jpeg");

    const pdf = new TextEncoder().encode("%PDF-1.7\n%some content");
    expect(detectFileType(pdf)).toBe("application/pdf");
  });

  it("rejects unknown and truncated signatures", () => {
    const exe = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]);
    expect(detectFileType(exe)).toBeNull();

    const gif = new TextEncoder().encode("GIF89a");
    expect(detectFileType(gif)).toBeNull();

    expect(detectFileType(new Uint8Array([]))).toBeNull();

    const truncatedPng = new Uint8Array([0x89, 0x50]);
    expect(detectFileType(truncatedPng)).toBeNull();
  });

  it("checks file size boundaries", () => {
    expect(checkFileSize(0)).toBe("FILE_EMPTY");
    expect(checkFileSize(-5)).toBe("FILE_EMPTY");
    expect(checkFileSize(10 * 1024 * 1024)).toBeNull();
    expect(checkFileSize(10 * 1024 * 1024 + 1)).toBe("FILE_TOO_LARGE");
  });
});
