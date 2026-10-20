import assert from "node:assert/strict";
import test from "node:test";
import { createPalette, fontFamily } from "../apps/web/src/shared/theme/theme-tokens.ts";
import { accentColor, accentNames } from "../apps/web/src/shared/theme/accent-presets.ts";

test("light and dark profiles preserve exact configured base colors", () => {
  const light = createPalette({ background: "#FFFFFF", foreground: "#1A1C1F", accent: "lime", font: "system" }, "light", 45);
  const dark = createPalette({ background: "#181818", foreground: "#FFFFFF", accent: "lime", font: "system" }, "dark", 45);
  assert.equal(light["--canvas"], "#FFFFFF");
  assert.equal(light["--text"], "#1A1C1F");
  assert.equal(dark["--canvas"], "#181818");
  assert.equal(dark["--text"], "#FFFFFF");
  assert.equal(dark["--primary"], accentColor("lime", "dark"));
  assert.match(dark["--brand"] ?? "", /color-mix/);
  assert.notEqual(light["--sidebar"], dark["--sidebar"]);
});

test("surface tones follow a customized background and contrast setting", () => {
  const profile = { background: "#102030", foreground: "#FFFFFF", accent: "teal", font: "system" } as const;
  const low = createPalette(profile, "dark", 0);
  const high = createPalette(profile, "dark", 100);
  assert.equal(low["--canvas"], "#102030");
  assert.equal(high["--primary"], accentColor("teal", "dark"));
  assert.notEqual(low["--border"], high["--border"]);
  assert.equal(fontFamily("system"), "var(--font-family-system)");
});

test("accent list matches the seventeen Oryx Next theme colors", () => {
  assert.deepEqual(accentNames, ["amber", "blue", "cyan", "emerald", "fuchsia", "green", "indigo", "lime", "orange", "pink", "purple", "red", "rose", "sky", "teal", "violet", "yellow"]);
});
