import { createServer, type ServerResponse } from "node:http";
import { performance } from "node:perf_hooks";

import { hasValidWorkloadToken } from "./auth";

import type { FormulaHostConfig } from "./config";
import type { FormulaHostExecutor, FormulaHostResponse } from "./contracts";
import { createFormulaHostHandler } from "./handler";
import { errorResponse } from "./http-response";
import {
  FormulaHostPayloadTooLargeError,
  readBoundedRequestBody,
} from "./request-body";

const send = (target: ServerResponse, response: FormulaHostResponse): void => {
  target.writeHead(response.status, response.headers);
  target.end(response.body);
};

export const createFormulaHttpServer = (
  config: FormulaHostConfig,
  executor: FormulaHostExecutor | null,
  audit: Parameters<typeof createFormulaHostHandler>[0]["audit"],
) => {
  const handle = createFormulaHostHandler({
    enabled: config.enabled,
    workloadToken: config.workloadToken,
    deadlineMs: config.deadlineMs,
    executor,
    audit,
  });
  const server = createServer(
    { maxHeaderSize: 16 * 1024, requestTimeout: config.deadlineMs + 2_000 },
    async (request, response) => {
      const startedAt = performance.now();
      try {
        const path = new URL(request.url ?? "/", "http://formula.internal")
          .pathname;
        // Only an authorized POST to a ready service may make the server buffer a body;
        // everything else is answered by the handler from headers alone (401/503/404/health).
        const accepted =
          request.method === "POST" &&
          config.enabled &&
          Boolean(executor?.isReady()) &&
          hasValidWorkloadToken(request.headers.authorization, config.workloadToken);
        let body: Uint8Array = new Uint8Array();
        if (accepted)
          body = await readBoundedRequestBody(request, config.maxRequestBytes);
        else request.resume();
        send(
          response,
          await handle({
            method: request.method ?? "",
            path,
            authorization: request.headers.authorization,
            contentType: request.headers["content-type"],
            body,
            startedAt,
          }),
        );
      } catch (error) {
        send(
          response,
          error instanceof FormulaHostPayloadTooLargeError
            ? errorResponse(413, "PAYLOAD_TOO_LARGE")
            : errorResponse(400, "REQUEST_STREAM_FAILED"),
        );
      }
    },
  );
  server.headersTimeout = config.deadlineMs + 3_000;
  server.keepAliveTimeout = 5_000;
  return server;
};
