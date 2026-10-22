import { lazy, Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/navigation/page-header";
import { useAccess } from "@/shared/auth/use-access";
import { BandsTable, GradesTable, PensionTable } from "./config-tables";
import type { ConfigKind } from "../schemas/contracts";
import { configLabels } from "../schemas/editor-schema";
const Grade = lazy(() => import("./grade-dialog").then((module) => ({ default: module.GradeDialog })));
const Band = lazy(() => import("./band-dialog").then((module) => ({ default: module.BandDialog })));
const Pension = lazy(() => import("./pension-dialog").then((module) => ({ default: module.PensionDialog })));
export function PayrollConfigurationPage() {
  const [kind, setKind] = useState<ConfigKind>("band");
  const [adding, setAdding] = useState<ConfigKind | null>(null);
  const { has } = useAccess();
  return (
    <section className="page-fill">
      <PageHeader
        title="Payroll configuration"
        crumbs={[{ label: "Human resources" }, { label: "Payroll configuration" }]}
        actions={
          has("CanManagePayrollConfiguration") ? (
            <Button onClick={() => setAdding(kind)}>Add {kind === "grade" ? "pay grade" : kind === "band" ? "tax band" : "SSNIT rate"}</Button>
          ) : null
        }
      />
      <div role="group" aria-label="Payroll configuration section" className="flex flex-wrap gap-1">
        {(["band", "pension", "grade"] as const).map((value) => (
          <Button key={value} variant={kind === value ? "secondary" : "ghost"} aria-pressed={kind === value} onClick={() => setKind(value)}>
            {configLabels[value]}
          </Button>
        ))}
      </div>
      {kind === "band" ? <BandsTable /> : kind === "pension" ? <PensionTable /> : <GradesTable />}
      {adding ? (
        <Suspense fallback={<p role="status">Loading configuration form…</p>}>
          {adding === "grade" ? (
            <Grade onClose={() => setAdding(null)} />
          ) : adding === "band" ? (
            <Band onClose={() => setAdding(null)} />
          ) : (
            <Pension onClose={() => setAdding(null)} />
          )}
        </Suspense>
      ) : null}
    </section>
  );
}
