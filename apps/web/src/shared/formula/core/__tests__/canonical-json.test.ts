import { describe, expect, it, vi } from "vitest";

import { canonicalJson, sha256CanonicalJson } from "../canonical-json";

describe("canonicalJson", () => {
  it("sorts object keys recursively and preserves array order", () => {
    expect(canonicalJson({ z: 2, a: { y: true, b: [2, 1] } })).toBe(
      '{"a":{"b":[2,1],"y":true},"z":2}',
    );
  });

  it("rejects binary floating-point values and undefined", () => {
    expect(() => canonicalJson({ governed: 1.25 })).toThrow(
      "Only finite integer metadata",
    );
    expect(() => canonicalJson({ missing: undefined })).toThrow(
      "Undefined is not canonical JSON",
    );
  });

  it("uses domain separation for stable SHA-256 hashes", async () => {
    const first = await sha256CanonicalJson("oryx:test:v1", { b: 2, a: 1 });
    const reordered = await sha256CanonicalJson("oryx:test:v1", { a: 1, b: 2 });
    const otherDomain = await sha256CanonicalJson("oryx:test:v2", {
      a: 1,
      b: 2,
    });

    expect(first).toHaveLength(64);
    expect(first).toBe(reordered);
    expect(first).not.toBe(otherDomain);
  });

  it("keeps formula hashing available without Web Crypto subtle", async () => {
    vi.stubGlobal("crypto", {});

    try {
      await expect(
        sha256CanonicalJson("oryx:test:v1", { b: 2, a: 1 }),
      ).resolves.toBe(
        "2697e328b182b72b94e8fd68e672b8311d6af99ac840820fb0b54655dd270f3d",
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
