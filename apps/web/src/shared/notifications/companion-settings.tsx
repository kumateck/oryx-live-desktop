import { CompanionTestNotification } from "./companion-test-notification";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { CompanionCommand } from "../../../../../shared/companion";
import { useCompanionSettings } from "./use-companion-settings";

export function CompanionSettings() {
  const { state, saving, error, command, reload } = useCompanionSettings();
  return <section aria-labelledby="companion-settings-title">
    <h2 id="companion-settings-title" className="appearance-section-title">ORYX Companion</h2>
    <p className="appearance-description">Operations Watch keeps unread alerts visible while you work. These controls apply to this device.</p>
    {state.kind === "loading" ? <Skeleton className="h-28 w-full" /> : state.kind === "unavailable" ?
      <p className="text-sm text-muted-foreground">Companion controls are available in an updated Oryx desktop app. Your notification list works here.</p> : state.kind === "error" ?
      <p role="alert" className="text-sm text-destructive">{state.message} <Button variant="link" size="sm" onClick={() => void reload()}>Retry</Button></p> :
      <div className="divide-y rounded-lg border" aria-busy={saving}>
        <Preference label="Show companion" description="Keep ORYX above your other windows." pressed={state.preferences.visible} disabled={saving} onClick={() => void command(state.preferences.visible ? CompanionCommand.Hide : CompanionCommand.Show)} />
        <Preference label="Show alert details" description="Show the alert label, configured priority when provided, and unread count below ORYX." pressed={state.preferences.showIndicators} disabled={saving} onClick={() => void command(state.preferences.showIndicators ? CompanionCommand.IndicatorsOff : CompanionCommand.IndicatorsOn)} />
        <Preference label="Quiet movement" description="Keep the character still. System notifications and unread alerts continue." pressed={state.preferences.quiet} disabled={saving} onClick={() => void command(state.preferences.quiet ? CompanionCommand.QuietOff : CompanionCommand.QuietOn)} />
        <Preference label="Limited roaming" description="Small steps inside the companion’s own space when you are away from Oryx." pressed={state.preferences.roaming} disabled={saving} onClick={() => void command(state.preferences.roaming ? CompanionCommand.RoamingOff : CompanionCommand.RoamingOn)} />
        <div className="flex flex-wrap items-center justify-between gap-3 p-3"><p className="text-sm text-muted-foreground">Move ORYX back to the bottom-right of your main display.</p><Button variant="outline" size="sm" disabled={saving || !state.preferences.visible} onClick={() => void command(CompanionCommand.ResetPosition)}>Reset position</Button></div>
        <CompanionTestNotification />
      </div>}
    {error ? <p role="alert" className="mt-2 text-sm text-destructive">{error}</p> : null}
    <p className="mt-3 text-xs text-muted-foreground">Drag ORYX to reposition it. Right-click for quick controls. Closing Oryx to the tray keeps alerts running; use Quit Oryx to exit.</p>
  </section>;
}
function Preference({ label, description, pressed, disabled, onClick }: { label: string; description: string; pressed: boolean; disabled: boolean; onClick: () => void }) {
  return <div className="flex items-center justify-between gap-4 p-3"><div className="min-w-0"><p className="text-sm font-medium">{label}</p><p className="mt-1 text-xs text-muted-foreground">{description}</p></div><Button size="sm" variant={pressed ? "secondary" : "outline"} aria-label={label} aria-pressed={pressed} disabled={disabled} onClick={onClick}>{pressed ? "On" : "Off"}</Button></div>;
}
