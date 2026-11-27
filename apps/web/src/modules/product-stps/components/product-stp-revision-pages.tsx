import { useParams } from "react-router";
import { StpImportPage, StpRevisionDetailPage, StpRevisionEditorPage, StpRevisionListPage, type StpEditorMode, type StpKind } from "@/shared/stp-content";
import { listPath } from "../lib/product-stps";
import { productRevisionRoutes, revisionsPath } from "../lib/product-stp-revisions";

const kinds: readonly StpKind[] = [2];
const routesFor = () => productRevisionRoutes;
const crumbs = [{ label: "Product STPs", to: listPath }, { label: "Revisions", to: revisionsPath }];

export function ProductStpRevisionsPage() {
  return <StpRevisionListPage kind={2} routes={routesFor} title="Product STP revisions" crumbs={[{ label: "Product STPs", to: listPath }, { label: "Revisions" }]} />;
}
export function ProductStpRevisionDetailPage() {
  return <StpRevisionDetailPage kinds={kinds} routes={routesFor} crumbs={crumbs} />;
}
export function ProductStpRevisionEditorPage({ mode }: { mode: StpEditorMode }) {
  const { id } = useParams();
  return <StpRevisionEditorPage key={`${mode}:${id ?? ""}`} mode={mode} kind={2} kinds={kinds} routes={routesFor} crumbs={crumbs} />;
}
export function ProductStpImportPage() {
  return <StpImportPage kind={2} routes={routesFor} crumbs={crumbs} />;
}
