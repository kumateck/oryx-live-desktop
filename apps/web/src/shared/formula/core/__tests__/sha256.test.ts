import { createHash } from "node:crypto";
import { expect, it } from "vitest";
import { sha256Hex } from "../sha256";

it("matches the platform SHA-256 for short, long and non-ASCII input", () => {
  for (const text of ["", "abc", "oryx-formula-v1\0{\"a\":1}", "µg/mL – ±5%", "x".repeat(1000)])
    expect(sha256Hex(text)).toBe(createHash("sha256").update(text, "utf8").digest("hex"));
});
