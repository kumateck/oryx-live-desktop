import { afterEach, expect, it, vi } from "vitest";
import { randomId } from "./random-id";

afterEach(() => { vi.unstubAllGlobals(); });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

it("makes a version 4 UUID on plain HTTP sites, where randomUUID is unavailable", () => {
  vi.stubGlobal("crypto", { getRandomValues: (bytes: Uint8Array) => { bytes.fill(0xff); return bytes; } });
  expect(randomId()).toBe("ffffffff-ffff-4fff-bfff-ffffffffffff");
  vi.stubGlobal("crypto", { getRandomValues: (bytes: Uint8Array) => { bytes.fill(0); return bytes; } });
  expect(randomId()).toMatch(uuid);
});

it("uses randomUUID where the browser provides it", () => {
  vi.stubGlobal("crypto", { randomUUID: () => "11111111-1111-4111-8111-111111111111", getRandomValues: () => { throw new Error("unused"); } });
  expect(randomId()).toBe("11111111-1111-4111-8111-111111111111");
});
