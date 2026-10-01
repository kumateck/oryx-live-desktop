import { expect, it } from "vitest";
import { isSafeEditorLink } from "./link-url";

it("accepts web, mail, and internal links while rejecting executable schemes", () => {
  expect(isSafeEditorLink("https://example.com/path")).toBe(true);
  expect(isSafeEditorLink("mailto:quality@example.com")).toBe(true);
  expect(isSafeEditorLink("/inventory/materials/2")).toBe(true);
  expect(isSafeEditorLink("javascript:alert(1)")).toBe(false);
  expect(isSafeEditorLink("//attacker.example/path")).toBe(false);
  expect(isSafeEditorLink("data:text/html,hello")).toBe(false);
});
