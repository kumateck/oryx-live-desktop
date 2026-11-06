import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { execFileSync } from "node:child_process";
import { z } from "zod";

const root = resolve(import.meta.dirname, "..");
const output = process.argv[2];
if (!output) throw new Error("Use bun run formula:package /absolute/path/to/new-release-directory");
const destination = resolve(output);
if (destination === root || destination.startsWith(`${root}/`)) throw new Error("Keep release bundles outside the source checkout");
const files = async (directory: string): Promise<string[]> => {
  const entries = await readdir(resolve(root, directory), { withFileTypes: true });
  return (await Promise.all(entries.filter(entry => !["node_modules", "dist"].includes(entry.name)).map(entry => {
    const name = `${directory}/${entry.name}`;
    return entry.isDirectory() ? files(name) : Promise.resolve([name]);
  }))).flat().sort();
};
const digest = async (paths: readonly string[]): Promise<string> => {
  const hash = createHash("sha256");
  for (const path of [...paths].sort()) {
    hash.update(`${createHash("sha256").update(await readFile(resolve(root, path))).digest("hex")}  ${path}\n`);
  }
  return hash.digest("hex");
};
const serviceFiles = await files("services/formula-calculation");
const coreFiles = await files("apps/web/src/shared/formula/core");
const engineFiles = [...serviceFiles, ...coreFiles].filter(path => path.endsWith(".ts") && !path.includes("/__tests__/") && !path.endsWith("vitest.config.ts"));
const engineBuildHash = await digest(engineFiles);
const sourceHash = await digest([...serviceFiles, ...coreFiles, "deploy/formula-service.Dockerfile", "scripts/package-formula-service.ts", "bun.lock", "package.json", "apps/web/package.json", "apps/desktop/package.json", "apps/gateway/package.json"]);
const image = `oryx-formula-calculation:${sourceHash}`;
const git = (...args: string[]): string => execFileSync("git", ["-C", root, ...args], { encoding: "utf8" }).trim();
const sourceSha = git("rev-parse", "HEAD");
const sourceDirty = git("status", "--porcelain").length > 0;
await mkdir(destination, { recursive: false, mode: 0o700 });
execFileSync("docker", ["buildx", "build", "--load", "--platform", "linux/amd64", "--file", "deploy/formula-service.Dockerfile", "--build-arg", `ENGINE_BUILD_HASH=${engineBuildHash}`, "--tag", image, "."], { cwd: root, stdio: "inherit" });
const inspect = z.object({ Id: z.string().regex(/^sha256:[a-f0-9]{64}$/), Architecture: z.literal("amd64"), Os: z.literal("linux"), Config: z.object({ User: z.literal("formula"), Labels: z.record(z.string(), z.string()) }) });
const built = inspect.parse(JSON.parse(execFileSync("docker", ["image", "inspect", "--format", "{{json .}}", image], { encoding: "utf8" })));
if (built.Config.Labels["com.oryx.formula.engine"] !== engineBuildHash) throw new Error("Image engine identity mismatch");
execFileSync("docker", ["image", "save", "--output", resolve(destination, "image.tar"), image], { stdio: "inherit" });
const archive = createHash("sha256");
for await (const chunk of createReadStream(resolve(destination, "image.tar"))) archive.update(chunk);
await writeFile(resolve(destination, "manifest.json"), JSON.stringify({
  schemaVersion: "oryx-formula-release-v1", sourceRepository: "kumateck/oryx-live-desktop",
  sourceSha, sourceHash, sourceDirty, image, imageId: built.Id, platform: "linux/amd64",
  engineBuildHash, numericPolicyVersion: "oryx-decimal-v1-half-up", archiveSha256: archive.digest("hex"),
}, null, 2) + "\n", { mode: 0o600 });
console.log(`Formula release: ${destination}\nEngine: ${engineBuildHash}\nImage: ${built.Id}\nSource: ${relative(root, destination)}${sourceDirty ? " (working tree includes uncommitted changes)" : ""}`);
