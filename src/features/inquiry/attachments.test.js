import { describe, expect, it } from "vitest";
import { addFiles, formatSize, MAX_BYTES, MAX_FILES } from "./attachments";

const file = (name, type, size = 1000) => ({ name, type, size });

describe("addFiles", () => {
  it("accepts PDF, JPG, PNG and WebP", () => {
    const { files, error } = addFiles([], [file("a.pdf", "application/pdf"), file("b.jpg", "image/jpeg"), file("c.png", "image/png")]);
    expect(files).toHaveLength(3);
    expect(error).toBe("");
    expect(addFiles([], [file("d.webp", "image/webp")]).files).toHaveLength(1);
  });

  it("accepts a known extension when the browser gives no type", () => {
    expect(addFiles([], [file("menu.PDF", "")]).files).toHaveLength(1);
    expect(addFiles([], [file("menu.exe", "")]).files).toHaveLength(0);
  });

  it("refuses other types and says why", () => {
    const { files, error } = addFiles([], [file("a.gif", "image/gif"), file("b.docx", "application/msword"), file("c.html", "text/html")]);
    expect(files).toHaveLength(0);
    expect(error).toContain("a.gif is not a PDF, JPG, PNG or WebP file.");
    expect(error).toContain("b.docx");
  });

  it("refuses a file over 5 MB and an empty file", () => {
    const { files, error } = addFiles([], [file("big.pdf", "application/pdf", MAX_BYTES + 1), file("empty.pdf", "application/pdf", 0)]);
    expect(files).toHaveLength(0);
    expect(error).toContain("big.pdf is larger than 5.0 MB.");
    expect(error).toContain("empty.pdf is empty.");
    expect(addFiles([], [file("edge.pdf", "application/pdf", MAX_BYTES)]).files).toHaveLength(1);
  });

  it("stops at the limit and keeps the files that fit", () => {
    const four = [1, 2, 3, 4].map((n) => file(`m${n}.pdf`, "application/pdf", n * 100));
    const { files, error } = addFiles([], four);
    expect(files).toHaveLength(MAX_FILES);
    expect(files.map((f) => f.name)).toEqual(["m1.pdf", "m2.pdf", "m3.pdf"]);
    expect(error).toBe("You can add up to 3 files.");
  });

  it("counts files already picked and ignores a repeat", () => {
    const first = addFiles([], [file("m1.pdf", "application/pdf")]).files;
    const again = addFiles(first, [file("m1.pdf", "application/pdf"), file("m2.pdf", "application/pdf")]);
    expect(again.files.map((f) => f.name)).toEqual(["m1.pdf", "m2.pdf"]);
    expect(again.error).toContain("already added");
  });

  it("does not change the list it was given", () => {
    const current = [file("m1.pdf", "application/pdf")];
    addFiles(current, [file("m2.pdf", "application/pdf")]);
    expect(current).toHaveLength(1);
  });
});

describe("formatSize", () => {
  it("uses KB below a megabyte and MB above", () => {
    expect(formatSize(500)).toBe("1 KB");
    expect(formatSize(2048)).toBe("2 KB");
    expect(formatSize(1.5 * 1024 * 1024)).toBe("1.5 MB");
  });
});
