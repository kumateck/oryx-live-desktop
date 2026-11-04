/** Only navigation commands; the remote renderer cannot invoke native history or arbitrary IPC. */
export type WorkspaceNavigationCommand = "back" | "forward" | "home" | "new-tab" | "close-tab";
export interface DesktopWorkspaceBridge {
  onNavigate(listener: (command: WorkspaceNavigationCommand) => void): () => void;
}
