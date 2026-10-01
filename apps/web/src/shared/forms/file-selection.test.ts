// @vitest-environment jsdom
import { expect, it } from "vitest";
import { acceptsFile, mergeFiles } from "./file-selection";

it("checks MIME, extension, and byte limits before accepting uploads", () => {
  const image = new File(["abc"], "photo.PNG", { type: "image/png" });
  expect(acceptsFile(image, "image/*", 3)).toBe(true);
  expect(acceptsFile(image, ".png", 2)).toBe(false);
  expect(acceptsFile(image, "application/pdf")).toBe(false);
});

it("keeps selected files stable when the same file is chosen again", () => {
  const first = new File(["a"], "one.pdf", { type: "application/pdf" });
  const second = new File(["b"], "two.pdf", { type: "application/pdf" });
  expect(mergeFiles([first], [first, second])).toEqual([first, second]);
});
