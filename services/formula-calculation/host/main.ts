import { writeFormulaHostAuditEvent } from "./audit";
import { loadFormulaHostConfig } from "./config";
import { createFormulaHttpServer } from "./server";
import { FormulaWorkerPool, nodeFormulaWorkerFactory } from "./worker-pool";

const config = loadFormulaHostConfig(process.env);
const executor = config.enabled
  ? new FormulaWorkerPool(
      config.concurrency,
      nodeFormulaWorkerFactory(new URL("./worker-entry.mjs", import.meta.url), {
        serviceConfig: {
          enabled: true,
          engineBuildHash: config.engineBuildHash,
          supportedNumericPolicyVersion: config.numericPolicyVersion,
          maxCompiledDefinitions: config.maxCompiledDefinitions,
        },
      }),
    )
  : null;
const server = createFormulaHttpServer(
  config,
  executor,
  writeFormulaHostAuditEvent,
);

const shutdown = async (): Promise<void> => {
  server.close();
  await executor?.close();
};

process.once("SIGTERM", () => void shutdown());
process.once("SIGINT", () => void shutdown());

server.listen(config.port, config.hostname, () => {
  process.stdout.write(
    `${JSON.stringify({
      eventType: "FORMULA_SERVICE_STARTED",
      enabled: config.enabled,
      hostname: config.hostname,
      port: config.port,
      workerCapacity: executor?.metrics().capacity ?? 0,
    })}\n`,
  );
});
