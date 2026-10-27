import { cachedRelease, metadataText, saveRelease } from "./release-cache.ts";
import { parseSiteUrl } from "../site-config.ts";
import { join } from "node:path";
import { type DesktopUpdateState, newerVersion, readWebRelease, parseJson } from "../../../../shared/desktop-updates.ts";
import { feedPath, installerPath, verifyRelease, type InstallerRelease } from "./manifest.ts";
import { downloadInstaller, validInstaller, clearInterruptedDownloads } from "./download.ts";

interface Options {
  version: string; arch: "ia32" | "x64"; publicKey: string; cache: string; supported: boolean;
  fetcher?: typeof fetch;
  changed: (state: DesktopUpdateState) => void;
  prompt: () => void;
  beforeInstall?: () => Promise<boolean>;
  install: (file: string) => Promise<void>;
}
export class DesktopUpdater {
  state: DesktopUpdateState;
  private origin = "";
  private release: InstallerRelease | null = null;
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
  connect(origin: string): void {
    if (origin) origin = parseSiteUrl(origin);
    if (origin === this.origin) return;
    this.cancel(); this.generation++; this.origin = origin; this.release = null;
    this.update({ phase: "idle", latestVersion: null, received: 0, total: 0, error: "" });
    if (origin) void this.check();
  }
  async check(): Promise<void> {
    if (this.active || this.state.phase === "installing") return;
    if (!this.origin) { this.update({ phase: "unconfigured", error: "Connect to your Oryx server before checking for updates." }); return; }
    if (!this.options.supported) { this.update({ phase: "unsupported", error: "In-app installation is available for Windows x86 and x64. Use the signed installer supplied by your administrator on this platform." }); return; }
    if (!this.options.publicKey) { this.update({ phase: "unconfigured", error: "This desktop build has no trusted update key. Ask your administrator for an update-enabled installer." }); return; }
    const controller = new AbortController(); this.active = controller;
    const generation = this.generation; const origin = this.origin;
    this.update({ phase: "checking", error: "" });
    try {
      if (!this.cleaned) { await clearInterruptedDownloads(this.options.cache); this.cleaned = true; }
      const response = await (this.options.fetcher ?? fetch)(new URL(feedPath(), origin), { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]), redirect: "error", credentials: "omit", cache: "no-store" });
      if (!response.ok) throw new Error(`Update check returned HTTP ${response.status}. Ask your administrator to publish the desktop update feed.`);
      const body = await metadataText(response); const release = verifyRelease(body, this.options.publicKey, this.options.arch);
      if (generation !== this.generation || controller.signal.aborted) return;
      if (!newerVersion(release.version, this.options.version)) { this.release = null; this.update({ phase: "current", latestVersion: null }); return; }
      await saveRelease(this.options.cache, origin, body);
      this.release = release;
      const ready = await validInstaller(this.file(release), release);
      if (generation !== this.generation || controller.signal.aborted) return;
      this.update({ phase: ready ? "ready" : "available", latestVersion: release.version, received: ready ? release.size : 0, total: release.size });
      if (!this.snoozed && !this.reminded.has(release.version)) { this.reminded.add(release.version); this.options.prompt(); }
    } catch (error) {
      if (generation === this.generation && !controller.signal.aborted) {
        const message = error instanceof Error ? error.message : "The update server could not be reached. Try again.";
        const cached = await cachedRelease(this.options.cache, origin);
        let restored = false;
        if (cached) {
          try {
            const release = verifyRelease(cached, this.options.publicKey, this.options.arch);
            const ready = await validInstaller(this.file(release), release);
            if (generation === this.generation && !controller.signal.aborted && newerVersion(release.version, this.options.version)) {
              this.release = release; restored = true;
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
    const release = this.release;
    if (!release || this.active || this.state.phase === "installing") return;
    const controller = new AbortController(); this.active = controller; const generation = this.generation;
    this.update({ phase: "downloading", received: 0, total: release.size, error: "" });
    let notified = 0;
    try {
      await downloadInstaller(new URL(installerPath(release.version), this.origin).href, this.file(release), release, controller.signal, (received) => {
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
    if (!this.origin) return null;
    try {
      const response = await (this.options.fetcher ?? fetch)(new URL("/deployment.json", this.origin), { redirect: "error", credentials: "omit", cache: "no-store", signal: AbortSignal.timeout(10_000) });
      if (!response.ok) return null;
      const release = readWebRelease(parseJson(await metadataText(response)));
      return newerVersion(release.minimumShellVersion, this.options.version) ? release.minimumShellVersion : null;
    } catch { return null; }
  }
}
