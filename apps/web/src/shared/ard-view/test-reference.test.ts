import { expect, it } from "vitest";
import { testReference } from "./test-reference";

it("lists each reference a test's questions cite once, in order, or a dash when none is recorded", () => {
  expect(testReference([{ question: { reference: "BP 2024" } }, { question: { reference: " BP 2024 " } }, { question: { reference: "In-house" } }])).toBe("BP 2024; In-house");
  expect(testReference([{ question: { reference: null } }, { question: null }])).toBe("–");
  expect(testReference(null)).toBe("–");
});

it("uses the reference saved for the specification's test and translates its stored code", () => {
  expect(testReference([{ question: { reference: "USP" } }], "0")).toBe("BP");
  expect(testReference([], "1")).toBe("USP");
  expect(testReference([], "2")).toBe("Ph. Int.");
  expect(testReference([], "3")).toBe("In-house");
  expect(testReference([], " BP 2024 ")).toBe("BP 2024");
  expect(testReference([{ question: { reference: "0" } }, { question: { reference: "BP" } }], " ")).toBe("BP");
});

it("uses the question citation when the section contains an empty placeholder", () => {
  expect(testReference([{ question: { reference: "BP 2024" } }], "–")).toBe("BP 2024");
});
