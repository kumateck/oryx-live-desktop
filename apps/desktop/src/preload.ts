import { contextBridge, ipcRenderer } from "electron";
import type { ConnectionBridge, SiteStatus } from "./bridge";

const bridge: ConnectionBridge = {
  getStatus: () => ipcRenderer.invoke("site:get-status") as Promise<SiteStatus>,
  setSiteUrl: (url: string) => ipcRenderer.invoke("site:set-url", url) as Promise<SiteStatus>,
};

contextBridge.exposeInMainWorld("oryxConnection", bridge);
