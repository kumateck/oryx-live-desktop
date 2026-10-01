import test from "node:test";
import assert from "node:assert/strict";
import { buildTree, generateSource, segmentFor } from "../scripts/routes/model.ts";

test("maps groups, params, and catch-alls", () => {
  assert.equal(segmentFor("(private)"), null);
  assert.equal(segmentFor("[recordId]"), ":recordId");
  assert.equal(segmentFor("[...rest]"), "*");
  assert.throws(() => segmentFor("[bad-name]"), /Invalid/);
});

test("generates nested layout and lazy pages in stable order", () => {
  const files = ["(private)/records/[id]/page.tsx", "page.tsx", "(private)/layout.tsx", "(private)/records/page.tsx"];
  const source = generateSource(files);
  assert.equal(source, generateSource([...files].reverse()));
  assert.match(source, /path: ":id"/);
  assert.match(source, /import\("\.\.\/pages\/\(private\)\/layout"\)/);
  assert.match(source, /index: true, lazy:/);
});

test("rejects duplicate effective URLs through route groups", () => {
  assert.throws(() => buildTree(["(a)/records/page.tsx", "(b)/records/page.tsx"]), /Route collision/);
});

test("rejects ambiguous dynamic siblings and nonterminal catch-alls", () => {
  assert.throws(() => buildTree(["[id]/page.tsx", "[name]/page.tsx"]), /Ambiguous/);
  assert.throws(() => buildTree(["[...rest]/child/page.tsx"]), /Catch-all/);
});

test("rejects duplicate extensions in one route folder", () => {
  assert.throws(() => buildTree(["page.ts", "page.tsx"]), /Duplicate page/);
});
