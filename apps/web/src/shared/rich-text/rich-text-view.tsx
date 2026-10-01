import { createElement, type ReactNode } from "react";
import { isSafeEditorLink } from "./link-url";
import "./rich-text.css";

// Stored rich text is rebuilt from an allowlist of elements instead of being inserted as HTML,
// so scripts, event handlers, styles, and unknown tags in saved content can never run or render.
const allowed = new Set(["p", "br", "strong", "b", "em", "i", "u", "s", "sub", "sup", "mark", "ul", "ol", "li", "h1", "h2", "h3", "h4",
  "blockquote", "code", "pre", "span", "div", "a", "table", "thead", "tbody", "tr", "th", "td", "hr"]);
const dropped = new Set(["script", "style", "iframe", "object", "embed", "template", "noscript"]);
const empty = new Set(["br", "hr"]);

function convert(node: Node, key: number): ReactNode {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent;
  if (!(node instanceof Element)) return null;
  const tag = node.tagName.toLowerCase();
  if (dropped.has(tag)) return null;
  const children = [...node.childNodes].map(convert);
  if (!allowed.has(tag)) return children;
  if (empty.has(tag)) return createElement(tag, { key });
  if (tag === "a") {
    const href = node.getAttribute("href") ?? "";
    return isSafeEditorLink(href)
      ? createElement("a", { key, href, target: "_blank", rel: "noopener noreferrer", className: "underline underline-offset-2" }, children)
      : createElement("span", { key }, children);
  }
  return createElement(tag, { key }, children);
}

/** Plain text of saved rich text, for places that need a single line. */
export function richTextToPlain(html: string | null | undefined): string {
  if (!html) return "";
  const body = new DOMParser().parseFromString(html, "text/html").body;
  for (const element of body.querySelectorAll([...dropped].join(","))) element.remove();
  return (body.textContent ?? "").replace(/\s+/g, " ").trim();
}

/** Read-only display of content saved by the rich text editor. */
export function RichTextView({ html, className }: { html: string | null | undefined; className?: string }) {
  if (!html?.trim()) return null;
  const body = new DOMParser().parseFromString(html, "text/html").body;
  return <div className={`rich-text-content min-w-0 break-words ${className ?? ""}`}>{[...body.childNodes].map(convert)}</div>;
}
