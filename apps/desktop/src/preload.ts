import { contextBridge, ipcRenderer } from "electron";
import type { ConnectionBridge, SessionBridge, SiteStatus } from "./bridge";

const bridge: ConnectionBridge = {
  getStatus: () => ipcRenderer.invoke("site:get-status") as Promise<SiteStatus>,
  setSiteUrl: (url: string) => ipcRenderer.invoke("site:set-url", url) as Promise<SiteStatus>,
};

contextBridge.exposeInMainWorld("oryxConnection", bridge);

const sessionBridge: SessionBridge = {
  load: () => ipcRenderer.invoke("session:load") as Promise<string | null>,
  save: (refreshToken: string | null) => ipcRenderer.invoke("session:save", refreshToken) as Promise<void>,
};

contextBridge.exposeInMainWorld("oryxSession", sessionBridge);

const companionBridge: import("./companion/contract").CompanionBridge = {
  settings: () => ipcRenderer.invoke("companion:settings") as Promise<import("./companion/contract").CompanionPreferences>,
  command: (command) => ipcRenderer.invoke("companion:command", command) as Promise<import("./companion/contract").CompanionPreferences>,
  notify: (value) => ipcRenderer.invoke("companion:notify", value) as Promise<boolean>,
  summary: (value) => ipcRenderer.invoke("companion:summary", value) as Promise<void>,
  onOpen: (listener) => {
    const receive = (_event: Electron.IpcRendererEvent, value?: string | { id?: string; direct?: boolean; shipmentDocumentId?: string; type?: number | null }) => {
      const id = typeof value === "string" ? value : value?.id;
      const direct = typeof value === "object" && value?.direct === true;
      const shipmentId = typeof value === "object" && typeof value?.shipmentDocumentId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.shipmentDocumentId) ? value.shipmentDocumentId : undefined;
      listener(typeof id === "string" && id.length <= 100 ? id : undefined, direct, shipmentId, typeof value === "object" && (value?.type === null || (typeof value?.type === "number" && Number.isInteger(value.type))) ? value.type : undefined);
    };
    ipcRenderer.on("companion:open", receive);
    return () => { ipcRenderer.removeListener("companion:open", receive); };
  },
};
contextBridge.exposeInMainWorld("oryxCompanion", companionBridge);


const updateBridge: import("../../../shared/desktop-updates").DesktopUpdatesBridge = {
  status: () => ipcRenderer.invoke("updates:status"),
  open: () => ipcRenderer.invoke("updates:open"),
  onStatus: (listener) => {
    const receive = (_event: Electron.IpcRendererEvent, state: import("../../../shared/desktop-updates").DesktopUpdateState) => listener(state);
    ipcRenderer.on("updates:status", receive);
    return () => { ipcRenderer.removeListener("updates:status", receive); };
  },
};
contextBridge.exposeInMainWorld("oryxUpdates", updateBridge);
