import { contractDigest, object, parse, type ObjectValue } from "../customer-server/data.ts";
import { origin } from "../customer-server/config.ts";
import type { Compatibility } from "../customer-server/release.ts";

export const apiTimeoutMs = 15_000;
export const swaggerTimeoutMs = 60_000;
const contractLimit = 32 * 1024 * 1024;
type Probe = "API" | "Swagger";
interface RequestOptions { fetcher?: typeof fetch; timeoutMs?: number; }

/** The contract is read through a genuine loopback origin, never a forged Host header. */
export function localSwaggerOrigin(value: string): string {
  const result = origin(value);
  if (!["127.0.0.1", "localhost", "[::1]"].includes(new URL(result).hostname)) {
    throw new Error("[Swagger:configuration] Use a local loopback origin for host-network verification");
  }
  return result;
}

function networkFailure(probe: Probe, url: string, signal: AbortSignal, timeoutMs: number, error: object | string): Error {
  if (signal.aborted || (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name))) {
    return new Error(`[${probe}:timeout] ${url} exceeded ${timeoutMs / 1000}s while connecting or reading the response`);
  }
  const cause = error instanceof Error ? error.cause : null;
  const code = cause && typeof cause === "object" && "code" in cause && typeof cause.code === "string" ? ` (${cause.code})` : "";
  return new Error(`[${probe}:connection] Could not connect to or finish reading ${url}${code}; check the configured origin and probe network`);
}

async function request(probe: Probe, url: string, timeoutMs: number, fetcher: typeof fetch) {
  const signal = AbortSignal.timeout(timeoutMs);
  try {
    const response = await fetcher(url, { redirect: "manual", signal });
    return { response, signal };
  } catch (error) {
    throw networkFailure(probe, url, signal, timeoutMs, error instanceof Error ? error : "Request failed");
  }
}

export async function verifyApiConnectivity(upstream: string, options: RequestOptions = {}): Promise<void> {
  const url = `${origin(upstream)}/api/v1/user/authenticated`;
  const { response } = await request("API", url, options.timeoutMs ?? apiTimeoutMs, options.fetcher ?? fetch);
  await response.body?.cancel().catch(() => {});
  if (![200, 401, 403].includes(response.status)) throw new Error(`[API:http] ${url} returned HTTP ${response.status}; expected 200, 401 or 403`);
}

async function contractText(response: Response): Promise<string> {
  if (!response.body) throw new Error("[Swagger:json] The OpenAPI response body is empty");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.length;
      if (size > contractLimit) throw new Error("[Swagger:json] The OpenAPI response exceeds the 32 MiB verification limit");
      chunks.push(next.value);
    }
  } finally { await reader.cancel().catch(() => {}); }
  return Buffer.concat(chunks).toString("utf8");
}

export async function verifySwaggerContract(localOrigin: string, policy: Compatibility, options: RequestOptions = {}): Promise<void> {
  const url = `${localSwaggerOrigin(localOrigin)}/swagger/v1/swagger.json`;
  const timeoutMs = options.timeoutMs ?? swaggerTimeoutMs;
  const { response, signal } = await request("Swagger", url, timeoutMs, options.fetcher ?? fetch);
  if (!response.ok) {
    await response.body?.cancel().catch(() => {});
    throw new Error(`[Swagger:http] ${url} returned HTTP ${response.status}; expected 2xx from the configured local Swagger origin. No Host header override is used`);
  }
  let bytes: string;
  try { bytes = await contractText(response); }
  catch (error) {
    if (error instanceof Error && error.message.startsWith("[Swagger:json]")) throw error;
    throw networkFailure("Swagger", url, signal, timeoutMs, error instanceof Error ? error : "Response read failed");
  }
  let value: ObjectValue;
  try {
    value = object(parse(bytes));
    if (!value.paths || typeof value.paths !== "object" || Array.isArray(value.paths) || typeof value.openapi !== "string") throw new Error("Invalid OpenAPI shape");
  } catch { throw new Error(`[Swagger:json] ${url} did not return a valid OpenAPI JSON object with openapi and paths`); }
  const fingerprint = contractDigest(value);
  if (!policy.backendContracts.includes(fingerprint)) {
    throw new Error(`[Swagger:fingerprint] Backend contract ${fingerprint} is not approved by the selected release; review compatibility before approving any change`);
  }
}
