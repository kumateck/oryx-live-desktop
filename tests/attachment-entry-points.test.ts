import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import ts from "typescript";

/** Attachment files must be fetched and rendered by the isolated shared host, never embedded directly by a page. */
test("all application page sources use the shared isolated attachment frame", async () => {
  const root = join(process.cwd(), "apps/web/src");
  const files = (await readdir(root, { recursive: true })).map((path) => path.replaceAll("\\", "/")).filter((path) => path.endsWith(".tsx") && !path.includes(".test.") && !path.includes("/generated/"));
  const embedded: string[] = [];
  for (const path of files) {
    const source = await readFile(join(root, path), "utf8");
    const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const visit = (node: ts.Node) => {
      if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && ["iframe", "object", "embed"].includes(node.tagName.getText(ast))) embedded.push(path);
      if (ts.isCallExpression(node) && /(?:^|\.)createElement$/.test(node.expression.getText(ast))) {
        const tag = node.arguments[0];
        if (tag && ts.isStringLiteral(tag) && ["iframe", "object", "embed"].includes(tag.text)) embedded.push(path);
      }
      ts.forEachChild(node, visit);
    };
    visit(ast);
  }
  assert.deepEqual(embedded, ["shared/attachments/craft-preview.tsx"], "A page introduced a direct embedded file/viewer instead of the shared isolated renderer.");
});
