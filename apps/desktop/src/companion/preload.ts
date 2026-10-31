import { contextBridge, ipcRenderer } from "electron";
import type { CompanionView, PanelBridge, PanelState, PetBridge } from "./contract";
/** Shared by the companion and its alerts panel; main accepts each channel only from its own window. */
const bridge: PetBridge = {
  onView: (listener) => {
    const receive = (_event: Electron.IpcRendererEvent, value: CompanionView) => listener(value);
    ipcRenderer.on("pet:view", receive);
    return () => { ipcRenderer.removeListener("pet:view", receive); };
  },
  interactive: (value) => { ipcRenderer.send("pet:interactive", value); },
  panel: (open) => { ipcRenderer.send("pet:panel", open); },
  drag: (action) => { ipcRenderer.send("pet:drag", action); },
  open: (notificationId, direct) => { ipcRenderer.send("pet:open", { id: notificationId, direct }); },
  menu: () => { ipcRenderer.send("pet:menu"); },
  ready: () => { ipcRenderer.send("pet:ready"); },
  onPointer: (listener) => {
    const receive = (_event: Electron.IpcRendererEvent, value: { x: number; y: number }) => listener(value);
    ipcRenderer.on("pet:pointer", receive);
    return () => { ipcRenderer.removeListener("pet:pointer", receive); };
  },
};
const panel: PanelBridge = {
  onState: (listener) => {
    const receive = (_event: Electron.IpcRendererEvent, value: PanelState) => listener(value);
    ipcRenderer.on("panel:state", receive);
    return () => { ipcRenderer.removeListener("panel:state", receive); };
  },
  open: (notificationId) => { ipcRenderer.send("panel:open", notificationId); },
  expand: () => { ipcRenderer.send("panel:expand"); },
  hover: (value) => { ipcRenderer.send("panel:hover", value); },
  close: () => { ipcRenderer.send("panel:close"); },
  ready: () => { ipcRenderer.send("panel:ready"); },
};
contextBridge.exposeInMainWorld("oryxPet", bridge);
contextBridge.exposeInMainWorld("oryxPanel", panel);
