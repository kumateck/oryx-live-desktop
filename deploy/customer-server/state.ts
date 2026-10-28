import { appendFile, mkdir, readlink } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { Config } from "./config.ts";
import { atomicWrite, commit, exists, integer, nullableString, object, readJson, string, type ObjectValue } from "./data.ts";

export interface Failure { attempts: number; at: number; error: string; }
export interface Flight { sha: string; previous: string | null; branch: string; phase: "building" | "activating" | "verifying"; worktree: string | null; }
export interface State { active: string | null; previous: string | null; branch: string | null; paused: boolean; failures: Record<string, Failure>; network: Failure | null; flight: Flight | null; }
export const initialState = (): State => ({ active: null, previous: null, branch: null, paused: false, failures: {}, network: null, flight: null });
function failure(value: ObjectValue): Failure { return { attempts: integer(value.attempts), at: integer(value.at), error: string(value.error) }; }
export async function loadState(config: Config): Promise<State> {
  const path = join(config.state, "state.json"); if (!(await exists(path))) return initialState();
  const value = object(await readJson(path));
  if (typeof value.paused !== "boolean") throw new Error("Invalid deployment state");
  const failures = Object.fromEntries(Object.entries(object(value.failures ?? {})).map(([key, value]) => [key, failure(object(value))]));
  const active = nullableString(value.active); const previous = nullableString(value.previous);
  if (active) commit(active); if (previous) commit(previous);
  const flightValue = value.flight === null ? null : object(value.flight ?? {});
  let flight: Flight | null = null;
  if (flightValue) {
    const phase = string(flightValue.phase);
    if (phase !== "building" && phase !== "activating" && phase !== "verifying") throw new Error("Invalid deployment phase");
    flight = { sha: commit(string(flightValue.sha)), previous: nullableString(flightValue.previous), branch: string(flightValue.branch), phase, worktree: nullableString(flightValue.worktree) };
    if (flight.previous) commit(flight.previous);
  }
  return { active, previous, branch: nullableString(value.branch), paused: value.paused, failures,
    network: value.network === null ? null : failure(object(value.network ?? {})), flight };
}
export async function saveState(config: Config, state: State): Promise<void> { await atomicWrite(join(config.state, "state.json"), JSON.stringify(state, null, 2)); }
export async function currentCommit(config: Config): Promise<string | null> {
  try {
    const destination = resolve(config.root, await readlink(join(config.root, "current")));
    const sha = destination.slice(destination.lastIndexOf("/") + 1); commit(sha);
    if (destination !== join(config.root, "releases", sha)) throw new Error("Current release points outside the managed releases directory");
    return sha;
  } catch (error) { if (error instanceof Error && "code" in error && error.code === "ENOENT") return null; throw error; }
}
export interface Event { time: string; kind: string; branch: string; sha: string | null; detail: string; }
export async function history(config: Config, event: Event): Promise<void> {
  await mkdir(config.state, { recursive: true });
  const line = JSON.stringify(event); await appendFile(join(config.state, "history.jsonl"), `${line}\n`, { mode: 0o640 });
  process.stdout.write(`${line}\n`);
}
