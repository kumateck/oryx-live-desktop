import type { FormulaInput } from "../input";
import { Worker } from "node:worker_threads";

import type { FormulaServiceResponseV1 } from "../service";
import type { FormulaHostExecutor, FormulaHostOperation } from "./contracts";
import {
  FormulaHostDeadlineError,
  FormulaHostOverloadedError,
  FormulaHostWorkerError,
} from "./errors";
import type {
  FormulaWorkerData,
  FormulaWorkerRequest,
  FormulaWorkerResponse,
} from "./worker-protocol";

interface WorkerLike {
  on(event: "message", listener: (value: FormulaWorkerResponse) => void): this;
  on(event: "error", listener: (error: Error) => void): this;
  on(event: "exit", listener: (code: number) => void): this;
  postMessage(value: FormulaWorkerRequest): void;
  terminate(): Promise<number>;
}

interface ActiveRequest {
  id: number;
  resolve: (value: FormulaServiceResponseV1) => void;
  reject: (error: Error) => void;
  removeAbort: () => void;
}

interface WorkerSlot {
  worker: WorkerLike;
  active: ActiveRequest | null;
  recycling: boolean;
}

export type FormulaWorkerFactory = () => WorkerLike;

export const nodeFormulaWorkerFactory =
  (workerUrl: URL, data: FormulaWorkerData): FormulaWorkerFactory =>
  () =>
    new Worker(workerUrl, { workerData: data });

export class FormulaWorkerPool implements FormulaHostExecutor {
  private readonly slots: WorkerSlot[] = [];
  private nextId = 1;
  private closed = false;

  constructor(
    capacity: number,
    private readonly createWorker: FormulaWorkerFactory,
  ) {
    for (let index = 0; index < capacity; index += 1) this.replace(index);
  }

  private replace(index: number): void {
    if (this.closed) return;
    const slot: WorkerSlot = {
      worker: this.createWorker(),
      active: null,
      recycling: false,
    };
    this.slots[index] = slot;
    slot.worker.on("message", (message) => this.complete(slot, message));
    slot.worker.on("error", () => this.fail(slot));
    slot.worker.on("exit", (code) => {
      if (code !== 0) this.fail(slot);
    });
  }

  private complete(slot: WorkerSlot, message: FormulaWorkerResponse): void {
    const active = slot.active;
    if (!active || active.id !== message.id) return;
    slot.active = null;
    active.removeAbort();
    if (message.response) active.resolve(message.response);
    else {
      active.reject(new FormulaHostWorkerError("Formula worker failed."));
      void this.recycle(slot);
    }
  }

  private fail(slot: WorkerSlot): void {
    if (this.slots.indexOf(slot) < 0) return;
    const active = slot.active;
    slot.active = null;
    active?.removeAbort();
    active?.reject(new FormulaHostWorkerError("Formula worker crashed."));
    void this.recycle(slot);
  }

  private async recycle(slot: WorkerSlot): Promise<void> {
    const index = this.slots.indexOf(slot);
    if (index < 0 || slot.recycling) return;
    slot.recycling = true;
    await slot.worker.terminate().catch(() => 0);
    if (!this.closed && this.slots[index] === slot) this.replace(index);
  }

  execute(
    operation: FormulaHostOperation,
    input: FormulaInput,
    signal: AbortSignal,
  ): Promise<FormulaServiceResponseV1> {
    if (signal.aborted)
      return Promise.reject(
        new FormulaHostDeadlineError("Formula request deadline exceeded."),
      );
    const slot = this.slots.find(
      ({ active, recycling }) => active === null && !recycling,
    );
    if (!slot)
      return Promise.reject(
        new FormulaHostOverloadedError("Worker pool is full."),
      );
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const abort = () => {
        if (slot.active?.id !== id) return;
        slot.active = null;
        reject(
          new FormulaHostDeadlineError("Formula request deadline exceeded."),
        );
        void this.recycle(slot);
      };
      signal.addEventListener("abort", abort, { once: true });
      slot.active = {
        id,
        resolve,
        reject,
        removeAbort: () => signal.removeEventListener("abort", abort),
      };
      try {
        slot.worker.postMessage({ id, operation, input });
      } catch {
        this.fail(slot);
      }
    });
  }

  isReady(): boolean {
    return !this.closed && this.slots.some(({ recycling }) => !recycling);
  }

  metrics() {
    return {
      active: this.slots.filter(({ active }) => active !== null).length,
      capacity: this.slots.length,
    };
  }

  async close(): Promise<void> {
    this.closed = true;
    const slots = this.slots.splice(0);
    for (const slot of slots) {
      slot.active?.removeAbort();
      slot.active?.reject(
        new FormulaHostWorkerError("Formula worker pool closed."),
      );
      slot.active = null;
    }
    await Promise.all(
      slots.map(({ worker }) => worker.terminate().catch(() => 0)),
    );
  }
}
