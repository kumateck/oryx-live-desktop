import { z } from "zod";
import { accentNames } from "./accent-presets.ts";

const modeSchema = z.enum(["system", "light", "dark"]);
const fontSchema = z.enum(["system", "sans", "serif", "mono"]);
const hexSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const profileSchema = z.object({ background: hexSchema, foreground: hexSchema, accent: z.enum(accentNames), font: fontSchema });
const settingsSchema = z.object({
  mode: modeSchema,
  separateModes: z.boolean(),
  profiles: z.object({ light: profileSchema, dark: profileSchema }),
  uiFontSize: z.number().int().min(12).max(20),
  headerFontSize: z.number().int().min(12).max(24).default(14),
  cornerRadius: z.number().int().min(0).max(16).default(6),
  density: z.enum(["compact", "comfortable"]).default("compact"),
  codeFontSize: z.number().int().min(10).max(20),
  contentFont: fontSchema,
  codeFont: fontSchema,
  reduceMotion: z.enum(["system", "on", "off"]),
  translucentSidebar: z.boolean(),
  contrast: z.number().int().min(0).max(100),
  pointerCursors: z.boolean(),
  fontSmoothing: z.boolean(),
});

export type ThemeMode = z.infer<typeof modeSchema>;
export type ResolvedTheme = "light" | "dark";
export type ThemeSettings = z.infer<typeof settingsSchema>;

export const defaultThemeSettings: ThemeSettings = {
  mode: "system",
  separateModes: false,
  profiles: {
    light: { background: "#FFFFFF", foreground: "#1A1C1F", accent: "lime", font: "system" },
    dark: { background: "#181818", foreground: "#FFFFFF", accent: "lime", font: "system" },
  },
  uiFontSize: 12,
  headerFontSize: 14,
  density: "compact",
  cornerRadius: 6,
  codeFontSize: 12,
  contentFont: "system",
  codeFont: "system",
  reduceMotion: "system",
  translucentSidebar: false,
  contrast: 45,
  pointerCursors: true,
  fontSmoothing: true,
};

const storageKey = "oryx-appearance-v1";

export function readSettings(): ThemeSettings {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const result = settingsSchema.safeParse(JSON.parse(stored));
      if (result.success) return result.data;
    }
  } catch { /* invalid or unavailable storage uses safe defaults */ }
  return defaultThemeSettings;
}

export function saveSettings(settings: ThemeSettings): void {
  try { localStorage.setItem(storageKey, JSON.stringify(settings)); } catch { /* preference stays in memory */ }
}
