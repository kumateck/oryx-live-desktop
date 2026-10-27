/** Narrow renderer contract. Paths, verification keys and process execution stay in Electron main. */
export type UpdatePhase = "idle" | "checking" | "current" | "available" | "downloading" | "ready" | "installing" | "error" | "unconfigured" | "unsupported";
export interface DesktopUpdateState {
  phase: UpdatePhase;
  currentVersion: string;
  latestVersion: string | null;
  received: number;
  total: number;
  error: string;
}
export interface DesktopUpdatesBridge {
  status(): Promise<DesktopUpdateState>;
  open(): Promise<void>;
  onStatus(listener: (state: DesktopUpdateState) => void): () => void;
}
export interface InstallerBridge {
  status(): Promise<DesktopUpdateState>;
  action(action: "check" | "download" | "cancel" | "install" | "later"): Promise<void>;
  onStatus(listener: (state: DesktopUpdateState) => void): () => void;
}
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export function jsonObject(value: Json): { [key: string]: Json } {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid release metadata");
  return value;
}
export function parseJson(text: string): Json { const value: Json = JSON.parse(text); return value; }
export function versionParts(value: string): number[] {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value)) throw new Error("Invalid release version");
  const parts = value.split(".").map(Number);
  if (!parts.every(Number.isSafeInteger)) throw new Error("Invalid release version");
  return parts;
}
export function newerVersion(candidate: string, current: string): boolean {
  const next = versionParts(candidate); const installed = versionParts(current);
  for (let index = 0; index < 3; index++) {
    const a = next[index] ?? 0; const b = installed[index] ?? 0;
    if (a !== b) return a > b;
  }
  return false;
}
export interface WebRelease { commit: string; minimumShellVersion: string }
export function readWebRelease(value: Json): WebRelease {
  const item = jsonObject(value);
  if (typeof item.commit !== "string" || !/^[a-f0-9]{40}$/.test(item.commit) || typeof item.minimumShellVersion !== "string") throw new Error("Invalid web release metadata");
  versionParts(item.minimumShellVersion);
  return { commit: item.commit, minimumShellVersion: item.minimumShellVersion };
}
