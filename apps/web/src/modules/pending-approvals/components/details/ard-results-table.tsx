import { useMemo } from "react";
import ArdTemplateBody from "@/shared/ard-view/templates/body";
import { ardDisplayData } from "../../lib/ard-display-data";
import type { RecordedAnswer } from "../../lib/ard-results";
import type { ArdResultSection } from "../../schemas/ard-result-schema";
import { ArdCoaResults } from "./ard-coa-results";

/** Oryx Next uses a specification summary followed by the full Test & Observations worksheet. */
export function ArdResultsTable({ sections, recorded, certificate = false }: {
  sections: readonly ArdResultSection[]; recorded: ReadonlyMap<string, RecordedAnswer>; certificate?: boolean;
}) {
  const data = useMemo(() => ardDisplayData(sections, recorded), [sections, recorded]);
  return certificate ? <ArdCoaResults sections={sections} recorded={recorded} data={data} />
    : <div className="min-w-0 space-y-4" aria-label="Analytical results"><ArdTemplateBody sections={data.sections} responses={data.responses} showRemarks={false} /></div>;
}
