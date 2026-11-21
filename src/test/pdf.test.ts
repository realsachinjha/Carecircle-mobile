import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { checkPdf } from "@/lib/documents/pdf";

describe("pdf checks", () => {
  it("validates page counts and invalid pdf structures", async () => {
    const doc1 = await PDFDocument.create();
    doc1.addPage();
    const bytes1 = await doc1.save();
    expect(await checkPdf(bytes1)).toBeNull();

    const doc5 = await PDFDocument.create();
    for (let i = 0; i < 5; i++) {
      doc5.addPage();
    }
    const bytes5 = await doc5.save();
    expect(await checkPdf(bytes5)).toBeNull();

    const doc6 = await PDFDocument.create();
    for (let i = 0; i < 6; i++) {
      doc6.addPage();
    }
    const bytes6 = await doc6.save();
    expect(await checkPdf(bytes6)).toBe("PDF_TOO_LONG");

    const corrupt = new TextEncoder().encode("%PDF-corrupt-data-not-a-real-pdf");
    expect(await checkPdf(corrupt)).toBe("UNSUPPORTED_FILE_TYPE");
  });
});
