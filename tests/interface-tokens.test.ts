import assert from "node:assert/strict";
import test from "node:test";
import { createInterfaceTokens } from "../apps/web/src/shared/theme/interface-tokens.ts";

test("font size and density remain independent and enlarged text fits its controls", () => {
  for (const density of ["compact", "comfortable"] as const) {
    for (const uiFontSize of [12, 16, 20]) {
      const tokens = createInterfaceTokens({ uiFontSize, headerFontSize: 14, cornerRadius: 6, density });
      const line = Number.parseInt(tokens["--ui-line-height"] ?? "0");
      const control = Number.parseInt(tokens["--control-height"] ?? "0");
      assert.equal(tokens["--heading-font-size"], "14px");
      assert.ok(control >= line + 12);
      assert.ok(Number.parseInt(tokens["--control-height-xs"] ?? "0") >= line);
    }
  }
  const compact = createInterfaceTokens({ uiFontSize: 12, headerFontSize: 14, cornerRadius: 6, density: "compact" });
  const comfortable = createInterfaceTokens({ uiFontSize: 12, headerFontSize: 14, cornerRadius: 6, density: "comfortable" });
  assert.equal(compact["--card-padding"], "12px");
  assert.equal(comfortable["--card-padding"], "18px");
  assert.equal(compact["--ui-font-size"], comfortable["--ui-font-size"]);
});

test("zero radius removes corners from controls, cards and panels", () => {
  const tokens = createInterfaceTokens({ uiFontSize: 12, headerFontSize: 14, density: "compact", cornerRadius: 0 });
  assert.equal(tokens["--radius"], "0px");
  assert.equal(tokens["--card-radius"], "0px");
  assert.equal(tokens["--radius-panel"], "0px");
});
