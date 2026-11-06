import { z } from "zod";
import { parentPort, workerData } from "node:worker_threads";

import { createFormulaCalculationService } from "../service";
import { FormulaHostOperation } from "./contracts";
import type {
  FormulaWorkerRequest,
  FormulaWorkerResponse,
} from "./worker-protocol";

const port = parentPort;
if (!port) throw new Error("Formula worker requires a parent port.");

const data = z.object({ serviceConfig: z.object({
  enabled: z.boolean(), engineBuildHash: z.string(),
  supportedNumericPolicyVersion: z.string(), maxCompiledDefinitions: z.number().int(),
}).strict() }).strict().parse(workerData);
const service = createFormulaCalculationService(data.serviceConfig);
// Readiness is reported only once the calculation service exists, so /ready cannot
// pass while workers fail during start-up.
port.postMessage({ id: 0, ready: true } satisfies FormulaWorkerResponse);

port.on("message", async (message: FormulaWorkerRequest) => {
  try {
    const response =
      message.operation === FormulaHostOperation.Validate
        ? await service.validate(message.input)
        : await service.evaluate(message.input);
    port.postMessage({
      id: message.id,
      response,
    } satisfies FormulaWorkerResponse);
  } catch {
    port.postMessage({
      id: message.id,
      failed: true,
    } satisfies FormulaWorkerResponse);
  }
});
