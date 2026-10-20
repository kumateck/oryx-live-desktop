// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppearanceSettings } from "./appearance-settings";
import { ThemeProvider } from "./theme-provider";
import { defaultThemeSettings, readSettings } from "./theme-settings";

const key = "oryx-appearance-v1";

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
    matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("interface preferences", () => {
  it("defaults to compact 12px body and 14px headers", () => {
    expect(readSettings()).toMatchObject({ uiFontSize: 12, headerFontSize: 14, density: "compact" });
  });

  it("migrates old preferences without discarding custom colors or type", () => {
    const { headerFontSize, density, ...legacy } = defaultThemeSettings;
    localStorage.setItem(key, JSON.stringify({ ...legacy, uiFontSize: 16, mode: "dark" }));
    expect(readSettings()).toMatchObject({
      uiFontSize: 16, headerFontSize: 14, density: "compact", mode: "dark",
      profiles: legacy.profiles,
    });
  });

  it("recovers from corrupt or out-of-range saved preferences", () => {
    localStorage.setItem(key, "{broken");
    expect(readSettings()).toEqual(defaultThemeSettings);
    localStorage.setItem(key, JSON.stringify({ ...defaultThemeSettings, headerFontSize: 100 }));
    expect(readSettings()).toEqual(defaultThemeSettings);
  });

  it("applies type independently, persists changes and resets all interface defaults", () => {
    render(<ThemeProvider><AppearanceSettings /></ThemeProvider>);
    fireEvent.change(screen.getByRole("spinbutton", { name: "Body font size" }), { target: { value: "16" } });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Header font size" }), { target: { value: "18" } });
    expect(document.documentElement.style.getPropertyValue("--ui-font-size")).toBe("16px");
    expect(document.documentElement.style.getPropertyValue("--heading-font-size")).toBe("18px");
    expect(document.documentElement.style.getPropertyValue("--control-height")).toBe("36px");
    expect(readSettings()).toMatchObject({ uiFontSize: 16, headerFontSize: 18 });
    cleanup();
    render(<ThemeProvider><AppearanceSettings /></ThemeProvider>);
    expect(screen.getByRole("spinbutton", { name: "Body font size" }).getAttribute("value")).toBe("16");
    fireEvent.click(screen.getByRole("button", { name: "Reset to default" }));
    expect(readSettings()).toEqual(defaultThemeSettings);
    expect(document.documentElement.style.getPropertyValue("--heading-font-size")).toBe("14px");
  });

  it("restores comfortable density on reload and updates controls and cards", () => {
    localStorage.setItem(key, JSON.stringify({ ...defaultThemeSettings, density: "comfortable" }));
    render(<ThemeProvider><AppearanceSettings /></ThemeProvider>);
    expect(document.documentElement.dataset.density).toBe("comfortable");
    expect(document.documentElement.style.getPropertyValue("--control-height")).toBe("36px");
    expect(document.documentElement.style.getPropertyValue("--card-padding")).toBe("18px");
    fireEvent.click(screen.getByRole("button", { name: "Reset to default" }));
    expect(document.documentElement.dataset.density).toBe("compact");
    expect(document.documentElement.style.getPropertyValue("--card-padding")).toBe("12px");
  });

  it("applies sharp corners to all shared surface tokens and persists them", () => {
    render(<ThemeProvider><AppearanceSettings /></ThemeProvider>);
    fireEvent.change(screen.getByRole("spinbutton", { name: "Corner radius" }), { target: { value: "0" } });
    for (const token of ["--radius", "--card-radius", "--radius-panel"]) {
      expect(document.documentElement.style.getPropertyValue(token)).toBe("0px");
    }
    expect(readSettings().cornerRadius).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "Reset to default" }));
    expect(readSettings().cornerRadius).toBe(6);
  });

  it("clamps typed sizes and ignores empty intermediate input", () => {
    render(<ThemeProvider><AppearanceSettings /></ThemeProvider>);
    const input = screen.getByRole("spinbutton", { name: "Body font size" });
    fireEvent.change(input, { target: { value: "" } });
    expect(readSettings().uiFontSize).toBe(12);
    fireEvent.change(input, { target: { value: "100" } });
    expect(readSettings().uiFontSize).toBe(20);
  });
});
