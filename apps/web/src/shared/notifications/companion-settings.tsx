import { CompanionTestNotification } from "./companion-test-notification";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { SettingRow } from "../theme/appearance-controls";
import { CompanionCommand, type CompanionPreferences, type CompanionSize } from "../../../../../shared/companion";
import { useCompanionSettings } from "./use-companion-settings";

type Movement = "still" | "subtle" | "playful";
const sizes: readonly (readonly [CompanionSize, string, CompanionCommand])[] = [
  ["small", "Small", CompanionCommand.SizeSmall], ["medium", "Medium", CompanionCommand.SizeMedium], ["large", "Large", CompanionCommand.SizeLarge],
];
/** Movement is stored as the shell's quiet and roaming switches, so older shells support it too. */
const movements: readonly (readonly [Movement, string, CompanionCommand[]])[] = [
  ["still", "Still", [CompanionCommand.QuietOn]],
  ["subtle", "Subtle", [CompanionCommand.QuietOff, CompanionCommand.RoamingOff]],
  ["playful", "Playful", [CompanionCommand.QuietOff, CompanionCommand.RoamingOn]],
];
const movementHints: Record<Movement, string> = {
  still: "ORYX holds still. Alerts and the unread badge still appear.",
  subtle: "Blinks and looks around, but stays in place.",
  playful: "Also takes a few steps when you are away from Oryx.",
};
const movementOf = (preferences: CompanionPreferences): Movement => preferences.quiet ? "still" : preferences.roaming ? "playful" : "subtle";

export function CompanionSettings() {
  const { state, saving, error, command, reload } = useCompanionSettings();
  return <section aria-labelledby="companion-settings-title">
    <h2 id="companion-settings-title" className="appearance-section-title">ORYX Companion</h2>
    <p className="appearance-description">A small ORYX that stays on your desktop and shows your unread alerts. Click it to see them, drag it anywhere, right-click for options. These settings apply to this device.</p>
    {state.kind === "loading" ? <Skeleton className="h-48 w-full" /> : state.kind === "unavailable" ?
      <p className="text-sm text-muted-foreground">Companion controls are available in an updated Oryx desktop app. Your notification list works here.</p> : state.kind === "error" ?
      <p role="alert" className="text-sm text-destructive">{state.message} <Button variant="link" size="sm" onClick={() => void reload()}>Retry</Button></p> :
      <Preferences preferences={state.preferences} saving={saving} command={command} />}
    {error ? <p role="alert" className="mt-2 text-sm text-destructive">{error}</p> : null}
    <p className="mt-3 text-xs text-muted-foreground">Closing Oryx to the tray keeps alerts running; use Quit Oryx to exit.</p>
  </section>;
}

function Preferences({ preferences, saving, command }: { preferences: CompanionPreferences; saving: boolean; command: (...actions: CompanionCommand[]) => Promise<void> }) {
  const movement = movementOf(preferences);
  const off = !preferences.visible;
  return <>
    <div className="appearance-card" aria-busy={saving}>
      <SettingRow label="Show ORYX on the desktop" hint="Keeps ORYX above your other windows.">
        <Switch aria-label="Show ORYX on the desktop" checked={preferences.visible} disabled={saving} onCheckedChange={(on) => void command(on ? CompanionCommand.Show : CompanionCommand.Hide)} />
      </SettingRow>
      {preferences.size ? <SettingRow label="Size">
        <Choices label="Size" disabled={saving || off} value={preferences.size} options={sizes.map(([value, text, action]) => ({ value, text, pick: () => void command(action) }))} />
      </SettingRow> : null}
      <SettingRow label="Movement" hint={movementHints[movement]}>
        <Choices label="Movement" disabled={saving || off} value={movement} options={movements.map(([value, text, actions]) => ({ value, text, pick: () => void command(...actions) }))} />
      </SettingRow>
      <SettingRow label="New alert cards" hint="Show a short card beside ORYX when an alert arrives.">
        <Switch aria-label="New alert cards" checked={preferences.showIndicators} disabled={saving || off} onCheckedChange={(on) => void command(on ? CompanionCommand.IndicatorsOn : CompanionCommand.IndicatorsOff)} />
      </SettingRow>
      <SettingRow label="Position" hint="Move ORYX back to the bottom-right of your main display.">
        <Button variant="outline" size="sm" disabled={saving || off} onClick={() => void command(CompanionCommand.ResetPosition)}>Reset position</Button>
      </SettingRow>
    </div>
    <div className="appearance-card"><CompanionTestNotification /></div>
  </>;
}

function Choices<T extends string>({ label, value, options, disabled }: { label: string; value: T; disabled: boolean; options: { value: T; text: string; pick: () => void }[] }) {
  return <div className="mode-options" role="group" aria-label={label}>
    {options.map((option) => <Button key={option.value} size="sm" variant={value === option.value ? "secondary" : "ghost"} aria-pressed={value === option.value} disabled={disabled} onClick={() => { if (value !== option.value) option.pick(); }}>{option.text}</Button>)}
  </div>;
}
