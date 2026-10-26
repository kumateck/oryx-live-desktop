import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DeploymentAgent, type Dependencies } from "../deploy/customer-server/agent.ts";
import { readConfig, type Config } from "../deploy/customer-server/config.ts";
import { contractDigest } from "../deploy/customer-server/data.ts";
import { currentCommit } from "../deploy/customer-server/state.ts";
import type { Command } from "../deploy/customer-server/command.ts";

export const firstSha = "a".repeat(40);
export const secondSha = "b".repeat(40);
export const thirdSha = "c".repeat(40);
export const backend = { openapi: "3.0.1", info: { title: "Customer backend", version: "1" }, paths: {} };
export async function artifact(root: string, sha: string): Promise<void> {
  await mkdir(join(root, "assets"), { recursive: true });
  await writeFile(join(root, "index.html"), `<html><head><meta name="application-name" content="Oryx Live"><script src="/assets/app-${sha}.js"></script></head></html>`);
  await writeFile(join(root, "assets", `app-${sha}.js`), `console.log('${sha}')`);
  for (const name of ["wordcraft", "pdfcraft", "gridcraft"]) {
    const directory = join(root, "viewers", `${name}-pinned`); await mkdir(directory, { recursive: true });
    await writeFile(join(directory, `dodo-${name}.js`), "export default function render() {}");
    await writeFile(join(directory, `dodo-${name}_bg.wasm`), Buffer.from([0, 97, 115, 109, 1, 0, 0, 0]));
  }
}
export async function deploymentFixture() {
  const temporary = await mkdtemp(join(tmpdir(), "oryx-deployment-"));
  const config = readConfig({ ORYX_DEPLOY_REPO: join(temporary, "repo"), ORYX_DEPLOY_STATE: join(temporary, "state"), ORYX_DEPLOY_ROOT: join(temporary, "site"),
    ORYX_SITE_URL: "http://customer.test", ORYX_API_ORIGIN: "http://backend.test", ORYX_BUN: join(temporary, "bun") });
  await mkdir(config.repo, { recursive: true });
  let clock = Date.UTC(2026, 9, 26);
  const simulation = { sha: firstSha, failBuild: false, failedHealth: "", offline: false, incompatible: false, corruptViewer: false, commands: [] as Command[] };
  const dependencies: Dependencies = {
    now: () => new Date(clock), sleep: async () => {},
    run: async (command) => {
      simulation.commands.push(command);
      if (command.executable === "git") {
        const args = command.args.slice(2);
        if (args[0] === "remote") return config.repository;
        if (args[0] === "fetch" && simulation.offline) throw new Error("GitHub unavailable");
        if (args[0] === "rev-parse") return simulation.sha;
        if (args[0] === "worktree" && args[1] === "add") {
          const worktree = args[3]; if (!worktree) throw new Error("Expected worktree path");
          await mkdir(join(worktree, "deploy/customer-server"), { recursive: true });
          await writeFile(join(worktree, "deploy/customer-server/release.json"), JSON.stringify({ deploymentProtocol: 1, minimumShellVersion: "0.1.0", backendContracts: [simulation.incompatible ? "0".repeat(64) : contractDigest(backend)] }));
        }
        if (args[0] === "worktree" && args[1] === "remove") { const directory = args[3]; if (directory) await rm(directory, { recursive: true, force: true }); }
        return "";
      }
      if (command.args[0] === "--version") return "1.3.14";
      if (simulation.failBuild && command.args.join(" ") === "run check") throw new Error("Injected quality check failure");
      if (command.args.join(" ") === "run build:web") {
        if (!command.cwd) throw new Error("Build must run in isolation");
        const dist = join(command.cwd, "apps/web/dist"); await artifact(dist, simulation.sha);
        if (simulation.corruptViewer) await writeFile(join(dist, "viewers/wordcraft-pinned/dodo-wordcraft_bg.wasm"), "<html>missing</html>");
      }
      return "";
    },
    fetch: async (input, init) => {
      const url = new URL(String(input));
      if (url.origin === config.api) return Response.json(backend);
      if (url.pathname === "/api/v1/user/authenticated") return new Response(null, { status: 401 });
      const active = await currentCommit(config);
      if (!active || simulation.failedHealth === active) return new Response("Unavailable", { status: 503 });
      const path = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
      try {
        const bytes = await readFile(join(config.root, "releases", active, path));
        return new Response(init?.method === "HEAD" ? null : bytes, { headers: { "content-length": String(bytes.length), "content-type": path.endsWith(".json") ? "application/json" : path.endsWith(".html") ? "text/html" : "application/octet-stream" } });
      } catch { return new Response(null, { status: 404 }); }
    },
  };
  return { config, simulation, dependencies, agent: new DeploymentAgent(config, dependencies), advance: (milliseconds: number) => { clock += milliseconds; },
    withConfig: (change: Partial<Config>) => new DeploymentAgent({ ...config, ...change }, dependencies),
    cleanup: () => rm(temporary, { recursive: true, force: true }) };
}
