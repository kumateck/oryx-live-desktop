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
