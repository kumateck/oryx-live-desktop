import { Badge } from "@/components/ui/badge";
import { useTheme } from "./theme-provider";

/** A type specimen of the active settings; never presented as a live ERP record. */
export function InterfacePreview() {
  const { settings } = useTheme();
  return <figure className="interface-preview" aria-labelledby="interface-preview-caption">
    <figcaption id="interface-preview-caption">Live preview</figcaption>
    <div className="ui-card border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="ui-card-heading font-semibold">Card heading</h3>
        <Badge variant="secondary">{settings.density === "compact" ? "Compact" : "Comfortable"}</Badge>
      </div>
      <p className="mt-1 text-muted-foreground">Body text stays clear, with less space between related details.</p>
      <dl className="interface-preview-facts">
        <div><dt>Headers</dt><dd>{settings.headerFontSize} px</dd></div>
        <div><dt>Body</dt><dd>{settings.uiFontSize} px</dd></div>
        <div><dt>Spacing</dt><dd>{settings.density === "compact" ? "Compact" : "Comfortable"}</dd></div>
      </dl>
    </div>
  </figure>;
}
