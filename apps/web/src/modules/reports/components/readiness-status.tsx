import { CircleCheck, CircleHelp, CircleX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { readinessChecks, type ProductConfiguration } from "../schemas/production-readiness";
import { definitionLabels, readinessLabels } from "../lib/production-readiness-sheets";

export function ReadinessMark({ value, label }: { value: 0 | 1 | 2; label: string }) {
  const Icon = value === 1 ? CircleCheck : value === 2 ? CircleHelp : CircleX;
  return <span role="img" aria-label={`${label}: ${definitionLabels[value]}`} title={`${label}: ${definitionLabels[value]}`}
    className={`readiness-mark readiness-tone-${value}`}><Icon aria-hidden="true" className="size-4" /></span>;
}

export function ReadinessBadge({ configuration }: { configuration: ProductConfiguration }) {
  return <Badge variant="outline" className={`readiness-badge readiness-tone-${configuration.readiness === 1 ? 1 : configuration.readiness === 2 ? 2 : 0}`}>
    {readinessLabels[configuration.readiness]}
  </Badge>;
}

export function ConfigurationBand({ configuration }: { configuration: ProductConfiguration }) {
  return <ul className="readiness-check-list" aria-label="Configuration checks">{readinessChecks.map(({ key, label, name }) =>
    <li key={key}><span>{label}</span><ReadinessMark label={name} value={configuration[key]} /></li>)}</ul>;
}

export function ReadinessLegend() {
  return <div className="readiness-legend" aria-label="Configuration legend">{([1, 0, 2] as const).map((value) =>
    <span key={value}><ReadinessMark label="Definition" value={value} />{definitionLabels[value]}</span>)}</div>;
}
