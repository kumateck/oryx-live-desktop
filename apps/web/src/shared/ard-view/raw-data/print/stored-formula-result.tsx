import { FormResponseDto } from "@/shared/ard-view/dto";
import {
  GovernedFormResponse,
  parseStoredFormulaResults,
} from "../governed-formula-result";

const StoredFormulaResult = ({ response }: { response?: FormResponseDto | undefined }) => {
  const results = parseStoredFormulaResults(response);
  const finalized = (response as GovernedFormResponse | undefined)
    ?.formulaResultFinalized;
  if (!results.length) {
    return (
      <span className="text-sm text-destructive print:text-black">
        Authoritative formula result unavailable.
      </span>
    );
  }
  return (
    <div className="space-y-1 text-sm text-foreground print:text-black">
      {results.map((result) => (
        <div key={result.key} className="flex gap-2">
          <span className="font-medium">{result.key}:</span>
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
