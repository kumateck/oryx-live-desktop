import { expect, it } from "vitest";
import { returnPath } from "./return-path";

it("returns only internal non-login paths", () => {
  expect(returnPath("/home?tab=tasks")).toBe("/home?tab=tasks");
  expect(returnPath("//evil.example")).toBe("/home");
  expect(returnPath("https://evil.example")).toBe("/home");
  expect(returnPath("/login")).toBe("/home");
  expect(returnPath("/\\evil.example")).toBe("/home");
});
