// Primary values mirror oryx-next/src/features/appearance/shadcn-themes.ts.
export const accentNames = ["amber", "blue", "cyan", "emerald", "fuchsia", "green", "indigo", "lime", "orange", "pink", "purple", "red", "rose", "sky", "teal", "violet", "yellow"] as const;
export type AccentName = typeof accentNames[number];

const presets: Record<AccentName, { light: string; dark: string }> = {
  amber: { light: "oklch(0.555 0.163 48.998)", dark: "oklch(0.473 0.137 46.201)" },
  blue: { light: "oklch(0.488 0.243 264.376)", dark: "oklch(0.424 0.199 265.638)" },
  cyan: { light: "oklch(0.52 0.105 223.128)", dark: "oklch(0.45 0.085 224.283)" },
  emerald: { light: "oklch(0.508 0.118 165.612)", dark: "oklch(0.432 0.095 166.913)" },
  fuchsia: { light: "oklch(0.518 0.253 323.949)", dark: "oklch(0.452 0.211 324.591)" },
  green: { light: "oklch(0.532 0.157 131.589)", dark: "oklch(0.453 0.124 130.933)" },
  indigo: { light: "oklch(0.457 0.24 277.023)", dark: "oklch(0.398 0.195 277.366)" },
  lime: { light: "oklch(0.532 0.157 131.589)", dark: "oklch(0.453 0.124 130.933)" },
  orange: { light: "oklch(0.553 0.195 38.402)", dark: "oklch(0.47 0.157 37.304)" },
  pink: { light: "oklch(0.525 0.223 3.958)", dark: "oklch(0.459 0.187 3.815)" },
  purple: { light: "oklch(0.496 0.265 301.924)", dark: "oklch(0.438 0.218 303.724)" },
  red: { light: "oklch(0.505 0.213 27.518)", dark: "oklch(0.444 0.177 26.899)" },
  rose: { light: "oklch(0.514 0.222 16.935)", dark: "oklch(0.455 0.188 13.697)" },
  sky: { light: "oklch(0.5 0.134 242.749)", dark: "oklch(0.443 0.11 240.79)" },
  teal: { light: "oklch(0.511 0.096 186.391)", dark: "oklch(0.437 0.078 188.216)" },
  violet: { light: "oklch(0.491 0.27 292.581)", dark: "oklch(0.432 0.232 292.759)" },
  yellow: { light: "oklch(0.852 0.199 91.936)", dark: "oklch(0.795 0.184 86.047)" },
};

export function accentColor(name: AccentName, mode: "light" | "dark"): string { return presets[name][mode]; }
export function accentLabel(name: AccentName): string { return name.charAt(0).toUpperCase() + name.slice(1); }
