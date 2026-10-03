import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import type { RackSummaryFigures } from "../lib/rack-stock";

export function RackFacts({ figures }: { figures: RackSummaryFigures }) {
  const used = figures.shelves - figures.emptyShelves.length;
  return <KeyFacts>
    <KeyFact label="Shelves in use" value={`${used} of ${figures.shelves}`}
      note={figures.emptyShelves.length ? `Empty: ${figures.emptyShelves.slice(0, 6).join(", ")}${figures.emptyShelves.length > 6 ? ` and ${figures.emptyShelves.length - 6} more` : ""}` : "No empty shelves"} />
    <KeyFact label="Batches on this rack" value={figures.batches} />
    <KeyFact label="Expired" value={figures.expired} state={figures.expired ? "overdue" : "none"} note={figures.expired ? "Should not be issued" : undefined} />
    <KeyFact label="Expiring within 60 days" value={figures.expiringSoon} state={figures.expiringSoon ? "soon" : "none"} />
  </KeyFacts>;
}
