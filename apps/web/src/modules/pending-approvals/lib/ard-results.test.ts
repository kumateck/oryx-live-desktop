import { expect, it } from "vitest";
import { answersByField, testCompliance } from "./ard-results";

it("judges a test by its recorded results, and says when none was recorded", () => {
  const recorded = answersByField([
    { formField: { id: "a" }, value: "99.1%", complies: true }, { formField: { id: "b" }, value: "Does not comply" }, { formField: { id: "c" }, value: null }, { formField: { id: "c" }, value: "Clear" },
  ]);
  expect(testCompliance(["a"], recorded)).toBe("complies");
  expect(testCompliance(["a", "b"], recorded)).toBe("fails");
  expect(testCompliance(["c"], recorded)).toBe("complies");
  expect(testCompliance(["missing", null], recorded)).toBe("not-recorded");
});
