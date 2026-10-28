import { join } from "node:path";
import { readFile } from "node:fs/promises";
import type { Config } from "./config.ts";
import { contractDigest, object, parse, sha256 } from "./data.ts";
import type { Release } from "./release.ts";

export type Fetcher = typeof fetch;
export async function request(fetcher: Fetcher, url: string, method = "GET"): Promise<Response> {
  return fetcher(url, { method, redirect: "error", cache: "no-store", signal: AbortSignal.timeout(15_000), headers: { "Cache-Control": "no-cache" } });
}
async function limited(response: Response, limit: number): Promise<string> {
  if (!response.body) throw new Error("Empty HTTP response");
  const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) { const next = await reader.read(); if (next.done) break; size += next.value.length; if (size > limit) throw new Error("HTTP response exceeds deployment verification limit"); chunks.push(next.value); }
  } finally { await reader.cancel(); }
  return Buffer.concat(chunks).toString("utf8");
}
export async function backendFingerprint(config: Config, fetcher: Fetcher): Promise<string> {
  const response = await request(fetcher, `${config.api}/swagger/v1/swagger.json`);
  if (!response.ok || !response.headers.get("content-type")?.includes("json")) throw new Error("Cannot read the existing backend's OpenAPI compatibility contract");
  const value = parse(await limited(response, 32 * 1024 * 1024)); const source = object(value);
  if (typeof source.openapi !== "string" || !source.paths) throw new Error("Backend did not return an OpenAPI contract");
  return contractDigest(value);
}
export async function health(config: Config, release: Release, fetcher: Fetcher): Promise<void> {
  const marker = await request(fetcher, `${config.site}/deployment.json?verify=${release.sha}`);
  if (!marker.ok || object(parse(await limited(marker, 64_000))).commit !== release.sha) throw new Error("The site is not serving the selected release SHA");
  const response = await request(fetcher, `${config.site}/index.html?verify=${release.sha}`);
  if (!response.ok || sha256(await limited(response, 4 * 1024 * 1024)) !== sha256(await readFile(join(config.root, "releases", release.sha, "index.html")))) throw new Error("The live index does not match the selected release");
  const critical = release.files.filter((file) => (file.path.startsWith("assets/") && /\.(js|css)$/.test(file.path)) || file.path.endsWith("_bg.wasm"));
  const verifyAsset = async (file: Release["files"][number]) => {
    const served = await request(fetcher, `${config.site}/${file.path.split("/").map(encodeURIComponent).join("/")}`, "HEAD");
    if (!served.ok || Number(served.headers.get("content-length")) !== file.size || served.headers.get("content-type")?.includes("text/html")) throw new Error(`A release asset is not served correctly: ${file.path}`);
  };
  for (let offset = 0; offset < critical.length; offset += 6) await Promise.all(critical.slice(offset, offset + 6).map(verifyAsset));
  const api = await request(fetcher, `${config.site}/api/v1/user/authenticated`);
  await api.body?.cancel();
  if (![200, 401, 403].includes(api.status) || (api.status === 200 && !api.headers.get("content-type")?.includes("json"))) throw new Error("The site's /api proxy does not reach the existing backend");
}
