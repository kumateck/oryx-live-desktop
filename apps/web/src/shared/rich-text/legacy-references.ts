import { Node } from "@tiptap/core";

export const LegacyMention = Node.create({
  name: "oryxMention",
  group: "inline",
  inline: true,
  atom: true,
  selectable: false,
  addAttributes() {
    return {
      id: { default: "", parseHTML: (element: HTMLElement) => element.getAttribute("data-id") ?? element.getAttribute("userkey") ?? "" },
      label: { default: "", parseHTML: (element: HTMLElement) => element.getAttribute("data-label") ?? element.getAttribute("data-username") ?? element.textContent ?? "" },
    };
  },
  parseHTML() {
    return [{ tag: "a[userkey]" }, { tag: "a[data-linked-resource-type='userinfo']" }, { tag: "span[data-oryx-reference='user']" }];
  },
  renderHTML({ node }) {
    const id = String(node.attrs.id ?? "");
    const label = String(node.attrs.label ?? "");
    return ["a", { userkey: id, "data-username": label, "data-linked-resource-type": "userinfo",
      "data-oryx-reference": "user", class: "oryx-rich-reference" }, label];
  },
  renderText({ node }) { return String(node.attrs.label ?? ""); },
});

export const LegacyHashtag = Node.create({
  name: "oryxHashtag",
  group: "inline",
  inline: true,
  atom: true,
  selectable: false,
  addAttributes() {
    return {
      id: { default: "", parseHTML: (element: HTMLElement) => element.getAttribute("data-id") ?? "" },
      label: { default: "", parseHTML: (element: HTMLElement) => (element.getAttribute("data-label") ?? element.textContent ?? "").replace(/^#/, "") },
    };
  },
  parseHTML() {
    return [{ tag: "a[data-type='hashtag']" }, { tag: "span[data-oryx-reference='tag']" }];
  },
  renderHTML({ node }) {
    const id = String(node.attrs.id ?? "");
    const label = String(node.attrs.label ?? "");
    return ["a", { "data-type": "hashtag", "data-oryx-reference": "tag", "data-id": id,
      "data-label": label, href: `/search?q=${encodeURIComponent(id)}`, class: "oryx-rich-reference" }, `#${label}`];
  },
  renderText({ node }) { return `#${String(node.attrs.label ?? "")}`; },
});
