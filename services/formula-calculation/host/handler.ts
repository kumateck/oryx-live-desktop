import type { FormulaInput } from "../input";
import { performance } from "node:perf_hooks";

import { hasValidWorkloadToken } from "./auth";
import type {
  FormulaHostAuditEvent,
  FormulaHostExecutor,
  FormulaHostRequest,
  FormulaHostResponse,
} from "./contracts";
import { FormulaHostOperation } from "./contracts";
import {
  FormulaHostDeadlineError,
  FormulaHostOverloadedError,
  FormulaHostWorkerError,
} from "./errors";
import { errorResponse, jsonResponse } from "./http-response";

export interface FormulaHostHandlerConfig {
  enabled: boolean;
  workloadToken: string;
  deadlineMs: number;
  executor: FormulaHostExecutor | null;
  audit: (event: FormulaHostAuditEvent) => void;
}

const operationFor = (path: string): FormulaHostOperation | null => {
  if (path === "/internal/formula/v1/validate")
    return FormulaHostOperation.Validate;
  if (path === "/internal/formula/v1/evaluate")
    return FormulaHostOperation.Evaluate;
  return null;
};

const health = (
  ready: boolean,
  metrics: { active: number; capacity: number },
) =>
  jsonResponse(ready ? 200 : 503, {
    schemaVersion: "oryx-formula-host-health-v1",
    status: ready ? "READY" : "NOT_READY",
    activeWorkers: metrics.active,
    workerCapacity: metrics.capacity,
  });

export const createFormulaHostHandler =
  (config: FormulaHostHandlerConfig) =>
  async (request: FormulaHostRequest): Promise<FormulaHostResponse> => {
    const started = request.startedAt ?? performance.now();
    let response: FormulaHostResponse;
    let requestId: string | null = null;
    let serviceStatus: string | null = null;
    let engineBuildHash: string | null = null;
    const executor = config.executor;
    const ready = config.enabled && Boolean(executor?.isReady());
    if (request.method === "GET" && request.path === "/health") {
      response = health(
        true,
        executor?.metrics() ?? { active: 0, capacity: 0 },
      );
    } else if (request.method === "GET" && request.path === "/ready") {
      response = health(
        ready,
        executor?.metrics() ?? { active: 0, capacity: 0 },
      );
    } else {
      const operation = operationFor(request.path);
      if (operation === null || request.method !== "POST") {
        response = errorResponse(404, "NOT_FOUND");
      } else if (!ready || !executor) {
        response = errorResponse(503, "SERVICE_DISABLED_OR_NOT_READY");
      } else if (
        !hasValidWorkloadToken(request.authorization, config.workloadToken)
      ) {
        response = errorResponse(401, "UNAUTHORIZED");
      } else if (
        !request.contentType?.toLowerCase().startsWith("application/json")
      ) {
        response = errorResponse(415, "UNSUPPORTED_MEDIA_TYPE");
      } else {
        try {
          const input: FormulaInput = JSON.parse(
            new TextDecoder().decode(request.body),
          );
          // Time already spent receiving and parsing the request counts toward the deadline.
          const remaining = Math.max(
            0,
            config.deadlineMs - (performance.now() - started),
          );
          const controller = new AbortController();
          if (remaining === 0) controller.abort();
          const timer = setTimeout(() => controller.abort(), remaining);
          try {
            const result = await executor.execute(
              operation,
              input,
              controller.signal,
            );
            requestId = result.requestId;
            serviceStatus = result.statusName;
            engineBuildHash = result.engineBuildHash;
            response = jsonResponse(200, result);
          } finally {
            clearTimeout(timer);
          }
        } catch (error) {
          if (error instanceof SyntaxError)
            response = errorResponse(400, "INVALID_JSON");
          else if (error instanceof FormulaHostOverloadedError)
            response = errorResponse(429, "CONCURRENCY_LIMIT_EXCEEDED");
          else if (error instanceof FormulaHostDeadlineError)
            response = errorResponse(504, "DEADLINE_EXCEEDED");
          else if (error instanceof FormulaHostWorkerError)
            response = errorResponse(503, "WORKER_FAILED");
          else response = errorResponse(500, "INTERNAL_ERROR");
        }
      }
    }
    config.audit({
      method: request.method,
      path: request.path,
      httpStatus: response.status,
      durationMs: Math.max(0, Math.round(performance.now() - started)),
      requestId,
      serviceStatus,
      engineBuildHash,
    });
    return response;
  };
