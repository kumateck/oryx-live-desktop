import { contextBridge, ipcRenderer } from "electron";
import type { CompanionView, PetBridge } from "./contract";
const bridge: PetBridge = {
  onView: (listener) => {
    const receive = (_event: Electron.IpcRendererEvent, value: CompanionView) => listener(value);
    ipcRenderer.on("pet:view", receive);
    return () => { ipcRenderer.removeListener("pet:view", receive); };
  },
  interactive: (value) => { ipcRenderer.send("pet:interactive", value); },
  panel: (expanded) => { ipcRenderer.send("pet:panel", expanded); },
  drag: (action) => { ipcRenderer.send("pet:drag", action); },
  open: (notificationId, direct) => { ipcRenderer.send("pet:open", { id: notificationId, direct }); },
  menu: () => { ipcRenderer.send("pet:menu"); },
  ready: () => { ipcRenderer.send("pet:ready"); },
};
contextBridge.exposeInMainWorld("oryxPet", bridge);
