import { cachedRelease, metadataText, saveRelease } from "./release-cache.ts";
import { parseSiteUrl } from "../site-config.ts";
import { join } from "node:path";
import { type DesktopUpdateState, newerVersion, readWebRelease, parseJson } from "../../../../shared/desktop-updates.ts";
import { feedPath, installerPath, verifyRelease, type InstallerRelease } from "./manifest.ts";
import { downloadInstaller, validInstaller, clearInterruptedDownloads } from "./download.ts";
import { feedOrigins } from "./source.ts";

interface FeedAnswer { origin: string; body: string; release: InstallerRelease }

interface Options {
  version: string; arch: "ia32" | "x64"; publicKey: string; cache: string; supported: boolean;
  /** Checked first; the connected server is the fallback. Empty means the connected server only. */
  updateOrigin: string;
  fetcher?: typeof fetch;
  changed: (state: DesktopUpdateState) => void;
  prompt: () => void;
  beforeInstall?: () => Promise<boolean>;
  install: (file: string) => Promise<void>;
}
export class DesktopUpdater {
  state: DesktopUpdateState;
  /** The connected server; null until the shell first reports one (or none). */
  private site: string | null = null;
  private release: InstallerRelease | null = null;
  /** The origin whose verified feed named the current release; its installer is downloaded from there. */
  private releaseOrigin = "";
  private active: AbortController | null = null;
  private generation = 0;
  private reminded = new Set<string>();
  private snoozed = false;
  private cleaned = false;
  private options: Options;
  constructor(options: Options) {
    this.options = options;
    this.state = { phase: "idle", currentVersion: options.version, latestVersion: null, received: 0, total: 0, error: "" };
  }
  private update(patch: Partial<DesktopUpdateState>): void { this.state = { ...this.state, ...patch }; this.options.changed(this.state); }
  private file(release: InstallerRelease): string { return join(this.options.cache, `${release.arch}-${release.version}-${release.sha512}.exe`); }
  connect(site: string): void {
    if (site) site = parseSiteUrl(site);
    if (site === this.site) return;
    this.cancel(); this.generation++; this.site = site; this.release = null; this.releaseOrigin = "";
    this.update({ phase: "idle", latestVersion: null, received: 0, total: 0, error: "" });
    if (this.origins().length) void this.check();
  }
  private origins(): string[] { return feedOrigins(this.options.updateOrigin, this.site ?? ""); }
  /** Asks each origin in turn and keeps the first feed that passes verification. Throws the first origin's error. */
  private async latest(origins: string[], signal: AbortSignal): Promise<FeedAnswer> {
    let first: Error | null = null;
    for (const origin of origins) {
      try {
        const response = await (this.options.fetcher ?? fetch)(new URL(feedPath(), origin), { signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]), redirect: "error", credentials: "omit", cache: "no-store" });
        if (!response.ok) throw new Error(`Update check returned HTTP ${response.status}. Ask your administrator to publish the desktop update feed.`);
        const body = await metadataText(response);
        return { origin, body, release: verifyRelease(body, this.options.publicKey, this.options.arch) };
      } catch (error) {
        signal.throwIfAborted();
        first ??= error instanceof Error ? error : new Error("The update server could not be reached. Try again.");
      }
    }
    throw first ?? new Error("The update server could not be reached. Try again.");
  }
  async check(): Promise<void> {
    if (this.active || this.state.phase === "installing") return;
    const origins = this.origins();
    if (!origins.length) { this.update({ phase: "unconfigured", error: "Connect to your Oryx server before checking for updates." }); return; }
    if (!this.options.supported) { this.update({ phase: "unsupported", error: "In-app installation is available for Windows x86 and x64. Use the signed installer supplied by your administrator on this platform." }); return; }
    if (!this.options.publicKey) { this.update({ phase: "unconfigured", error: "This desktop build has no trusted update key. Ask your administrator for an update-enabled installer." }); return; }
    const controller = new AbortController(); this.active = controller;
    const generation = this.generation;
    this.update({ phase: "checking", error: "" });
    try {
      if (!this.cleaned) { await clearInterruptedDownloads(this.options.cache); this.cleaned = true; }
      const { origin, body, release } = await this.latest(origins, controller.signal);
      if (generation !== this.generation || controller.signal.aborted) return;
      if (!newerVersion(release.version, this.options.version)) { this.release = null; this.releaseOrigin = ""; this.update({ phase: "current", latestVersion: null }); return; }
      await saveRelease(this.options.cache, origin, body);
      this.release = release; this.releaseOrigin = origin;
      const ready = await validInstaller(this.file(release), release);
      if (generation !== this.generation || controller.signal.aborted) return;
      this.update({ phase: ready ? "ready" : "available", latestVersion: release.version, received: ready ? release.size : 0, total: release.size });
      if (!this.snoozed && !this.reminded.has(release.version)) { this.reminded.add(release.version); this.options.prompt(); }
    } catch (error) {
      if (generation === this.generation && !controller.signal.aborted) {
        const message = error instanceof Error ? error.message : "The update server could not be reached. Try again.";
        let restored = false;
        for (const origin of origins) {
          if (restored) break;
          const cached = await cachedRelease(this.options.cache, origin);
          if (!cached) continue;
          try {
            const release = verifyRelease(cached, this.options.publicKey, this.options.arch);
            const ready = await validInstaller(this.file(release), release);
            if (generation === this.generation && !controller.signal.aborted && newerVersion(release.version, this.options.version)) {
              this.release = release; this.releaseOrigin = origin; restored = true;
              this.update({ phase: ready ? "ready" : "available", latestVersion: release.version, total: release.size, received: ready ? release.size : 0, error: `${message} The previously verified update is still available.` });
              if (!this.snoozed && !this.reminded.has(release.version)) { this.reminded.add(release.version); this.options.prompt(); }
            }
          } catch { /* Invalid cached metadata is never used. */ }
        }
        if (!restored && generation === this.generation && !controller.signal.aborted) this.update({ phase: "error", error: message });
      }
    } finally { if (this.active === controller) this.active = null; }
  }
  remindLater(): void { this.snoozed = true; }
  newLaunch(): void {
    this.snoozed = false;
    this.reminded.clear();
    if (this.release && this.state.phase !== "installing" && newerVersion(this.release.version, this.options.version)) {
      this.reminded.add(this.release.version);
      this.options.prompt();
    }
    void this.check();
  }
  cancel(): void {
    this.active?.abort(); this.active = null;
    if (this.state.phase === "downloading") this.update({ phase: "available", received: 0, error: "" });
  }
  async download(): Promise<void> {
    const release = this.release; const origin = this.releaseOrigin;
    if (!release || !origin || this.active || this.state.phase === "installing") return;
    const controller = new AbortController(); this.active = controller; const generation = this.generation;
    this.update({ phase: "downloading", received: 0, total: release.size, error: "" });
    let notified = 0;
    try {
      await downloadInstaller(new URL(installerPath(release.version), origin).href, this.file(release), release, controller.signal, (received) => {
        if (generation === this.generation && !controller.signal.aborted && (Date.now() - notified > 150 || received === release.size)) { notified = Date.now(); this.update({ received }); }
      }, this.options.fetcher);
      if (generation === this.generation && !controller.signal.aborted) this.update({ phase: "ready", received: release.size });
    } catch (error) {
      if (generation === this.generation && !controller.signal.aborted) this.update({ phase: "error", error: error instanceof Error ? error.message : "Download failed. Try again." });
    } finally { if (this.active === controller) this.active = null; }
  }
  async install(): Promise<void> {
    const release = this.release;
    if (!release || this.state.phase !== "ready" || this.active) return;
    this.update({ phase: "installing", error: "" });
    try {
      if (!await validInstaller(this.file(release), release)) { this.update({ phase: "error", error: "The cached installer changed. Check for updates and download it again." }); return; }
      if (this.options.beforeInstall && !await this.options.beforeInstall()) {
        throw new Error("Save or discard your unsaved changes before installing the update.");
      }
      // Preparation may await an unload guard or encrypted-session flush. Verify again after
      // that work, immediately before handing the installer to the native process launcher.
      if (!await validInstaller(this.file(release), release)) { this.update({ phase: "error", error: "The cached installer changed. Check for updates and download it again." }); return; }
      await this.options.install(this.file(release));
    } catch (error) { this.update({ phase: "ready", error: error instanceof Error ? error.message : "Installation could not start. Try again." }); }
  }
  async minimumForSite(): Promise<string | null> {
    if (!this.site) return null;
    try {
      const response = await (this.options.fetcher ?? fetch)(new URL("/deployment.json", this.site), { redirect: "error", credentials: "omit", cache: "no-store", signal: AbortSignal.timeout(10_000) });
      if (!response.ok) return null;
      const release = readWebRelease(parseJson(await metadataText(response)));
      return newerVersion(release.minimumShellVersion, this.options.version) ? release.minimumShellVersion : null;
    } catch { return null; }
  }
}
