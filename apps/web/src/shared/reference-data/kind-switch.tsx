import { Button } from "@/components/ui/button";
import { materialKindLabels, type MaterialKind } from "./kind-tabs";

/**
 * Switches between the two lists a page has behind separate permissions: raw and packaging materials by default,
 * or foreign and local suppliers when given their labels. Shown only when the user may see both.
 */
export function KindSwitch({ tabs, kind, onSelect, labels = materialKindLabels, label = "Material kind" }: {
  tabs: readonly { value: MaterialKind }[]; kind: MaterialKind | null; onSelect: (kind: MaterialKind) => void; labels?: Record<MaterialKind, string>; label?: string;
}) {
  if (tabs.length < 2) return null;
  return <div role="group" aria-label={label} className="flex gap-1">{tabs.map((tab) =>
    <Button key={tab.value} type="button" size="sm" variant={kind === tab.value ? "default" : "outline"} aria-pressed={kind === tab.value} onClick={() => onSelect(tab.value)}>{labels[tab.value]}</Button>)}</div>;
}
