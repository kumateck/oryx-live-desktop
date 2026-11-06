import { Socket } from "node:net";
import { IncomingMessage } from "node:http";

import { describe, expect, it } from "vitest";

import { loadFormulaHostConfig } from "../config";
import {
  FormulaHostPayloadTooLargeError,
  readBoundedRequestBody,
} from "../request-body";

const enabledEnvironment = () => ({
  FORMULA_V2_INTERNAL_SERVICE_ENABLED: "true",
  FORMULA_SERVICE_AUTH_SECRET: "s".repeat(32),
  FORMULA_SERVICE_ENGINE_BUILD_HASH: "a".repeat(64),
  FORMULA_SERVICE_NUMERIC_POLICY_VERSION: "oryx-decimal-v1",
});

const message = (body: string, length?: number): IncomingMessage => {
  const stream = new IncomingMessage(new Socket());
  stream.push(Buffer.from(body));
  stream.push(null);
  stream.headers =
    length === undefined ? {} : { "content-length": String(length) };
  return stream;
};

describe("formula host configuration", () => {
  it("is disabled and loopback-bound by default", () => {
    const config = loadFormulaHostConfig({});
    expect(config.enabled).toBe(false);
    expect(config.hostname).toBe("127.0.0.1");
    expect(config.workloadToken).toBe("");
  });

  it("loads a fully controlled enabled configuration", () => {
    const config = loadFormulaHostConfig(enabledEnvironment());
    expect(config).toEqual(
      expect.objectContaining({
        enabled: true,
        concurrency: 2,
        deadlineMs: 2_000,
        maxRequestBytes: 262_144,
      }),
    );
  });

  it("rejects an engine hash different from the image release", () => {
    expect(() => loadFormulaHostConfig({
      ...enabledEnvironment(), FORMULA_SERVICE_RELEASE_ENGINE_HASH: "b".repeat(64),
    })).toThrow(/released image/);
  });

  it("fails closed for missing credentials, provenance, and unsafe limits", () => {
    expect(() =>
      loadFormulaHostConfig({ FORMULA_V2_INTERNAL_SERVICE_ENABLED: "true" }),
    ).toThrow(/engine build hash/);
    expect(() =>
      loadFormulaHostConfig({
        ...enabledEnvironment(),
        FORMULA_SERVICE_AUTH_SECRET: "short",
      }),
    ).toThrow(/authentication secret/);
    expect(() =>
      loadFormulaHostConfig({
        ...enabledEnvironment(),
        FORMULA_SERVICE_CONCURRENCY: "33",
      }),
    ).toThrow(/concurrency/);
  });
});

describe("bounded request body", () => {
  it("reads a request within the limit", async () => {
    const value = await readBoundedRequestBody(message("hello"), 5);
    expect(new TextDecoder().decode(value)).toBe("hello");
  });

  it("rejects declared and streamed payload overflow", async () => {
    await expect(
      readBoundedRequestBody(message("hello", 6), 5),
    ).rejects.toBeInstanceOf(FormulaHostPayloadTooLargeError);
    await expect(
      readBoundedRequestBody(message("123456"), 5),
    ).rejects.toBeInstanceOf(FormulaHostPayloadTooLargeError);
  });
});
