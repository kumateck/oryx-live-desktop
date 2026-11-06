import { createServer, type ServerResponse } from "node:http";

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
      try {
        const path = new URL(request.url ?? "/", "http://formula.internal")
          .pathname;
        const body = await readBoundedRequestBody(
          request,
          config.maxRequestBytes,
        );
        send(
          response,
          await handle({
            method: request.method ?? "",
            path,
            authorization: request.headers.authorization,
            contentType: request.headers["content-type"],
            body,
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
