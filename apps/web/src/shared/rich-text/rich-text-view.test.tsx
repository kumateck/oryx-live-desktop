// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { RichTextView, richTextToPlain } from "./rich-text-view";

afterEach(cleanup);

it("keeps formatting but never renders scripts, handlers, styles, or unsafe links", () => {
  const { container } = render(<RichTextView html={`<p onclick="steal()" style="position:fixed">Take <strong>two</strong></p>
    <script>steal()</script><img src=x onerror="steal()"><a href="javascript:steal()">bad</a><a href="https://example.com">good</a>
    <ul><li>One</li></ul><custom-tag>kept text</custom-tag>`} />);
  const html = container.innerHTML;
  expect(container.querySelector("strong")?.textContent).toBe("two");
  expect(container.querySelector("li")?.textContent).toBe("One");
  expect(html).not.toContain("steal");
  expect(html).not.toContain("onclick");
  expect(html).not.toContain("position:fixed");
  expect(container.querySelector("script, img, custom-tag")).toBeNull();
  expect(container.textContent).toContain("kept text");
  expect([...container.querySelectorAll("a")].map((a) => a.getAttribute("href"))).toEqual(["https://example.com"]);
  expect(container.querySelector("a")?.getAttribute("rel")).toBe("noopener noreferrer");
});

it("renders nothing for empty content and gives plain text when asked", () => {
  expect(render(<RichTextView html="  " />).container.innerHTML).toBe("");
  expect(richTextToPlain("<p>Each tablet<br>contains <b>500 mg</b></p><script>x</script>")).toBe("Each tabletcontains 500 mg");
  expect(richTextToPlain(null)).toBe("");
});
