import type { ThemeSettings } from "./theme-settings.ts";

type InterfaceSettings = Pick<ThemeSettings, "uiFontSize" | "headerFontSize" | "density" | "cornerRadius">;

/** Type size and density are independent: increasing text never shrinks its control. */
export function createInterfaceTokens(settings: InterfaceSettings): Record<string, string> {
  const comfortable = settings.density === "comfortable";
  const line = Math.ceil(settings.uiFontSize * 1.5);
  const control = Math.max(comfortable ? 36 : 30, line + 12);
  const radius = settings.cornerRadius;
  return {
    "--density-scale": comfortable ? "1.15" : "1",
    "--radius": `${radius}px`,
    "--card-radius": `${radius === 0 ? 0 : radius + 2}px`,
    "--radius-panel": `${radius === 0 ? 0 : radius + 4}px`,
    "--ui-font-size": `${settings.uiFontSize}px`,
    "--heading-font-size": `${settings.headerFontSize}px`,
    "--ui-line-height": `${line}px`,
    "--heading-line-height": `${Math.ceil(settings.headerFontSize * 1.4)}px`,
    "--control-height": `${control}px`,
    "--control-height-sm": `${Math.max(28, control - 2)}px`,
    "--control-height-xs": `${Math.max(24, control - 6)}px`,
    "--control-height-lg": `${control + 6}px`,
    "--card-padding": comfortable ? "18px" : "12px",
    "--layout-gap": comfortable ? "20px" : "12px",
    "--table-cell-y": comfortable ? "10px" : "6px",
    "--table-cell-x": comfortable ? "12px" : "10px",
    "--page-padding": comfortable ? "24px" : "16px",
    "--nav-item-y": comfortable ? "9px" : "6px",
    "--settings-row-height": comfortable ? "58px" : "46px",
  };
}
