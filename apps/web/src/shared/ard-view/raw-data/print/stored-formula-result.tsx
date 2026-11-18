import { FormResponseDto } from "@/shared/ard-view/dto";
import {
  GovernedFormResponse,
  resultLabel,
  parseStoredFormulaResults,
} from "../governed-formula-result";

const StoredFormulaResult = ({ response, preferAverage = false }: { response?: FormResponseDto | undefined; preferAverage?: boolean }) => {
  const stored = parseStoredFormulaResults(response);
  const average = stored.find(result => /^(average|mean)([ _-]+(content|result|assay))?$/i.test(result.key.trim()));
  const results = preferAverage && average ? [average] : stored;
  const finalized = (response as GovernedFormResponse | undefined)
    ?.formulaResultFinalized;
  if (!results.length) {
    return (
      <span className="text-sm text-destructive print:text-black">
        {response?.formulaRepairPending ? "Formula repaired — the result is calculated when the readings are saved." : "Authoritative formula result unavailable."}
      </span>
    );
  }
  return (
    <div className="space-y-1 text-sm text-foreground print:text-black">
      {results.map((result) => (
        <div key={result.key} className="flex gap-2">
          {results.length > 1 ? <span className="font-medium">{resultLabel(result.key)}:</span> : null}
          <span>
            {result.value}
            {result.unit ? ` ${result.unit}` : ""}
          </span>
        </div>
      ))}
      {!finalized && (
        <div className="text-xs text-muted-foreground print:text-black">
          Stored authoritative draft result — not finalized
        </div>
      )}
    </div>
  );
};

export default StoredFormulaResult;
