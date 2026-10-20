import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SettingRow } from "./appearance-controls";
import { useTheme } from "./theme-provider";
import { InterfacePreview } from "./interface-preview";

export function InterfaceSettings() {
  const { settings, update } = useTheme();
  return <section aria-labelledby="interface-settings-title">
    <h2 id="interface-settings-title" className="appearance-section-title">Typography and density</h2>
    <div className="appearance-card">
      <SettingRow label="Body font size" hint="Text, labels, menus and table rows">
        <Input aria-label="Body font size" type="number" min={12} max={20} step={1}
          value={settings.uiFontSize} onChange={(event) => {
            const value = event.currentTarget.valueAsNumber;
            if (Number.isFinite(value)) update({ uiFontSize: Math.min(20, Math.max(12, Math.round(value))) });
          }} /> px
      </SettingRow>
      <SettingRow label="Header font size" hint="Page, card, section and dialog titles">
        <Input aria-label="Header font size" type="number" min={12} max={24} step={1}
          value={settings.headerFontSize} onChange={(event) => {
            const value = event.currentTarget.valueAsNumber;
            if (Number.isFinite(value)) update({ headerFontSize: Math.min(24, Math.max(12, Math.round(value))) });
          }} /> px
      </SettingRow>
      <SettingRow label="Density" hint="Spacing in cards, tables and controls">
        <Select value={settings.density} onValueChange={(density) => {
          if (density === "compact" || density === "comfortable") update({ density });
        }}>
          <SelectTrigger aria-label="Density"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="compact">Compact</SelectItem>
            <SelectItem value="comfortable">Comfortable</SelectItem></SelectContent>
        </Select>
      </SettingRow>
      <SettingRow label="Corner radius" hint="Set to 0 for sharp edges; applies across the workspace">
        <Input aria-label="Corner radius" type="number" min={0} max={16} step={1}
          value={settings.cornerRadius} onChange={(event) => {
            const value = event.currentTarget.valueAsNumber;
            if (Number.isFinite(value)) update({ cornerRadius: Math.min(16, Math.max(0, Math.round(value))) });
          }} /> px
      </SettingRow>
      <SettingRow label="Code font size" hint="Code and technical values">
        <Input aria-label="Code font size" type="number" min={10} max={20} step={1}
          value={settings.codeFontSize} onChange={(event) => {
            const value = event.currentTarget.valueAsNumber;
            if (Number.isFinite(value)) update({ codeFontSize: Math.min(20, Math.max(10, Math.round(value))) });
          }} /> px
      </SettingRow>
    </div>
    <InterfacePreview />
  </section>;
}
