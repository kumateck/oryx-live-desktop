import { CompanionSettings } from "../notifications/companion-settings";
import { ChevronDown, ChevronRight } from "lucide-react";
import { InterfaceSettings } from "./interface-settings";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { AccentSelect, ColorControl, FontSelect, SettingRow } from "./appearance-controls";
import { useTheme } from "./theme-provider";
import type { ResolvedTheme, ThemeMode } from "./theme-settings";
import type { ThemeProfile } from "./theme-tokens";
import "./appearance.css";

function ProfileControls({ profile, theme, update }: { profile: ThemeProfile; theme: ResolvedTheme; update: (theme: ResolvedTheme, change: Partial<ThemeProfile>) => void }) {
  return <div className="appearance-card">
    <SettingRow label="Accent"><AccentSelect theme={theme} value={profile.accent} onChange={(accent) => update(theme, { accent })} /></SettingRow>
    <SettingRow label="Background"><ColorControl label={`${theme} background`} value={profile.background} onChange={(background) => update(theme, { background })} /></SettingRow>
    <SettingRow label="Foreground"><ColorControl label={`${theme} foreground`} value={profile.foreground} onChange={(foreground) => update(theme, { foreground })} /></SettingRow>
    <SettingRow label="Font"><FontSelect label={`${theme} UI font`} value={profile.font} onChange={(font) => update(theme, { font })} /></SettingRow>
  </div>;
}

function AdvancedSettings({ setEditing }: { setEditing: (theme: ResolvedTheme) => void }) {
  const theme = useTheme();
  const { settings } = theme;
  return <div className="advanced-groups">
    <div className="appearance-card">
      <SettingRow label="Reduce motion" hint="Reduce animations or match your system"><Select value={settings.reduceMotion} onValueChange={(value) => { if (value === "system" || value === "on" || value === "off") theme.update({ reduceMotion: value }); }}><SelectTrigger size="sm" aria-label="Reduce motion"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="system">System</SelectItem><SelectItem value="on">On</SelectItem><SelectItem value="off">Off</SelectItem></SelectContent></Select></SettingRow>
      <SettingRow label="Separate light and dark modes" hint="Customize colors and font for each mode"><Switch aria-label="Separate light and dark modes" checked={settings.separateModes} onCheckedChange={(checked) => { theme.update({ separateModes: checked }); setEditing(theme.resolved); }} /></SettingRow>
    </div>
    <div className="appearance-card">
      <SettingRow label="Content font"><FontSelect label="Content font" value={settings.contentFont} onChange={(contentFont) => theme.update({ contentFont })} /></SettingRow>
      <SettingRow label="Code font"><FontSelect label="Code font" value={settings.codeFont} onChange={(codeFont) => theme.update({ codeFont })} /></SettingRow>
      <SettingRow label="Translucent sidebar"><Switch aria-label="Translucent sidebar" checked={settings.translucentSidebar} onCheckedChange={(translucentSidebar) => theme.update({ translucentSidebar })} /></SettingRow>
      <SettingRow label="Contrast"><Slider aria-label="Contrast" min={0} max={100} value={[settings.contrast]} onValueChange={(values) => theme.update({ contrast: values[0] ?? 45 })} /><span>{settings.contrast}</span></SettingRow>
      <SettingRow label="Use pointer cursors"><Switch aria-label="Use pointer cursors" checked={settings.pointerCursors} onCheckedChange={(pointerCursors) => theme.update({ pointerCursors })} /></SettingRow>
      <SettingRow label="Font smoothing"><Switch aria-label="Font smoothing" checked={settings.fontSmoothing} onCheckedChange={(fontSmoothing) => theme.update({ fontSmoothing })} /></SettingRow>
    </div>
  </div>;
}

export function AppearanceSettings() {
  const theme = useTheme();
  const { settings } = theme;
  const [advanced, setAdvanced] = useState(false);
  const [editing, setEditing] = useState<ResolvedTheme>(theme.resolved);
  const profileTheme = settings.separateModes ? editing : theme.resolved;
  return <section className="appearance-page" aria-labelledby="appearance-title">
    <h1 id="appearance-title">Appearance</h1>
    <p className="appearance-description">Choose how your workspace looks. Changes save automatically on this device.</p>
    <InterfaceSettings />
    <CompanionSettings />
    <h2 className="appearance-section-title">Visual style</h2>
    <div className="appearance-card mode-card"><SettingRow label="Mode"><div className="mode-options" role="group" aria-label="Theme mode">
      {(["system", "light", "dark"] as const).map((mode: ThemeMode) => <Button key={mode} size="sm" variant={settings.mode === mode ? "secondary" : "ghost"} aria-pressed={settings.mode === mode} onClick={() => theme.update({ mode })}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</Button>)}
    </div></SettingRow></div>
    {settings.separateModes && <div className="profile-tabs" role="group" aria-label="Edit color profile">{(["light", "dark"] as const).map((mode) => <Button key={mode} size="sm" variant={editing === mode ? "secondary" : "ghost"} aria-pressed={editing === mode} onClick={() => setEditing(mode)}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</Button>)}</div>}
    <ProfileControls profile={settings.profiles[profileTheme]} theme={profileTheme} update={theme.updateProfile} />
    <div className="advanced-heading"><Button size="sm" variant="ghost" aria-expanded={advanced} onClick={() => setAdvanced((value) => !value)}>Advanced {advanced ? <ChevronDown aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}</Button><Button size="sm" variant="ghost" onClick={theme.reset}>Reset to default</Button></div>
    {advanced && <AdvancedSettings setEditing={setEditing} />}
  </section>;
}
