# Rich text editor

`FormWizard` loads `richtext` only for forms that declare the field. The field stores an HTML string in React Hook Form and calls `onChange` only when the document changes. An empty document stores `""`. Use a string default value and validate it with the module's Zod schema. A text requirement must inspect rendered text, since `<p></p>` and formatting tags are not meaningful content.

The editor composes Tiptap extensions in `shared/rich-text/editor-extensions.ts`. Formatting buttons subscribe to their needed editor state while the editor view does not rerender React for every transaction. The toolbar wraps at narrow widths; table insertion supports 1–10 rows and columns, with fixed layout and wrapped cell content to keep the form within the available width. Expansion moves the same editor instance into a shadcn Dialog so cursor and undo history are retained. Form reset updates the document without generating another form change.

Legacy Oryx Next mention anchors (`userkey` or `data-linked-resource-type="userinfo"`) and hashtag anchors (`data-type="hashtag"`) load as typed reference nodes. Saving preserves those reference attributes in anchors. Mention anchors are inert; their old arbitrary `href` is discarded. Hashtag links use an encoded internal search URL. A form can pass `references` with `{ id, label, kind: "user" | "tag" }` to offer insertion from the toolbar. Live lookup suggestions are a separate module integration, not an editor-wide network dependency.

Links accept HTTP, HTTPS, mailto, root-relative, and fragment URLs. The client editor is not a trust boundary. The backend must sanitize stored rich HTML, restrict allowed tags, attributes, and URL schemes, and apply the same policy when displaying historical content. Verify legacy documents and any API-specific rendering before migrating each module form.

Use the field in a typed form configuration:

```tsx
const fields = [
  { type: "richtext", name: "remarks", label: "Remarks", rows: 5 },
] as const satisfies readonly WizardField<Values>[];
```

The editor tests cover legacy references, formatting schema, unsafe link rejection, HTML submission, and form reset. Add module tests for its content rule, server serialization, permissions, and saved-document display.
