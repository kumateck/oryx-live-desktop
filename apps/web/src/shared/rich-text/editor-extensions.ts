import Link from "@tiptap/extension-link";
import { Placeholder } from "@tiptap/extensions";
import Highlight from "@tiptap/extension-highlight";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import StarterKit from "@tiptap/starter-kit";
import { isSafeEditorLink } from "./link-url";
import { LegacyHashtag, LegacyMention } from "./legacy-references";

export function editorExtensions(placeholder: string) {
  return [
    StarterKit.configure({ link: false }),
    Link.configure({
      openOnClick: false,
      autolink: false,
      defaultProtocol: "https",
      HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
      isAllowedUri: (url, context) => context.defaultValidate(url) && isSafeEditorLink(url),
    }),
    Placeholder.configure({ placeholder }),
    TextStyleKit,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    TableKit.configure({ table: { resizable: false } }),
    LegacyMention,
    LegacyHashtag,
  ];
}
