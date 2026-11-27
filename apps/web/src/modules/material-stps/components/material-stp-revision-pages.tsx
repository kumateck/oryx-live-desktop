import { useParams } from "react-router";
import { KindSwitch } from "@/shared/reference-data/kind-switch";
import { useKindTabs, type MaterialKind } from "@/shared/reference-data/kind-tabs";
import { StpImportPage, StpRevisionDetailPage, StpRevisionEditorPage, StpRevisionListPage, isStpKind, type StpEditorMode, type StpKind } from "@/shared/stp-content";
import { listOf } from "../lib/material-stps";
import { materialRevisionRoutes, revisionsPath, revisionViewKeys } from "../lib/material-stp-revisions";

const kinds: readonly StpKind[] = [0, 1];
const routesFor = (kind: StpKind) => materialRevisionRoutes(kind === 1 ? 1 : 0);
const crumbs = (kind: MaterialKind | null) => [{ label: "Material STPs", to: listOf(kind ?? 0) }, { label: "Revisions", to: `${revisionsPath}?type=${String(kind ?? 0)}` }];

/** Raw and packaging STP revisions, each kind behind its own view key. */
export function MaterialStpRevisionsPage() {
  const { kind, select, tabs } = useKindTabs(revisionViewKeys);
  if (kind === null) return null;
  return <StpRevisionListPage key={kind} kind={kind} routes={routesFor} title="Material STP revisions"
    crumbs={[{ label: "Material STPs", to: listOf(kind) }, { label: "Revisions" }]} switcher={<KindSwitch tabs={tabs} kind={kind} onSelect={select} />} />;
}

export function MaterialStpRevisionDetailPage() {
  const { kind } = useKindTabs(revisionViewKeys);
  return <StpRevisionDetailPage kinds={kinds} routes={routesFor} crumbs={crumbs(kind)} />;
}

export function MaterialStpRevisionEditorPage({ mode }: { mode: StpEditorMode }) {
  const { kind } = useKindTabs(revisionViewKeys);
  const { id } = useParams();
  return <StpRevisionEditorPage key={`${mode}:${id ?? ""}`} mode={mode} kind={isStpKind(kind) ? kind : null} kinds={kinds} routes={routesFor} crumbs={crumbs(kind)} />;
}

export function MaterialStpImportPage() {
  const { kind } = useKindTabs(revisionViewKeys);
  if (kind === null) return null;
  return <StpImportPage key={kind} kind={kind} routes={routesFor} crumbs={crumbs(kind)} />;
}
