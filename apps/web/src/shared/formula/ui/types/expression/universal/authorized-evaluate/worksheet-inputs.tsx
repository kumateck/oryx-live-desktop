import { useId } from "react";
import { Input } from "@/components/ui/input";
import type {
  ExpressionExtract,
  LabeledInputField,
  ManualVarsMap,
} from "./types";

const INPUT_CLASS =
  "min-w-0 flex-1 rounded-none border-0 border-b border-border bg-background px-2 py-1.5 text-sm text-foreground transition-colors focus:rounded focus:border focus:border-border focus:outline-none focus:ring-1 focus:ring-info/40";

const Heading = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
    {children}
  </h3>
);

const InputRow = ({
  id,
  label,
  onChange,
  value,
}: {
  id: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) => {
  const prefix = useId();
  return (
  <label htmlFor={`${prefix}-${id}`} className="flex flex-col gap-1 @xl/worksheet:flex-row @xl/worksheet:gap-2">
    <span className="text-sm text-foreground">{label}:</span>
    <Input
      id={`${prefix}-${id}`}
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={INPUT_CLASS}
      aria-label={label}
    />
  </label>
  );
};

interface WorksheetInputsProps {
  headers: string[];
  manualVarKeys: string[];
  manualVars: ManualVarsMap;
  onManualVarChange: (key: string, value: string) => void;
  onSampleInputChange: (
    sampleIndex: number,
    inputIndex: number,
    value: string,
  ) => void;
  onStandardInputChange: (index: number, value: string) => void;
  parsed: ExpressionExtract;
  sampleInputs: LabeledInputField[][];
  standardInputs: LabeledInputField[];
}

export const WorksheetInputs = ({
  headers,
  manualVarKeys,
  manualVars,
  onManualVarChange,
  onSampleInputChange,
  onStandardInputChange,
  parsed,
  sampleInputs,
  standardInputs,
}: WorksheetInputsProps) => (
  <div className="space-y-6">
    {Object.keys(parsed.constants ?? {}).length > 0 || manualVarKeys.length > 0 ? <div className="grid grid-cols-1 gap-6 @3xl/worksheet:grid-cols-2">
      {Object.keys(parsed.constants ?? {}).length > 0 ? <section className="min-w-0 space-y-3">
        <Heading>Constants</Heading>
        {Object.entries(parsed.constants || {}).map(([key, value]) => (
          <div key={key} className="text-sm text-foreground">
            {key}: {value}
          </div>
        ))}
      </section> : null}
      {manualVarKeys.length > 0 ? <section className="min-w-0 space-y-3">
        <Heading>Manual Variables</Heading>
        {manualVarKeys.map((key) => {
          const variable = manualVars[key] || {
            label: "",
            raw: "",
            evaluated: null,
          };
          return (
            <InputRow
              key={key}
              id={`manual-${key}`}
              label={`${variable.label || key} (${key})`}
              value={variable.raw}
              onChange={(value) => onManualVarChange(key, value)}
            />
          );
        })}
      </section> : null}
    </div> : null}
    {standardInputs.length > 0 || sampleInputs.some((sample) => sample.length > 0) ? <div className="grid grid-cols-1 gap-6 @3xl/worksheet:grid-cols-2">
      {standardInputs.length > 0 ? <section className="min-w-0 space-y-3">
        <Heading>
          {parsed.firstColumnPurpose === "blank"
            ? "Blank"
            : parsed.firstColumnPurpose === "titre"
              ? "Titre"
              : parsed.firstColumnPurpose === "control"
                ? "Control"
                : "Standard"}{" "}
          Inputs
        </Heading>
        {standardInputs.map((input, index) => (
          <InputRow
            key={input.key}
            id={`standard-${input.key}`}
            label={`${input.label} (${input.key})`}
            value={input.value}
            onChange={(value) => onStandardInputChange(index, value)}
          />
        ))}
      </section> : null}
      {sampleInputs.some((sample) => sample.length > 0) ? <section className="min-w-0 space-y-3">
        <Heading>Sample Inputs</Heading>
        {sampleInputs.flatMap((sample, sampleIndex) =>
          sample.map((input, inputIndex) => (
            <InputRow
              key={`${sampleIndex}-${input.key}`}
              id={`sample-${sampleIndex}-${input.key}`}
              label={`${headers[sampleIndex + (parsed.standardInTable ? 1 : 0)] || `Sample ${sampleIndex + 1}`} ${input.label} (${input.key})`}
              value={input.value}
              onChange={(value) =>
                onSampleInputChange(sampleIndex, inputIndex, value)
              }
            />
          )),
        )}
      </section> : null}
    </div> : null}
  </div>
);
