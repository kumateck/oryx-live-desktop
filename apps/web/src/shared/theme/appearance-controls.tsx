import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { accentColor, accentLabel, accentNames, type AccentName } from "./accent-presets";
import type { ResolvedTheme } from "./theme-settings";
import type { FontChoice } from "./theme-tokens";

const fontChoices: readonly FontChoice[] = ["system", "sans", "serif", "mono"];
const fontLabel = (choice: FontChoice) => choice.charAt(0).toUpperCase() + choice.slice(1);

export function SettingRow({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <div className="appearance-row"><div><strong>{label}</strong>{hint && <span className="appearance-hint">{hint}</span>}</div><div className="appearance-control">{children}</div></div>;
}

export function FontSelect({ value, onChange, label }: { value: FontChoice; onChange: (value: FontChoice) => void; label: string }) {
  return <Select value={value} onValueChange={(next) => { if (fontChoices.some((choice) => choice === next)) onChange(next as FontChoice); }}>
    <SelectTrigger size="sm" aria-label={label}><SelectValue /></SelectTrigger>
    <SelectContent>{fontChoices.map((choice) => <SelectItem key={choice} value={choice}>{fontLabel(choice)}</SelectItem>)}</SelectContent>
  </Select>;
}

export function ColorControl({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="color-control"><Input aria-label={label} type="color" value={value} onChange={(event) => onChange(event.target.value)} /><span>{value.toUpperCase()}</span></label>;
}

export function AccentSelect({ theme, value, onChange }: { theme: ResolvedTheme; value: AccentName; onChange: (value: AccentName) => void }) {
  return <Select value={value} onValueChange={(next) => { if (accentNames.some((name) => name === next)) onChange(next as AccentName); }}>
    <SelectTrigger size="sm" aria-label={`${theme} accent`} className="accent-trigger"><SelectValue /></SelectTrigger>
    <SelectContent className="accent-menu">{accentNames.map((name) => <SelectItem key={name} value={name}>
      <span className="accent-swatch" style={{ background: accentColor(name, theme) }} />{accentLabel(name)}
    </SelectItem>)}</SelectContent>
  </Select>;
}
