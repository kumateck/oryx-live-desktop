import { chmod, copyFile, lstat, mkdir, mkdtemp, open, readFile, readdir, rename, rm, symlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { atLeast, version, within, type Config } from "./config.ts";
import { atomicWrite, commit, exists, integer, object, readJson, sha256, string, syncDirectory, type Json } from "./data.ts";

export interface Compatibility { deploymentProtocol: number; minimumShellVersion: string; backendContracts: string[]; }
export interface FileRecord { path: string; digest: string; size: number; }
export interface Release extends Compatibility { sha: string; branch: string; createdAt: string; files: FileRecord[]; }
export function compatibility(value: Json): Compatibility {
  const source = object(value);
  const hashes = source.backendContracts;
  if (!Array.isArray(hashes) || !hashes.length) throw new Error("Declare approved backend contract fingerprints");
  const backendContracts = hashes.map((value) => { const hash = string(value); if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error("Invalid contract fingerprint"); return hash; });
  const minimumShellVersion = string(source.minimumShellVersion); version(minimumShellVersion);
  return { deploymentProtocol: integer(source.deploymentProtocol), minimumShellVersion, backendContracts };
}
export function checkCompatibility(config: Config, release: Compatibility, backendContract: string): void {
  if (release.deploymentProtocol !== 1) throw new Error("This release requires a different deployment agent protocol");
  if (!atLeast(config.shellFloor, release.minimumShellVersion)) throw new Error("Installed desktop shell baseline is older than the release requires");
  if (!release.backendContracts.includes(backendContract)) throw new Error("The existing customer backend contract has not been approved for this release");
}
export async function files(directory: string, prefix = ""): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name); const name = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw new Error(`Release contains a symlink: ${name}`);
    if (entry.isDirectory()) result.push(...await files(path, name));
    else if (entry.isFile()) result.push(name); else throw new Error(`Unsupported release entry: ${name}`);
  }
  return result.sort();
}
export async function validateBuild(directory: string): Promise<void> {
  await files(directory);
  const html = await readFile(join(directory, "index.html"), "utf8");
  if (!/<meta\s+[^>]*name=["']application-name["'][^>]*content=["']Oryx Live["']/i.test(html)) throw new Error("Missing Oryx application marker");
  const links = [...html.matchAll(/(?:src|href)=["'](\/assets\/[^"'?#]+)["']/g)].map((match) => match[1]);
  if (!links.length) throw new Error("Release has no local application assets");
  for (const link of links) {
    if (!link) continue;
    const path = join(directory, link.slice(1));
    const bytes = await readFile(path);
    if (!within(directory, path) || !(await lstat(path)).isFile() || !bytes.length || /^\s*(?:<!doctype\s+html|<html)/i.test(bytes.subarray(0, 100).toString())) throw new Error("Missing or invalid application entry asset");
  }
  for (const engine of ["wordcraft", "pdfcraft", "gridcraft"]) {
    const revisions = (await readdir(join(directory, "viewers"))).filter((name) => name.startsWith(`${engine}-`));
    if (!revisions.length) throw new Error(`Missing ${engine} viewer`);
    for (const revision of revisions) {
      const base = join(directory, "viewers", revision);
      const wasm = await readFile(join(base, `dodo-${engine}_bg.wasm`));
      if (wasm.subarray(0, 4).toString("hex") !== "0061736d" || !(await readFile(join(base, `dodo-${engine}.js`))).length) throw new Error(`Invalid ${engine} viewer`);
    }
  }
}
async function inventory(directory: string): Promise<FileRecord[]> {
  return Promise.all((await files(directory)).filter((path) => path !== ".release.json").map(async (path) => {
    const bytes = await readFile(join(directory, path)); return { path, digest: sha256(bytes), size: bytes.length };
  }));
}
async function publicDirectory(directory: string, boundary: string): Promise<void> {
  if (directory !== boundary) { if (!within(boundary, directory)) throw new Error("Asset directory escapes the release"); await publicDirectory(dirname(directory), boundary); }
  await mkdir(directory, { recursive: true });
  if ((await lstat(directory)).isSymbolicLink()) throw new Error("Asset directories must not be symlinks");
  await chmod(directory, 0o755); await syncDirectory(dirname(directory));
}
export async function readRelease(config: Config, sha: string, verify = true): Promise<Release> {
  const directory = join(config.root, "releases", commit(sha));
  if (!(await lstat(directory)).isDirectory() || (await lstat(directory)).isSymbolicLink()) throw new Error("Release directory is invalid");
  const value = object(await readJson(join(directory, ".release.json")));
  if (value.sha !== sha || !Array.isArray(value.files)) throw new Error("Invalid release metadata");
  const entries = value.files.map((item) => { const file = object(item); const path = string(file.path); const digest = string(file.digest);
    if (!within(directory, join(directory, path)) || path.startsWith("/") || path.includes("\\") || path.split("/").includes("..") || !/^[a-f0-9]{64}$/.test(digest)) throw new Error("Unsafe release manifest");
    return { path, digest, size: integer(file.size) }; });
  const createdAt = string(value.createdAt); if (!Number.isFinite(Date.parse(createdAt))) throw new Error("Invalid release date");
  const release = { ...compatibility(value), sha, branch: string(value.branch), createdAt, files: entries };
  if (verify) {
    await validateBuild(directory);
    if (JSON.stringify(await inventory(directory)) !== JSON.stringify(entries)) throw new Error("Release content does not match its integrity manifest");
  }
  return release;
}
async function preserveAssets(config: Config, directory: string): Promise<void> {
  for (const name of await files(directory)) {
    if (!name.startsWith("assets/") && !name.startsWith("viewers/")) continue;
    const source = join(directory, name); const destination = join(config.root, "shared", name);
    await publicDirectory(dirname(destination), join(config.root, "shared"));
    if (await exists(destination)) {
      if ((await lstat(destination)).isSymbolicLink() || sha256(await readFile(source)) !== sha256(await readFile(destination))) throw new Error(`Immutable asset collision: ${name}`);
    } else {
      const temporary = `${destination}.${randomUUID()}.tmp`;
      await copyFile(source, temporary); await chmod(temporary, 0o644);
      const file = await open(temporary, "r"); try { await file.sync(); } finally { await file.close(); }
      await rename(temporary, destination); await syncDirectory(dirname(destination));
    }
  }
}
export async function publish(config: Config, dist: string, sha: string, policy: Compatibility, now: Date): Promise<Release> {
  commit(sha); await validateBuild(dist);
  const stage = await mkdtemp(join(config.root, "releases", ".stage-"));
  try {
    for (const name of await files(dist)) { const target = join(stage, name); await publicDirectory(dirname(target), stage); await copyFile(join(dist, name), target); await chmod(target, 0o644); }
    const metadata = { commit: sha, branch: config.branch, builtAt: now.toISOString(), minimumShellVersion: policy.minimumShellVersion };
    await atomicWrite(join(stage, "deployment.json"), JSON.stringify(metadata));
    await chmod(join(stage, "deployment.json"), 0o644);
    const release: Release = { ...policy, sha, branch: config.branch, createdAt: now.toISOString(), files: await inventory(stage) };
    await atomicWrite(join(stage, ".release.json"), JSON.stringify(release));
    await preserveAssets(config, stage);
    // Files are durable before the directory becomes a reusable release.
    for (const path of await files(stage)) { const file = await open(join(stage, path), "r"); try { await file.sync(); } finally { await file.close(); } }
    const directories = new Set([stage, ...(await files(stage)).map((name) => dirname(join(stage, name)))]);
    for (const directory of [...directories].sort((left, right) => right.length - left.length)) await syncDirectory(directory);
    await rename(stage, join(config.root, "releases", sha)); await syncDirectory(join(config.root, "releases"));
    return release;
  } finally { await rm(stage, { recursive: true, force: true }); }
}
export async function activate(config: Config, sha: string | null): Promise<void> {
  const current = join(config.root, "current");
  if (sha === null) { await rm(current, { force: true }); await syncDirectory(config.root); return; }
  const temporary = join(config.root, `.current-${randomUUID()}`);
  await symlink(`releases/${commit(sha)}`, temporary, "dir");
  try { await rename(temporary, current); await syncDirectory(config.root); }
  finally { await rm(temporary, { force: true }); }
}
export async function prune(config: Config, active: string | null, previous: string | null, now: Date): Promise<void> {
  const cutoff = now.getTime() - config.retentionDays * 86400_000;
  const protectedFiles = new Set<string>();
  for (const name of await readdir(join(config.root, "releases"))) {
    if (!/^[a-f0-9]{40}$/.test(name)) continue;
    const release = await readRelease(config, name, false);
    if (name !== active && name !== previous && Date.parse(release.createdAt) < cutoff) await rm(join(config.root, "releases", name), { recursive: true });
    else release.files.forEach((file) => protectedFiles.add(file.path));
  }
  const shared = join(config.root, "shared");
  for (const name of await files(shared)) { const path = join(shared, name); if (!protectedFiles.has(name) && (await lstat(path)).mtimeMs < cutoff) await rm(path); }
  for (const name of await readdir(join(config.state, "logs"))) {
    const path = join(config.state, "logs", name);
    if (/^[a-f0-9]{40}\.log$/.test(name) && name !== `${active}.log` && name !== `${previous}.log` && (await lstat(path)).mtimeMs < cutoff) await rm(path);
  }
}
