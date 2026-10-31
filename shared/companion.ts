export enum CompanionMood { Calm, Curious, Happy, Alert, Thinking, Resting, Focused, Disconnected, Error }
export enum AlertPriority { Unspecified, Low, Medium, High, Critical }
/** `at` is the backend send time (ISO 8601) when known. */
export interface CompanionAlert { id: string; label: string; message: string; type: number | null; priority: AlertPriority; shipmentDocumentId?: string; at?: string }
export interface CompanionSummary { unread: number; connected: boolean; signedIn: boolean; alerts?: CompanionAlert[] }
export type CompanionSize = "small" | "medium" | "large";
export const companionSizes: readonly CompanionSize[] = ["small", "medium", "large"];
export interface CompanionView extends CompanionSummary { focused: boolean; quiet: boolean; roaming: boolean; showIndicators?: boolean; size?: CompanionSize; panelOpen?: boolean }
export interface SystemAlert { id?: string; title: string; body: string }
/** Append only: installed shells and site-delivered pages may be different versions. */
export enum CompanionCommand { Show, Hide, QuietOn, QuietOff, RoamingOn, RoamingOff, ResetPosition, IndicatorsOn, IndicatorsOff, SizeSmall, SizeMedium, SizeLarge }
/** `size` is absent from shells that predate size choices. */
export interface CompanionPreferences { visible: boolean; quiet: boolean; roaming: boolean; showIndicators: boolean; size?: CompanionSize }
export interface CompanionBridge {
  settings?(): Promise<CompanionPreferences>;
  command?(command: CompanionCommand): Promise<CompanionPreferences>;
  notify(value: SystemAlert): Promise<boolean>;
  summary(value: CompanionSummary): Promise<void>;
  onOpen(listener: (notificationId?: string, direct?: boolean, shipmentDocumentId?: string, type?: number | null) => void): () => void;
}
export interface PetBridge {
  onView(listener: (value: CompanionView) => void): () => void;
  interactive(value: boolean): void;
  /** Opens or closes the alerts panel beside the companion. */
  panel(open: boolean): void;
  drag(action: "start" | "move" | "end"): void;
  open(notificationId?: string, direct?: boolean): void;
  menu(): void;
  ready(): void;
  /** Pointer position over the companion window (DIP), reported by main; -1, -1 when it leaves. */
  onPointer?(listener: (point: { x: number; y: number }) => void): () => void;
}
/** What the alerts panel window shows: the full list, or one new alert as a short card. */
export type PanelState = { mode: "list"; view: CompanionView } | { mode: "card"; view: CompanionView; alertId: string };
export interface PanelBridge {
  onState(listener: (value: PanelState) => void): () => void;
  /** Opens the alert's record (or the notification list) in the main window. */
  open(notificationId?: string): void;
  /** Switches the card to the full list. */
  expand(): void;
  hover(value: boolean): void;
  close(): void;
  ready(): void;
}
