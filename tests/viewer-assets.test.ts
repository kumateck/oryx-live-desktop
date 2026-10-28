import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const engines = ["wordcraft", "pdfcraft", "gridcraft"] as const;
function release(root: string, revision: string) {
  mkdirSync(join(root, "assets"), { recursive: true });
  writeFileSync(join(root, "assets", `app-${revision}.js`), `release ${revision}`);
  for (const engine of engines) {
    const folder = join(root, "viewers", `${engine}-${revision}`);
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, `dodo-${engine}.js`), `engine ${revision}`);
    writeFileSync(join(folder, `dodo-${engine}_bg.wasm`), Buffer.from([0, 97, 115, 109, 1, 0, 0, 0]));
    writeFileSync(join(folder, "LICENSE"), "Redistribution notice");
  }
}
function keep(source: string, target: string) {
  return spawnSync("sh", ["deploy/keep-assets.sh", source, target], { encoding: "utf8" });
}

test("retains current and earlier viewer revisions together with app chunks and notices", () => {
  const root = mkdtempSync(join(tmpdir(), "oryx-viewer-release-"));
  try {
    const first = join(root, "first"), second = join(root, "second"), kept = join(root, "kept");
    release(first, "rev1"); release(second, "rev2");
    assert.equal(keep(first, kept).status, 0);
    assert.equal(keep(second, kept).status, 0);
    for (const revision of ["rev1", "rev2"]) {
      assert.equal(readFileSync(join(kept, `app-${revision}.js`), "utf8"), `release ${revision}`);
      for (const engine of engines) {
        const folder = join(kept, "viewers", `${engine}-${revision}`);
        assert.equal(readFileSync(join(folder, `dodo-${engine}.js`), "utf8"), `engine ${revision}`);
        assert.equal(readFileSync(join(folder, `dodo-${engine}_bg.wasm`)).subarray(0, 4).toString("hex"), "0061736d");
        assert.equal(readFileSync(join(folder, "LICENSE"), "utf8"), "Redistribution notice");
      }
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("refuses a release with missing or HTML-instead-of-WASM engine assets before copying", () => {
  const root = mkdtempSync(join(tmpdir(), "oryx-viewer-release-"));
  try {
    const source = join(root, "source"), kept = join(root, "kept");
    release(source, "rev1");
    const wasm = join(source, "viewers", "pdfcraft-rev1", "dodo-pdfcraft_bg.wasm");
    writeFileSync(wasm, "<!doctype html>");
    assert.notEqual(keep(source, kept).status, 0);
    assert.match(keep(source, kept).stderr, /invalid pdfcraft WASM/);
    rmSync(join(source, "viewers", "pdfcraft-rev1"), { recursive: true });
    assert.match(keep(source, kept).stderr, /missing pdfcraft directory/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
