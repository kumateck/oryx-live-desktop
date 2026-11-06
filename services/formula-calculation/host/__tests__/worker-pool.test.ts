import { EventEmitter } from "node:events";

import { describe, expect, it, vi } from "vitest";

import type {
  FormulaWorkerRequest,
  FormulaWorkerResponse,
} from "../worker-protocol";
import { FormulaHostOperation } from "../contracts";
import {
  FormulaHostDeadlineError,
  FormulaHostOverloadedError,
  FormulaHostWorkerError,
} from "../errors";
import { FormulaWorkerPool } from "../worker-pool";
import {
  FORMULA_SERVICE_RESPONSE_V1,
  FormulaServiceOperation,
  FormulaServiceStatus,
  type FormulaServiceResponseV1,
} from "../../service";

class FakeWorker extends EventEmitter {
  request: FormulaWorkerRequest | null = null;
  terminated = false;

  constructor(reportReady = true) {
    super();
    if (reportReady)
      queueMicrotask(() =>
        this.emit("message", { id: 0, ready: true } satisfies FormulaWorkerResponse),
      );
  }

  postMessage(value: FormulaWorkerRequest): void {
    this.request = value;
  }

  async terminate(): Promise<number> {
    this.terminated = true;
    return 0;
  }

  respond(): void {
    if (!this.request) throw new Error("No request is active.");
    const response: FormulaServiceResponseV1 = {
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
    };
    this.emit("message", {
      id: this.request.id,
      response,
    } satisfies FormulaWorkerResponse);
  }
}

describe("formula worker pool", () => {
  it("enforces concurrency and reuses an available worker", async () => {
    const workers: FakeWorker[] = [];
    const pool = new FormulaWorkerPool(1, () => {
      const worker = new FakeWorker();
      workers.push(worker);
      return worker;
    });
    const firstRequest = pool.execute(
      FormulaHostOperation.Validate,
      {},
      new AbortController().signal,
    );
    await expect(
      pool.execute(
        FormulaHostOperation.Validate,
        {},
        new AbortController().signal,
      ),
    ).rejects.toBeInstanceOf(FormulaHostOverloadedError);
    first(workers).respond();
    await expect(firstRequest).resolves.toEqual(
      expect.objectContaining({ statusName: "COMPLETED" }),
    );
    expect(pool.metrics()).toEqual({ active: 0, capacity: 1 });
    await pool.close();
  });

  it("terminates and replaces a worker after deadline abort", async () => {
    const workers: FakeWorker[] = [];
    const pool = new FormulaWorkerPool(1, () => {
      const worker = new FakeWorker();
      workers.push(worker);
      return worker;
    });
    const controller = new AbortController();
    const pending = pool.execute(
      FormulaHostOperation.Evaluate,
      {},
      controller.signal,
    );
    controller.abort();
    await expect(pending).rejects.toBeInstanceOf(FormulaHostDeadlineError);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(workers[0]?.terminated).toBe(true);
    expect(workers).toHaveLength(2);
    await pool.close();
  });

  it("rejects a request whose deadline already expired", async () => {
    const workers: FakeWorker[] = [];
    const pool = new FormulaWorkerPool(1, () => {
      const worker = new FakeWorker();
      workers.push(worker);
      return worker;
    });
    const controller = new AbortController();
    controller.abort();
    await expect(
      pool.execute(FormulaHostOperation.Evaluate, {}, controller.signal),
    ).rejects.toBeInstanceOf(FormulaHostDeadlineError);
    expect(workers[0]?.request).toBeNull();
    await pool.close();
  });

  it("fails closed and replaces a crashed worker", async () => {
    const workers: FakeWorker[] = [];
    const pool = new FormulaWorkerPool(1, () => {
      const worker = new FakeWorker();
      workers.push(worker);
      return worker;
    });
    const pending = pool.execute(
      FormulaHostOperation.Evaluate,
      {},
      new AbortController().signal,
    );
    first(workers).emit("error", new Error("crash"));
    await expect(pending).rejects.toBeInstanceOf(FormulaHostWorkerError);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(workers).toHaveLength(2);
    expect(pool.isReady()).toBe(true);
    await pool.close();
  });

  it("is not ready until a worker reports its service started", async () => {
    const pool = new FormulaWorkerPool(1, () => new FakeWorker(false));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(pool.isReady()).toBe(false);
    await pool.close();
  });

  it("backs off instead of respawning a worker that keeps crashing", async () => {
    vi.useFakeTimers();
    try {
      const workers: FakeWorker[] = [];
      const pool = new FormulaWorkerPool(1, () => {
        const worker = new FakeWorker(false);
        workers.push(worker);
        queueMicrotask(() => worker.emit("error", new Error("start-up crash")));
        return worker;
      });
      await vi.advanceTimersByTimeAsync(0);
      const afterImmediate = workers.length;
      expect(afterImmediate).toBeLessThanOrEqual(3);
      await vi.advanceTimersByTimeAsync(1_000);
      expect(workers.length).toBeLessThan(10);
      expect(pool.isReady()).toBe(false);
      await pool.close();
    } finally {
      vi.useRealTimers();
    }
  });
});

function first<T>(values: readonly T[]): T {
  const value = values[0];
  if (value === undefined) throw new Error("Expected fixture value");
  return value;
}
