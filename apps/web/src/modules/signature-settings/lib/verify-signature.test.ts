// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { signatureBytes, signaturePath } from "./signature-images";
import { verifySignature } from "./verify-signature";
import { tokenStore } from "@/shared/auth/token-store";
export const image = "data:image/png;base64,iVBORw0KGgo=";
const path = "/api/v1/file/signature/user-one.png";
afterEach(() => { vi.unstubAllGlobals(); tokenStore.clear(); });
it("maps legacy server URLs to a same-origin signature path and rejects other routes", () => {
  expect(signaturePath(`http://customer.invalid${path}`)).toBe(path);
  expect(signaturePath("https://external.invalid/avatar.svg")).toBeNull();
  expect(signaturePath("/api/v1/file/signature/../../secret.png")).toBeNull();
  expect(signaturePath("/api/v1/file/signature/file.svg")).toBeNull();
});
it("confirms only a byte-for-byte match with an uncached authenticated read", async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(signatureBytes(image)));
  vi.stubGlobal("fetch", fetcher); tokenStore.set({ accessToken: "session-token", refreshToken: null });
  await verifySignature(path, image, new AbortController().signal);
  const options = fetcher.mock.calls[0]?.[1];
  expect(fetcher.mock.calls[0]?.[0]).toBe(path);
  expect(options?.cache).toBe("no-store"); expect(options?.credentials).toBe("omit");
  expect(new Headers(options?.headers).get("Authorization")).toBe("Bearer session-token");
});
it("rejects silently failed uploads, missing signatures, and unreadable files", async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response("old-image"));
  vi.stubGlobal("fetch", fetcher);
  await expect(verifySignature(path, image, new AbortController().signal)).rejects.toThrow("did not confirm");
  await expect(verifySignature(null, image, new AbortController().signal)).rejects.toThrow("did not provide");
  fetcher.mockResolvedValue(new Response(null, { status: 404 }));
  await expect(verifySignature(path, image, new AbortController().signal)).rejects.toThrow("could not be read");
});
it("rejects mislabeled, empty, and oversized image payloads", () => {
  expect(() => signatureBytes("data:image/png;base64,aGVsbG8=")).toThrow();
  expect(() => signatureBytes("data:image/svg+xml;base64,aGVsbG8=")).toThrow();
  expect(() => signatureBytes(`data:image/png;base64,${"A".repeat(3_000_000)}`)).toThrow();
});
