import { expect, it } from "vitest";
import { testReference } from "./test-reference";

it("lists each reference a test's questions cite once, in order, or a dash when none is recorded", () => {
  expect(testReference([{ question: { reference: "BP 2024" } }, { question: { reference: " BP 2024 " } }, { question: { reference: "In-house" } }])).toBe("BP 2024; In-house");
  expect(testReference([{ question: { reference: null } }, { question: null }])).toBe("–");
  expect(testReference(null)).toBe("–");
});
