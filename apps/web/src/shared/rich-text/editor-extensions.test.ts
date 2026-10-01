// @vitest-environment jsdom
import { Editor } from "@tiptap/core";
import { afterEach, expect, it } from "vitest";
import { editorExtensions } from "./editor-extensions";

let editor: Editor | null = null;
afterEach(() => { editor?.destroy(); editor = null; });

it("preserves legacy user and hashtag references as typed nodes", () => {
  editor = new Editor({ extensions: editorExtensions(""), content:
    '<p><a userkey="user-7" data-username="Ada" data-linked-resource-type="userinfo" href="user-7">Ada</a> ' +
    '<a data-type="hashtag" data-id="batch-2" data-label="Batch">#Batch</a></p>' });
  const html = editor.getHTML();
  expect(html).toContain('data-oryx-reference="user"');
  expect(html).toContain('userkey="user-7"');
  expect(html).toContain('data-linked-resource-type="userinfo"');
  expect(html).toContain('data-oryx-reference="tag"');
  expect(html).toContain('data-type="hashtag"');
  expect(html).toContain('data-id="batch-2"');
});

it("retains tables, headings, colors, and highlights in existing HTML", () => {
  editor = new Editor({ extensions: editorExtensions(""), content:
    '<h2>Procedure</h2><p><span style="font-size: 18px; color: #336699">Important</span> ' +
    '<mark data-color="#ffff00" style="background-color: #ffff00">step</mark></p>' +
    '<table><tbody><tr><th><p>Stage</p></th><td><p>Mix</p></td></tr></tbody></table>' });
  const html = editor.getHTML();
  expect(html).toContain("<h2>Procedure</h2>");
  expect(html).toContain("font-size: 18px");
  expect(html).toContain("<mark");
  expect(html).toContain("<table");
});

it("drops executable links from imported HTML", () => {
  editor = new Editor({ extensions: editorExtensions(""), content:
    '<p><a href="javascript:alert(1)">Unsafe</a> <a href="https://example.com">Safe</a></p>' });
  const html = editor.getHTML();
  expect(html).not.toContain("javascript:");
  expect(html).toContain('href="https://example.com"');
});
