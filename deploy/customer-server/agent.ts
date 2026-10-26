import { lstat, mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { within, type Config } from "./config.ts";
import { commit, exists, readJson } from "./data.ts";
import { backendFingerprint, health, type Fetcher } from "./health.ts";
import { activate, checkCompatibility, compatibility, prune, publish, readRelease, type Release } from "./release.ts";
import { currentCommit, history, loadState, saveState, type Failure, type State } from "./state.ts";
import type { Runner } from "./command.ts";

export interface Dependencies { run: Runner; fetch: Fetcher; now: () => Date; sleep: (milliseconds: number) => Promise<void>; }
const retryDelay = (attempts: number) => Math.min(3600_000, 60_000 * 2 ** Math.min(attempts - 1, 6));
export class DeploymentAgent {
  readonly config: Config;
  readonly dependencies: Dependencies;
  constructor(config: Config, dependencies: Dependencies) { this.config = config; this.dependencies = dependencies; }
  private git(args: string[]): Promise<string> { return this.dependencies.run({ executable: "git", args: ["-C", this.config.repo, ...args] }); }
  private async event(kind: string, sha: string | null, detail: string, alert = false): Promise<void> {
    const event = { kind, sha, detail, branch: this.config.branch, time: this.dependencies.now().toISOString() };
    await history(this.config, event);
    if (alert && this.config.alertHook) {
      try {
        const stat = await lstat(this.config.alertHook);
        if (!stat.isFile() || stat.uid !== 0 || (stat.mode & 0o022) !== 0) throw new Error("Alert hook must be a root-owned executable without group/other write access");
        // Only operational metadata goes to the customer-configured local alert hook.
        await this.dependencies.run({ executable: this.config.alertHook, args: [], input: JSON.stringify({ ...event, detail: "Deployment failed; inspect the local journal and build log." }) });
      } catch { await history(this.config, { ...event, kind: "alert-hook-failed", detail: "Local alert hook failed; check its configuration." }); }
    }
  }
  async initialize(): Promise<void> {
    for (const path of [this.config.root, this.config.state, join(this.config.root, "releases"), join(this.config.root, "shared"), join(this.config.state, "worktrees"), join(this.config.state, "logs")]) {
      await mkdir(path, { recursive: true }); if ((await lstat(path)).isSymbolicLink()) throw new Error("Managed deployment directories must not be symlinks");
    }
  }
  private async removeWorktree(path: string | null): Promise<void> {
    if (!path) return;
    if (!within(join(this.config.state, "worktrees"), path)) throw new Error("Refusing to remove a worktree outside the deployment state directory");
    try { await this.git(["worktree", "remove", "--force", path]); }
    catch { await rm(path, { recursive: true, force: true }); await this.git(["worktree", "prune"]); }
  }
  private failed(state: State, sha: string, detail: string, branch = this.config.branch): Failure {
    const key = `${branch}:${sha}`;
    const failure = { attempts: (state.failures[key]?.attempts ?? 0) + 1, at: this.dependencies.now().getTime(), error: detail };
    state.failures[key] = failure; return failure;
  }
  async recover(state: State): Promise<void> {
    const flight = state.flight;
    if (flight) {
      if (flight.phase !== "building") {
        if (flight.previous) await readRelease(this.config, flight.previous);
        await activate(this.config, flight.previous); state.active = flight.previous;
      }
      await this.removeWorktree(flight.worktree);
      this.failed(state, flight.sha, "Deployment interrupted; previous release restored", flight.branch);
      state.flight = null; await saveState(this.config, state);
      await this.event("recovered-interruption", flight.sha, "Abandoned operation recovered; the previous release is retained.", true);
    }
    if (await currentCommit(this.config) !== state.active) throw new Error("The current release pointer differs from deployment state; resolve this before resuming");
    for (const name of await readdir(join(this.config.state, "worktrees"))) if (name.startsWith("build-")) await this.removeWorktree(join(this.config.state, "worktrees", name));
    // Stages and temporary links never serve traffic; interrupted publication is discarded.
    for (const name of await readdir(join(this.config.root, "releases"))) if (name.startsWith(".stage-")) await rm(join(this.config.root, "releases", name), { recursive: true, force: true });
    for (const name of await readdir(this.config.root)) if (name.startsWith(".current-")) await rm(join(this.config.root, name), { force: true });
  }
  private async build(state: State, sha: string): Promise<Release> {
    const directory = join(this.config.root, "releases", sha);
    if (await exists(directory)) return readRelease(this.config, sha);
    const worktree = await mkdtemp(join(this.config.state, "worktrees", "build-"));
    state.flight = { sha, previous: state.active, branch: this.config.branch, phase: "building", worktree };
    await saveState(this.config, state);
    try {
      await this.git(["worktree", "add", "--detach", worktree, sha]);
      const policy = compatibility(await readJson(join(worktree, "deploy/customer-server/release.json")));
      checkCompatibility(this.config, policy, await backendFingerprint(this.config, this.dependencies.fetch));
      if ((await this.dependencies.run({ executable: this.config.bun, args: ["--version"], cwd: worktree })) !== "1.3.14") throw new Error("Bun 1.3.14 is required");
      const log = join(this.config.state, "logs", `${sha}.log`);
      for (const args of [["install", "--frozen-lockfile"], ["run", "check"], ["run", "build:web"]]) await this.dependencies.run({ executable: this.config.bun, args, cwd: worktree, log });
      return await publish(this.config, join(worktree, "apps/web/dist"), sha, policy, this.dependencies.now());
    } finally {
      await this.removeWorktree(worktree);
      if (state.flight) state.flight.worktree = null;
    }
  }
  private async switch(state: State, release: Release): Promise<void> {
    checkCompatibility(this.config, release, await backendFingerprint(this.config, this.dependencies.fetch));
    const previous = state.active;
    const earlierPrevious = state.previous; const earlierBranch = state.branch;
    state.flight = { sha: release.sha, previous, branch: this.config.branch, phase: "activating", worktree: null };
    await saveState(this.config, state);
    try {
      await activate(this.config, release.sha); state.flight.phase = "verifying"; await saveState(this.config, state);
      let verified = false;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try { await health(this.config, release, this.dependencies.fetch); verified = true; break; }
        catch (error) { if (attempt === 2) throw error; await this.dependencies.sleep(1000); }
      }
      if (!verified) throw new Error("Release verification failed");
      state.previous = previous; state.active = release.sha; state.branch = this.config.branch; state.flight = null;
      delete state.failures[`${this.config.branch}:${release.sha}`]; await saveState(this.config, state);
    } catch (error) {
      try { await activate(this.config, previous); state.active = previous; state.previous = earlierPrevious; state.branch = earlierBranch; state.flight = null; await saveState(this.config, state); }
      catch { state.paused = true; await saveState(this.config, state); await this.event("critical-rollback-failed", release.sha, "Activation and rollback failed; deployment is paused.", true); }
      throw error;
    }
  }
  async poll(): Promise<void> {
    await this.initialize(); const state = await loadState(this.config); await this.recover(state);
    if (state.paused) return;
    const now = this.dependencies.now().getTime();
    if (state.network && now - state.network.at < retryDelay(state.network.attempts)) return;
    let sha: string;
    try {
      await this.git(["check-ref-format", "--branch", this.config.branch]);
      if (await this.git(["remote", "get-url", "origin"]) !== this.config.repository) throw new Error("Repository origin does not match customer configuration");
      await this.git(["fetch", "--quiet", "--no-tags", "origin", `refs/heads/${this.config.branch}:refs/remotes/origin/${this.config.branch}`]);
      sha = commit(await this.git(["rev-parse", "--verify", `refs/remotes/origin/${this.config.branch}^{commit}`]));
      state.network = null;
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Git fetch failed";
      state.network = { attempts: (state.network?.attempts ?? 0) + 1, at: now, error: detail }; await saveState(this.config, state);
      await this.event("fetch-failed", null, detail, state.network.attempts === 1 || state.network.attempts % 10 === 0); throw error;
    }
    if (state.active === sha && state.branch === this.config.branch) { await saveState(this.config, state); return; }
    const failure = state.failures[`${this.config.branch}:${sha}`];
    if (failure && (failure.attempts >= this.config.maxFailures || now - failure.at < retryDelay(failure.attempts))) { await saveState(this.config, state); return; }
    await this.event("deployment-started", sha, "Building the selected branch commit in isolation.");
    try {
      const release = await this.build(state, sha); await this.switch(state, release);
      await this.event("deployment-succeeded", sha, "Release activated and verified.");
      try { await prune(this.config, state.active, state.previous, this.dependencies.now()); }
      catch { await this.event("retention-failed", sha, "Deployment succeeded; retained files need an operator check.", true); }
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Deployment failed";
      const failure = this.failed(state, sha, detail);
      if (state.flight?.phase === "building") state.flight = null;
      await saveState(this.config, state);
      await this.event(failure.attempts >= this.config.maxFailures ? "release-quarantined" : "deployment-failed", sha, detail, true); throw error;
    }
  }
  async control(action: "pause" | "resume" | "retry" | "rollback" | "prune", sha?: string): Promise<void> {
    await this.initialize(); const state = await loadState(this.config); await this.recover(state);
    if (action === "pause") state.paused = true;
    if (action === "resume") { state.paused = false; state.network = null; }
    if (action === "retry") { if (!sha) throw new Error("Specify the quarantined SHA"); delete state.failures[`${this.config.branch}:${commit(sha)}`]; state.network = null; }
    if (action === "rollback") {
      const target = sha ? commit(sha) : state.previous; if (!target) throw new Error("There is no previous release");
      if (target === state.active) throw new Error("That release is already active");
      await this.switch(state, await readRelease(this.config, target)); state.paused = true;
    }
    if (action === "prune") await prune(this.config, state.active, state.previous, this.dependencies.now());
    await saveState(this.config, state); await this.event(action, sha ?? state.active, action === "rollback" ? "Rollback verified; automatic deployment is paused until resume." : `Operator command: ${action}`);
  }
}
