import { contextBridge, ipcRenderer } from "electron";
import type { DesktopUpdateState, InstallerBridge } from "../../../../shared/desktop-updates";
const bridge: InstallerBridge = {
  status: () => ipcRenderer.invoke("updates:status"),
  action: (action) => ipcRenderer.invoke("updates:action", action),
  onStatus: (listener) => {
    const receive = (_event: Electron.IpcRendererEvent, state: DesktopUpdateState) => listener(state);
    ipcRenderer.on("updates:status", receive);
    return () => { ipcRenderer.removeListener("updates:status", receive); };
  },
};
contextBridge.exposeInMainWorld("oryxInstaller", bridge);
