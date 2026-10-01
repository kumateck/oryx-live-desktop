import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { createPalette, fontFamily, type ThemeProfile } from "./theme-tokens";
import { defaultThemeSettings, readSettings, saveSettings, type ResolvedTheme, type ThemeSettings } from "./theme-settings";

interface ThemeContextValue {
  settings: ThemeSettings;
  resolved: ResolvedTheme;
  update: (change: Partial<ThemeSettings>) => void;
  updateProfile: (theme: ResolvedTheme, change: Partial<ThemeProfile>) => void;
  toggle: () => void;
  reset: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(readSettings);
  const [system, setSystem] = useState<ResolvedTheme>(systemTheme);
  const resolved = settings.mode === "system" ? system : settings.mode;

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystem(media.matches ? "dark" : "light");
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const profile = settings.profiles[resolved];
    root.dataset.theme = resolved;
    root.classList.toggle("dark", resolved === "dark");
    root.dataset.motion = settings.reduceMotion;
    root.dataset.pointer = settings.pointerCursors ? "on" : "off";
    root.dataset.smoothing = settings.fontSmoothing ? "on" : "off";
    root.dataset.translucent = settings.translucentSidebar ? "on" : "off";
    root.style.fontFamily = fontFamily(profile.font);
    root.style.fontSize = `${settings.uiFontSize}px`;
    root.style.setProperty("--code-font-size", `${settings.codeFontSize}px`);
    root.style.setProperty("--content-font", fontFamily(settings.contentFont));
    root.style.setProperty("--code-font", fontFamily(settings.codeFont));
    for (const [name, value] of Object.entries(createPalette(profile, resolved, settings.contrast))) {
      root.style.setProperty(name, value);
    }
  }, [resolved, settings]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const value = useMemo<ThemeContextValue>(() => ({
    settings,
    resolved,
    update: (change) => setSettings((current) => ({ ...current, ...change })),
    updateProfile: (theme, change) => setSettings((current) => ({
      ...current,
      profiles: { ...current.profiles, [theme]: { ...current.profiles[theme], ...change } },
    })),
    toggle: () => setSettings((current) => ({ ...current, mode: resolved === "dark" ? "light" : "dark" })),
    reset: () => setSettings(defaultThemeSettings),
  }), [settings, resolved]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("ThemeProvider is missing");
  return context;
}
