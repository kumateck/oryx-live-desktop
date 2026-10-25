export enum CompanionMood { Calm, Curious, Happy, Alert, Thinking, Resting, Focused, Disconnected, Error }
export enum AlertPriority { Unspecified, Low, Medium, High, Critical }
export interface CompanionAlert { id: string; label: string; message: string; type: number | null; priority: AlertPriority; shipmentDocumentId?: string }
export interface CompanionSummary { unread: number; connected: boolean; signedIn: boolean; alerts?: CompanionAlert[] }
export interface CompanionView extends CompanionSummary { focused: boolean; quiet: boolean; roaming: boolean; showIndicators?: boolean; panelExpanded?: boolean }
export interface SystemAlert { id?: string; title: string; body: string }
export enum CompanionCommand { Show, Hide, QuietOn, QuietOff, RoamingOn, RoamingOff, ResetPosition, IndicatorsOn, IndicatorsOff }
export interface CompanionPreferences { visible: boolean; quiet: boolean; roaming: boolean; showIndicators: boolean }
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
  panel(expanded: boolean): void;
  drag(action: "start" | "move" | "end"): void;
  open(notificationId?: string, direct?: boolean): void;
  menu(): void;
  ready(): void;
}
