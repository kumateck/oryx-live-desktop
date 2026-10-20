import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { unzipSync } from "fflate";
import { engineDirectory, engines, viewerPolicy, type DocumentFormat } from "../apps/web/src/shared/attachments/engines.ts";

const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
interface Provenance {
  policy: string;
  archive: string;
  revision: string;
  readonlyPatches: Record<string, string>;
  artifacts: Record<string, string>;
}
for (const format of Object.keys(engines) as DocumentFormat[]) {
  const engine = engines[format];
  test(`${engine.name} ships a content-addressed read-only WASM build with reviewed source patches`, () => {
    const directory = `viewers/${engine.name}`;
    const archive = readFileSync(`${directory}/vendor.bundle.zip`);
    assert.equal(hash(archive), engine.archive);
    assert.ok(engineDirectory(format).endsWith(engine.archive.slice(0, 12)));
    const entries = unzipSync(archive);
    const policy = entries["read-only.json"];
    assert.ok(policy);
    assert.equal(new TextDecoder().decode(policy), JSON.stringify({ policy: viewerPolicy, source: engine.revision }));
    for (const legacy of ["index.html", "editor.js", "editor.css"]) assert.equal(entries[legacy], undefined);
    const glue = entries[`dodo-${engine.name}.js`];
    const wasm = entries[`dodo-${engine.name}_bg.wasm`];
    assert.ok(glue); assert.ok(wasm);
    assert.doesNotMatch(new TextDecoder().decode(glue), /dodoDocument\.(?:save|dirty)/);
    assert.equal(Buffer.from(wasm.subarray(0, 4)).toString("hex"), "0061736d");
    assert.ok(Buffer.from(wasm).includes(Buffer.from("Attachments are read-only")));
    const provenance: Provenance = JSON.parse(readFileSync(`${directory}/provenance.json`, "utf8"));
    assert.equal(provenance.policy, viewerPolicy);
    assert.equal(provenance.archive, engine.archive);
    assert.equal(provenance.revision, engine.revision);
    assert.equal(provenance.artifacts[`dodo-${engine.name}.js`], hash(glue));
    assert.equal(provenance.artifacts[`dodo-${engine.name}_bg.wasm`], hash(wasm));
    const patches = readdirSync(`${directory}/adapter`).filter((name) => name.startsWith("readonly-")).sort();
    assert.deepEqual(Object.keys(provenance.readonlyPatches).sort(), patches);
    for (const patch of patches) assert.equal(provenance.readonlyPatches[patch], hash(readFileSync(`${directory}/adapter/${patch}`)));
    const adapter = readFileSync(`${directory}/adapter/main.rs`, "utf8");
    assert.match(adapter, /session\.read_only = true/);
    assert.doesNotMatch(adapter, /checkpoint|workspace_save|native::saver|file\.save/);
  });
}
