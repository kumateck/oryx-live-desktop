import { describe, expect, it } from "vitest";

import type { FormulaServiceResponseV1 } from "../../service";
import {
  FORMULA_SERVICE_RESPONSE_V1,
  FormulaServiceOperation,
  FormulaServiceStatus,
} from "../../service";
import type {
  FormulaHostAuditEvent,
  FormulaHostExecutor,
  FormulaHostRequest,
} from "../contracts";
import {
  FormulaHostDeadlineError,
  FormulaHostOverloadedError,
  FormulaHostWorkerError,
} from "../errors";
import { createFormulaHostHandler } from "../handler";

const token = "s".repeat(32);
const request = (
  values: Partial<FormulaHostRequest> = {},
): FormulaHostRequest => ({
  method: "POST",
  path: "/internal/formula/v1/validate",
  authorization: `Bearer ${token}`,
  contentType: "application/json",
  body: new TextEncoder().encode("{}"),
  ...values,
});

const serviceResponse = (): FormulaServiceResponseV1 => ({
  schemaVersion: FORMULA_SERVICE_RESPONSE_V1,
  operation: FormulaServiceOperation.Validate,
  requestId: "request-1",
  status: FormulaServiceStatus.Completed,
  statusName: "COMPLETED",
  evaluatorVersion: "oryx-formula-evaluator-v1",
  engineBuildHash: "a".repeat(64),
  claimedDefinitionHash: null,
  computedDefinitionHash: null,
  claimedConfigurationHash: null,
  computedConfigurationHash: null,
  computedInputHash: null,
  placementKey: null,
  canonicalDefinition: null,
  dependencies: [],
  definitionIssues: [],
  configurationIssues: [],
  requestIssues: [],
  evaluation: null,
  testOutcomes: [],
});

const executor = (
  execute: FormulaHostExecutor["execute"] = async () => serviceResponse(),
): FormulaHostExecutor => ({
  execute,
  isReady: () => true,
  metrics: () => ({ active: 0, capacity: 2 }),
  close: async () => undefined,
});

const handler = (
  worker: FormulaHostExecutor | null,
  audit: FormulaHostAuditEvent[] = [],
  enabled = true,
) =>
  createFormulaHostHandler({
    enabled,
    workloadToken: token,
    deadlineMs: 10,
    executor: worker,
    audit: (event) => audit.push(event),
  });

describe("formula host handler", () => {
  it("keeps liveness available and readiness closed while disabled", async () => {
    expect(
      (
        await handler(
          null,
          [],
          false,
        )(request({ method: "GET", path: "/health" }))
      ).status,
    ).toBe(200);
    expect(
      (
        await handler(
          null,
          [],
          false,
        )(request({ method: "GET", path: "/ready" }))
      ).status,
    ).toBe(503);
    expect((await handler(null, [], false)(request())).status).toBe(503);
  });

  it("authenticates before parsing and requires JSON", async () => {
    const run = handler(executor());
    const unauthorized = await run(
      request({
        authorization: "Bearer wrong",
        body: new TextEncoder().encode("{"),
      }),
    );
    const unsupported = await run(request({ contentType: "text/plain" }));

    expect(unauthorized.status).toBe(401);
    expect(unsupported.status).toBe(415);
  });

  it("returns safe malformed-json and not-found errors", async () => {
    const run = handler(executor());
    expect(
      (await run(request({ body: new TextEncoder().encode("{") }))).status,
    ).toBe(400);
    expect((await run(request({ path: "/unknown" }))).status).toBe(404);
  });

  it.each([
    [new FormulaHostOverloadedError(), 429, "CONCURRENCY_LIMIT_EXCEEDED"],
    [new FormulaHostWorkerError(), 503, "WORKER_FAILED"],
  ])("maps controlled executor failures", async (error, status, code) => {
    const result = await handler(executor(async () => Promise.reject(error)))(
      request(),
    );
    expect(result.status).toBe(status);
    expect(result.body).toContain(code);
  });

  it("aborts work at the configured deadline", async () => {
    const run = handler(
      executor(
        (_operation, _input, signal) =>
          new Promise((_resolve, reject) =>
            signal.addEventListener(
              "abort",
              () => reject(new FormulaHostDeadlineError()),
              { once: true },
            ),
          ),
      ),
    );
    expect((await run(request())).status).toBe(504);
  });

  it("logs safe metadata without request payloads or credentials", async () => {
    const audit: FormulaHostAuditEvent[] = [];
    const result = await handler(
      executor(),
      audit,
    )(request({ body: new TextEncoder().encode('{"secret":"hidden"}') }));

    expect(result.status).toBe(200);
    expect(audit[0]).toEqual(
      expect.objectContaining({ httpStatus: 200, requestId: "request-1" }),
    );
    expect(JSON.stringify(audit)).not.toContain("hidden");
    expect(JSON.stringify(audit)).not.toContain(token);
  });
});
