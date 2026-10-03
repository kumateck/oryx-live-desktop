import { app, Menu, type MenuItemConstructorOptions } from "electron";

/** What the menu bar can ask the shell to do. Each is one explicit action; none runs on its own. */
export interface MenuActions {
  /** The server the window is connected to, or "" when none is set. */
  siteUrl: string;
  reconnect: () => void;
  changeServer: () => void;
  forgetServer: () => void;
  home: () => void;
  back: () => void;
  forward: () => void;
  print: () => void;
}

function serverMenu(actions: MenuActions): MenuItemConstructorOptions {
  const connected = Boolean(actions.siteUrl);
  return { label: "Server", submenu: [
    { label: connected ? `Connected to ${actions.siteUrl}` : "Not connected", enabled: false },
    { type: "separator" },
    { label: "Reconnect", accelerator: "CmdOrCtrl+Shift+R", enabled: connected, click: actions.reconnect },
    { label: "Change Server…", accelerator: "CmdOrCtrl+Shift+S", click: actions.changeServer },
    { type: "separator" },
    { label: "Forget Server…", enabled: connected, click: actions.forgetServer },
  ] };
}

/** The menu bar: the app's own menu on macOS, then File, Server, Edit, View, Go and Window. Rebuilt whenever the server changes. */
export function buildMenu(actions: MenuActions): void {
  const connected = Boolean(actions.siteUrl);
  const mac = process.platform === "darwin";
  const template: MenuItemConstructorOptions[] = [
    ...(mac ? [{ label: app.name, submenu: [{ role: "about" }, { type: "separator" }, { role: "hide" }, { role: "hideOthers" }, { role: "unhide" }, { type: "separator" }, { role: "quit" }] } satisfies MenuItemConstructorOptions] : []),
    { label: "File", submenu: [{ label: "Print…", accelerator: "CmdOrCtrl+P", enabled: connected, click: actions.print }, { type: "separator" }, mac ? { role: "close" } : { role: "quit" }] },
    serverMenu(actions),
    { role: "editMenu" },
    { label: "View", submenu: [{ role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" }, { type: "separator" }, { role: "togglefullscreen" },
      ...(app.isPackaged ? [] : [{ type: "separator" }, { role: "toggleDevTools" }] satisfies MenuItemConstructorOptions[])] },
    { label: "Go", submenu: [
      { label: "Back", accelerator: mac ? "Cmd+[" : "Alt+Left", enabled: connected, click: actions.back },
      { label: "Forward", accelerator: mac ? "Cmd+]" : "Alt+Right", enabled: connected, click: actions.forward },
      { type: "separator" },
      { label: "Home", accelerator: "CmdOrCtrl+Shift+H", enabled: connected, click: actions.home },
    ] },
    { role: "windowMenu" },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
