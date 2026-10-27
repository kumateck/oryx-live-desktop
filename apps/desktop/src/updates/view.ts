import type { DesktopUpdateState, InstallerBridge } from "../../../../shared/desktop-updates";
declare global { interface Window { oryxInstaller: InstallerBridge } }
const title = document.querySelector<HTMLElement>("#title");
const description = document.querySelector<HTMLElement>("#description");
const version = document.querySelector<HTMLElement>("#version");
const error = document.querySelector<HTMLElement>("#error");
const progress = document.querySelector<HTMLProgressElement>("#progress");
const action = document.querySelector<HTMLButtonElement>("#action");
const later = document.querySelector<HTMLButtonElement>("#later");
if (!title || !description || !version || !error || !progress || !action || !later) throw new Error("Update controls are incomplete");
let current: DesktopUpdateState | null = null;
function render(state: DesktopUpdateState): void {
  if (!title || !description || !version || !error || !progress || !action || !later) return;
  current = state;
  const percent = state.total ? Math.min(100, Math.floor(state.received / state.total * 100)) : 0;
  title.textContent = state.latestVersion ? `Oryx ${state.latestVersion} is available` : "Desktop updates";
  version.textContent = `Installed version ${state.currentVersion}`;
  error.textContent = state.error;
  progress.hidden = state.phase !== "downloading"; progress.value = percent;
  const labels = { idle: "Check for updates", checking: "Checking…", current: "Check again", available: "Download update", downloading: "Cancel download", ready: "Install and restart", installing: "Restarting…", error: "Try again", unconfigured: "Check again", unsupported: "Check again" };
  action.textContent = labels[state.phase]; action.disabled = ["checking", "installing", "unsupported", "unconfigured"].includes(state.phase);
  later.disabled = state.phase === "installing";
  description.textContent = state.phase === "downloading" ? `Downloading ${percent}% · ${(state.received / 1024 ** 2).toFixed(1)} of ${(state.total / 1024 ** 2).toFixed(1)} MB` : state.phase === "ready" ? "The verified update is ready. Save your work, then install and restart Oryx." : state.phase === "current" ? "You have the latest published desktop version." : state.phase === "installing" ? "Installing the update and restarting Oryx. Your server settings and saved sign-in are kept." : state.phase === "checking" ? "Checking your server for a desktop update…" : state.latestVersion ? "Update now, or keep working and be reminded on your next launch." : "Desktop updates are supplied by your Oryx administrator.";
}
action.addEventListener("click", () => {
  const name = current?.phase === "available" ? "download" : current?.phase === "downloading" ? "cancel" : current?.phase === "ready" ? "install" : "check";
  void window.oryxInstaller.action(name).catch((reason: Error) => { if (error) error.textContent = reason.message; });
});
later.addEventListener("click", () => { void window.oryxInstaller.action("later"); });
const unsubscribe = window.oryxInstaller.onStatus(render);
void window.oryxInstaller.status().then(render).catch((reason: Error) => { if (error) error.textContent = reason.message; });
window.addEventListener("unload", unsubscribe, { once: true });
