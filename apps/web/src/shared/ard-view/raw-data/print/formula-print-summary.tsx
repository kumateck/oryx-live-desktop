type SummaryEntry = {
  key: string;
  label: string;
  value: string;
};

type FormulaPrintSummaryProps = {
  constants: SummaryEntry[];
  manualEntries: SummaryEntry[];
  sampleInputs: SummaryEntry[][];
  standardInputs: SummaryEntry[];
};

const SummaryList = ({
  entries,
  title,
}: {
  entries: SummaryEntry[];
  title: string;
}) => entries.length > 0 ? (
  <div className="min-w-0 space-y-1">
    <div className="font-semibold uppercase tracking-wide">{title}</div>
    {entries.map((item) => (
      <div key={item.key}>{item.label}: {item.value || "—"}</div>
    ))}
  </div>
) : null;

const FormulaPrintSummary = ({
  constants,
  manualEntries,
  sampleInputs,
  standardInputs,
}: FormulaPrintSummaryProps) => (
  <div className="@container/formula-summary space-y-4">
    <div className="grid w-full grid-cols-1 gap-4 @2xl/formula-summary:grid-cols-2">
      <SummaryList entries={constants} title="Constants" />
      <SummaryList entries={manualEntries} title="Manual Variables" />
    </div>
    <div className="grid w-full grid-cols-1 gap-4 @2xl/formula-summary:grid-cols-2">
      <SummaryList entries={standardInputs} title="Standard Inputs" />
      <SummaryList
        entries={sampleInputs.flatMap((inputs, sampleIndex) =>
          inputs.map((input) => ({
            ...input,
            key: `${sampleIndex}-${input.key}`,
            label: `Sample ${sampleIndex + 1} ${input.label}`,
          })),
        )}
        title="Sample Inputs"
      />
    </div>
  </div>
);

export default FormulaPrintSummary;
