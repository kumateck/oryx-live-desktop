import { accentColor, type AccentName } from "./accent-presets.ts";

export type FontChoice = "system" | "sans" | "serif" | "mono";
export interface ThemeProfile { background: string; foreground: string; accent: AccentName; font: FontChoice }

const families: Record<FontChoice, string> = {
  system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", sans-serif',
  sans: 'Arial, Helvetica, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: 'ui-monospace, SFMono-Regular, Consolas, monospace',
};

export function fontFamily(choice: FontChoice): string { return families[choice]; }

function channels(hex: string): [number, number, number] {
  const channel = (index: number) => Number.parseInt(hex.slice(index, index + 2), 16);
  return [channel(1), channel(3), channel(5)];
}

function mix(first: string, second: string, amount: number): string {
  const a = channels(first);
  const b = channels(second);
  const output = a.map((value, index) => Math.round(value * (1 - amount) + (b[index] ?? 0) * amount));
  return `#${output.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

export function createPalette(profile: ThemeProfile, mode: "light" | "dark", contrast: number): Record<string, string> {
  const { background, foreground, accent } = profile;
  const intensity = 0.75 + contrast / 100 * 0.55;
  const surface = (amount: number) => mix(background, foreground, Math.min(amount * intensity, 1));
  return {
    "--canvas": background,
    "--text": foreground,
    "--brand": mode === "dark" ? `color-mix(in oklch, ${accentColor(accent, mode)} 70%, white)` : accentColor(accent, mode),
    "--header": surface(mode === "dark" ? 0.052 : 0.03),
    "--rail": surface(mode === "dark" ? 0.052 : 0.03),
    "--sidebar": surface(mode === "dark" ? 0.022 : 0.015),
    "--card": surface(mode === "dark" ? 0.04 : 0),
    "--border": surface(mode === "dark" ? 0.13 : 0.09),
    "--surface-border": surface(mode === "dark" ? 0.10 : 0.075),
    "--panel-divider": surface(mode === "dark" ? 0.13 : 0.12),
    "--empty-text": mix(background, foreground, mode === "dark" ? 0.40 : 0.50),
    "--hover": surface(mode === "dark" ? 0.13 : 0.055),
    "--selected": surface(mode === "dark" ? 0.14 : 0.07),
    "--text-muted": mix(background, foreground, mode === "dark" ? 0.7 : 0.56),
    "--soft": mix(background, foreground, mode === "dark" ? 0.53 : 0.45),
    "--focus": mode === "dark" ? "#89AFF0" : "#477CC6",
    "--background": background,
    "--foreground": foreground,
    "--card-foreground": foreground,
    "--popover": surface(mode === "dark" ? 0.065 : 0),
    "--popover-foreground": foreground,
    "--primary": accentColor(accent, mode),
    "--primary-foreground": accent === "yellow" ? "#181818" : "#FFFFFF",
    "--secondary": surface(mode === "dark" ? 0.12 : 0.07),
    "--secondary-foreground": foreground,
    "--muted": surface(mode === "dark" ? 0.13 : 0.055),
    "--muted-foreground": mix(background, foreground, mode === "dark" ? 0.7 : 0.56),
    "--accent": surface(mode === "dark" ? 0.14 : 0.07),
    "--accent-foreground": foreground,
    "--input": surface(mode === "dark" ? 0.16 : 0.09),
    "--ring": mode === "dark" ? "#89AFF0" : "#477CC6",
  };
}
