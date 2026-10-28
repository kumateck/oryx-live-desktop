import { expect, it } from "vitest";
import { arNumber, arNumberPrefix, issueNumber } from "./qc-numbers";

it("builds AR and issue numbers as Oryx Next does", () => {
  expect(arNumber(arNumberPrefix("RM", 2026), 7)).toBe("QCD/RM/26/0007");
  expect(issueNumber(2026, 12)).toBe("26/0012");
});
