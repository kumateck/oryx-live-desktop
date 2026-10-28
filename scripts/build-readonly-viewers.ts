/** Rebuild reviewed viewer engines in an isolated directory with clean pinned checkouts. */
import { createHash } from "node:crypto";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync, zipSync, type Zippable } from "fflate";
import { engines, type DocumentFormat } from "../apps/web/src/shared/attachments/engines.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const workspaceArgument = process.argv[2];
if (!workspaceArgument) throw new Error("Usage: bun scripts/build-readonly-viewers.ts /absolute/isolated-workspace [wordcraft|pdfcraft|gridcraft]");
const workspace = resolve(workspaceArgument);
if (workspace === root || workspace.startsWith(`${root}/`)) throw new Error("Use a separate build workspace, outside the application repository.");
const selected = process.argv[3];
const formats = (Object.keys(engines) as DocumentFormat[]).filter((format) => !selected || engines[format].name === selected);
if (!formats.length) throw new Error("Unrecognized engine");
const environment = { ...process.env, RUSTUP_TOOLCHAIN: "1.95.0", CARGO_TARGET_DIR: resolve(workspace, "target"), CARGO_BUILD_JOBS: "3" };
async function run(command: string[], cwd: string) {
  const executable = command[0];
  if (!executable) throw new Error("Missing build command");
  await new Promise<void>((done, reject) => {
    const child = spawn(executable, command.slice(1), { cwd, env: environment, stdio: "inherit" });
    child.once("error", reject);
    child.once("close", (code) => code === 0 ? done() : reject(new Error(`Failed: ${command.join(" ")}`)));
  });
}
async function gitOutput(args: string[], cwd: string) {
  const result = await promisify(execFile)("git", args, { cwd, encoding: "utf8" });
  return result.stdout.trim();
}
for (const format of formats) {
  const engine = engines[format];
  const source = resolve(workspace, `${engine.name}-source`);
  if (await gitOutput(["rev-parse", "HEAD"], source) !== engine.revision || await gitOutput(["status", "--porcelain"], source)) {
    throw new Error(`${engine.name}: expected a clean checkout at ${engine.revision}`);
  }
  const directory = resolve(root, "viewers", engine.name);
  const adapter = resolve(directory, "adapter");
  const original = await readFile(resolve(directory, "vendor.bundle.zip"));
  if (sha256(original) !== engine.archive) throw new Error(`${engine.name}: bundle checksum mismatch`);
  const entries = unzipSync(original);
  const inherited = engine.name === "wordcraft" ? ["workspace.patch"]
    : engine.name === "gridcraft" ? ["workspace-policy.patch", "workspace-theme.patch"]
    : ["workspace-policy.patch", "workspace-files.patch", "workspace-theme.patch", "workspace-ui.patch"];
  const readonly = (await readdir(adapter)).filter((name) => /^readonly-.*\.patch$/.test(name)).sort();
  for (const name of [...inherited, ...readonly]) await run(["git", "apply", resolve(adapter, name)], source);
  if (engine.name === "pdfcraft") await cp(resolve(adapter, "workspace.rs"), resolve(source, "crates/ui-egui/src/workspace.rs"));
  const host = resolve(workspace, `${engine.name}-host`);
  await mkdir(resolve(host, "src"), { recursive: true });
  await cp(resolve(adapter, "Cargo.toml"), resolve(host, "Cargo.toml"));
  for (const name of ["main.rs", "native.rs"]) await cp(resolve(adapter, name), resolve(host, "src", name));
  const lock = entries["Cargo.lock"];
  if (!lock) throw new Error("Missing pinned Cargo lock");
  await writeFile(resolve(host, "Cargo.lock"), lock);
  await run(["cargo", "build", "--locked", "--release", "--target", "wasm32-unknown-unknown"], host);
  await run(["wasm-bindgen", "--target", "web", "--out-dir", resolve(host, "out"), "--out-name", `dodo-${engine.name}`,
    resolve(workspace, "target/wasm32-unknown-unknown/release", `dodo-${engine.name}.wasm`)], host);
  for (const name of [`dodo-${engine.name}.js`, `dodo-${engine.name}_bg.wasm`]) entries[name] = await readFile(resolve(host, "out", name));
  entries["Cargo.lock"] = await readFile(resolve(host, "Cargo.lock"));
  // Only the Oryx assigned-file host is shipped; editor bootstraps are intentionally removed.
  for (const name of ["index.html", "editor.js", "editor.css"]) delete entries[name];
  entries["read-only.json"] = new TextEncoder().encode(JSON.stringify({ policy: "readonly-v1", source: engine.revision }));
  const packed: Zippable = {};
  for (const [name, bytes] of Object.entries(entries)) packed[name] = [bytes, { mtime: new Date("2026-10-20T00:00:00Z") }];
  const bundle = zipSync(packed, { level: 9 });
  // Review output before updating the manifest/provenance pins in the application repository.
  await writeFile(resolve(host, "vendor.bundle.zip"), bundle);
  console.log(`${engine.name} archive SHA-256: ${sha256(bundle)}`);
}
