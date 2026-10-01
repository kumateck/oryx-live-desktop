import { expect, it } from "vitest";
import { userInitials } from "./user-display";

it("builds initials from the first and last name only", () => {
  expect(userInitials("Ada Mensah")).toBe("AM");
  expect(userInitials("  ada  kofi   mensah ")).toBe("AM");
  expect(userInitials("Ada")).toBe("A");
  expect(userInitials("   ")).toBe("");
});
