import type { EmitPayload } from "./panels/expression";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FormulaTypes } from "@/shared/formula/ui/legacy";
import { UniversalEvaluate } from "./evaluate";
import { useFormulaState } from "./hooks";
import type {
  ConfigSettings,
  ExpressionExtract,
  LabeledInputField,
  TheAduseiFormulaProps,
  FirstColumnPurpose,
  FrozenSnapshot,
} from "./types";
import { UniversalVariableKeyFormat } from "./types";
import SettingsPanel from "./panels/settings";
import ExpressionPanel from "./panels/expression";
import { normalizeExpressionPayload } from "./normalizer";
import { canonicalInputKey } from "@/shared/formula/builder/universal-variable-keys";

const PURPOSE_LABEL: Record<FirstColumnPurpose, string> = {
  standard: "Standard",
  blank: "Blank",
  titre: "Titre",
  control: "Control",
};

type UIStage = "settings" | "expression";

const defaultSettings = (
  percent: boolean,
  decimals: number | "" = 2,
): ConfigSettings => ({
  averageAllResults: false,
  calculateAvgInTable: true,
  calculateRsdInTable: true,
  calculateSdInTable: true,
  columnExpressions: {},
  constants: {},
  decimalPlaces: decimals,
  inputDecimalPlaces: 2,
  tableCalculationDecimalPlaces: 2,
  finalResultDecimalPlaces: typeof decimals === "number" ? decimals : 2,
  expression: "",
  firstColumnPurpose: "standard",
  formulaInTable: false,
  headers: [],
  manualVarExpressions: {},
  namedExpressionsEnabled: false,
  namedExpressions: [],
  variableKeyFormat: UniversalVariableKeyFormat.CanonicalAlphanumeric,
  manualVarLabels: {},
  manualVars: {},
  noOfReadings: 5,
  noOfSamples: 2,
  percentageResults: percent,
  rowHeaders: [],
  sampleInputs: [],
  sampleInTable: true,
  sampleInput: true,
  standardInput: true,
  standardInputs: [],
  standardInTable: true,
  type: FormulaTypes.Universal,
});

const buildHeaders = (s: ConfigSettings): string[] => {
  if (s.standardInTable) {
    return [
      PURPOSE_LABEL[s.firstColumnPurpose],
      ...Array(s.noOfSamples)
        .fill(null)
        .map((_, i) => `Sample ${i + 1}`),
    ];
  }
  return Array(s.noOfSamples)
    .fill(null)
    .map((_, i) => `Sample ${i + 1}`);
};

const buildRowHeaders = (readings: number) =>
  Array(readings)
    .fill(null)
    .map((_, i) => ({ id: `row-${i + 1}`, label: `Reading ${i + 1}` }));

export const UniversalConfig: React.FC<TheAduseiFormulaProps> = ({
  value,
  onChange,
  onUniversalPayloadChange,
  disabled,
  className,
}) => {
  // Core expression state handled by our formula hook
  const {
    expression,
    setExpression,
    decimalPlaces,
    // handleDecimalPlacesChange,
    showPercentage,
    // setShowPercentage,
  } = useFormulaState(FormulaTypes.Universal, value, onChange);

  // Stage control
  const [stage, setStage] = useState<UIStage>("settings");

  // Live settings (editable in Settings stage)
  const [liveSettings, setLiveSettings] = useState<ConfigSettings>(
    defaultSettings(showPercentage, decimalPlaces),
  );

  // Expression-side states we persist across stage switches (per your recommendation)
  const [constants, setConstants] = useState<Record<string, number>>({});
  const [columnExpressions, setColumnExpressions] = useState<
    Record<
      number,
      { enabled: boolean; expression: string; error: string | null }
    >
  >({});

  // Frozen snapshot used strictly by Expression stage
  const [snapshot, setSnapshot] = useState<FrozenSnapshot | null>(null);

  // Test view toggle (only in expression stage UI)
  const [showTest, setShowTest] = useState(false);

  // Track last parsed value to prevent re-hydration from our own emissions
  const lastParsedValueRef = useRef<string | null>(null);
  const isInternalUpdateRef = useRef(false);

  // Hydration (optional): if an external value is passed, seed live settings and expression-side states
  useEffect(() => {
    // Skip if this is the same value we already processed
    if (value === lastParsedValueRef.current) return;
    // Skip if we're in the middle of an internal update
    if (isInternalUpdateRef.current) return;

    try {
      if (!value || !value.trim()) {
        lastParsedValueRef.current = value || null;
        return;
      }

      const parsed = normalizeExpressionPayload(
        JSON.parse(value) as ExpressionExtract & {
          rowHeaders?: ReturnType<typeof buildRowHeaders> | undefined;
          columnExpressions?: typeof columnExpressions | undefined;
        },
      );

      // Seed expression and constants
      if (typeof parsed.expression === "string")
        setExpression(parsed.expression);
      if (parsed.constants) {
        setConstants(parsed.constants);
      }
      if (parsed.columnExpressions)
        setColumnExpressions(parsed.columnExpressions);

      // Compute derived settings
      const derivedStandardInTable =
        parsed.standardInTable !== undefined
          ? parsed.standardInTable
          : parsed.headers && parsed.headers.length > 0
            ? true
            : undefined;
      const derivedNoOfSamples = parsed.headers?.length
        ? derivedStandardInTable !== false
          ? parsed.headers.length - 1
          : parsed.headers.length
        : undefined;

      // Seed base live settings (do not switch stage automatically)
      setLiveSettings((prev) => {
        const next = {
          ...prev,
          type:
            parsed.type === FormulaTypes.Simple || parsed.type === FormulaTypes.Uniformity || parsed.type === FormulaTypes.Universal
              ? parsed.type
              : prev.type,
          percentageResults:
            parsed.percentageResults ??
            parsed.percent ??
            prev.percentageResults,
          decimalPlaces:
            parsed.decimalPlaces !== undefined
              ? parsed.decimalPlaces
              : prev.decimalPlaces,
          inputDecimalPlaces:
            parsed.inputDecimalPlaces ?? prev.inputDecimalPlaces,
          tableCalculationDecimalPlaces:
            parsed.tableCalculationDecimalPlaces ??
            (typeof parsed.decimalPlaces === "number"
              ? parsed.decimalPlaces
              : undefined) ??
            prev.tableCalculationDecimalPlaces,
          finalResultDecimalPlaces:
            parsed.finalResultDecimalPlaces ??
            (typeof parsed.decimalPlaces === "number"
              ? parsed.decimalPlaces
              : undefined) ??
            prev.finalResultDecimalPlaces,
          firstColumnPurpose:
            parsed.firstColumnPurpose ?? prev.firstColumnPurpose,
          noOfReadings:
            parsed.numberOfReadings ??
            parsed.noOfReadings ??
            prev.noOfReadings,
          noOfSamples: derivedNoOfSamples ?? prev.noOfSamples,
          standardInTable: derivedStandardInTable ?? prev.standardInTable,
          formulaInTable: parsed.formulaInTable ?? prev.formulaInTable,
          calculateAvgInTable:
            parsed.calculateAvgInTable ?? prev.calculateAvgInTable,
          calculateSdInTable:
            parsed.calculateSdInTable ?? prev.calculateSdInTable,
          calculateRsdInTable:
            parsed.calculateRsdInTable ?? prev.calculateRsdInTable,
          averageAllResults: parsed.averageAllResults ?? prev.averageAllResults,
          constants: parsed.constants ?? prev.constants,
          expression: parsed.expression ?? prev.expression,
          headers: parsed.headers ?? prev.headers,
          standardInputs: parsed.standardInputs ?? prev.standardInputs,
          sampleInputs: parsed.sampleInputs ?? prev.sampleInputs,
          columnExpressions: parsed.columnExpressions ?? prev.columnExpressions,
          rowHeaders: parsed.rowHeaders ?? prev.rowHeaders,
          manualVars: parsed.manualVars
            ? (parsed.manualVars as ConfigSettings["manualVars"])
            : prev.manualVars,
          namedExpressionsEnabled:
            parsed.namedExpressionsEnabled ?? prev.namedExpressionsEnabled,
          namedExpressions: parsed.namedExpressions ?? prev.namedExpressions,
          variableKeyFormat:
            parsed.variableKeyFormat ?? UniversalVariableKeyFormat.LegacyDotted,
        };
        return next;
      });

      // If the loaded value has an expression, restore the snapshot and jump to expression stage
      if (parsed.expression && parsed.headers && parsed.headers.length > 0) {
        const restoredHeaders = parsed.headers;
        const restoredRowHeaders =
          parsed.rowHeaders ??
          buildRowHeaders(
            parsed.numberOfReadings ?? parsed.noOfReadings ?? 5,
          );
        const samplesCount = derivedNoOfSamples ?? 2;
        const restoredStdInputs: LabeledInputField[] = parsed.standardInputs
          ?.length
          ? parsed.standardInputs
          : [{ label: "Weight (g)", value: "", key: "wt" }];
        const restoredSampleInputs: LabeledInputField[][] = parsed.sampleInputs
          ?.length
          ? parsed.sampleInputs.slice(0, samplesCount)
          : Array(samplesCount)
              .fill(null)
              .map(() => [{ label: "Weight (g)", value: "", key: "wt" }]);

        const frozenSettings: ConfigSettings = {
          type: FormulaTypes.Universal,
          standardInTable: derivedStandardInTable ?? true,
          firstColumnPurpose: parsed.firstColumnPurpose ?? "standard",
          standardInput: parsed.standardInput ?? true,
          sampleInput: parsed.sampleInput ?? true,
          sampleInTable: true,
          calculateAvgInTable: parsed.calculateAvgInTable ?? true,
          calculateSdInTable: parsed.calculateSdInTable ?? true,
          calculateRsdInTable: parsed.calculateRsdInTable ?? true,
          percentageResults:
            parsed.percentageResults ?? parsed.percent ?? false,
          averageAllResults: parsed.averageAllResults ?? false,
          decimalPlaces: parsed.decimalPlaces ?? 2,
          inputDecimalPlaces: parsed.inputDecimalPlaces ?? 2,
          tableCalculationDecimalPlaces:
            parsed.tableCalculationDecimalPlaces ??
            (typeof parsed.decimalPlaces === "number"
              ? parsed.decimalPlaces
              : 2),
          finalResultDecimalPlaces:
            parsed.finalResultDecimalPlaces ??
            (typeof parsed.decimalPlaces === "number"
              ? parsed.decimalPlaces
              : 2),
          formulaInTable: parsed.formulaInTable ?? false,
          noOfSamples: samplesCount,
          noOfReadings:
            parsed.numberOfReadings ?? parsed.noOfReadings ?? 5,
          constants: parsed.constants ?? {},
          expression: parsed.expression,
          headers: restoredHeaders,
          standardInputs: restoredStdInputs,
          sampleInputs: restoredSampleInputs,
          manualVars: parsed.manualVars
            ? (parsed.manualVars as ConfigSettings["manualVars"])
            : {},
          manualVarLabels: {},
          manualVarExpressions: {},
          namedExpressionsEnabled: parsed.namedExpressionsEnabled ?? false,
          namedExpressions: parsed.namedExpressions ?? [],
          variableKeyFormat:
            parsed.variableKeyFormat ?? UniversalVariableKeyFormat.LegacyDotted,
          columnExpressions: parsed.columnExpressions ?? {},
          rowHeaders: restoredRowHeaders,
        };
        setSnapshot({
          settings: frozenSettings,
          headers: restoredHeaders,
          rowHeaders: restoredRowHeaders,
          standardInputs: restoredStdInputs,
          sampleInputs: restoredSampleInputs,
          columnExpressions: parsed.columnExpressions ?? {},
          constants: parsed.constants ?? {},
          tableData: parsed.tableData ?? [],
          manualVars: parsed.manualVars
            ? (parsed.manualVars as FrozenSnapshot["manualVars"])
            : {},
        });
        setStage("expression");
      }

      lastParsedValueRef.current = value;
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Keep live settings percentage/decimals in sync with hook's UI toggles while in Settings stage only
  // Use a single effect to avoid circular updates - only sync FROM hook state TO liveSettings
  useEffect(() => {
    if (stage !== "settings") return;
    setLiveSettings((prev) => {
      // Only update if values actually differ to prevent unnecessary re-renders
      if (
        prev.percentageResults === showPercentage &&
        prev.decimalPlaces === decimalPlaces
      ) {
        return prev;
      }
      return {
        ...prev,
        percentageResults: showPercentage,
        decimalPlaces: decimalPlaces,
      };
    });
  }, [showPercentage, decimalPlaces, stage]);

  // Finalize -> freeze snapshot and move to Expression stage
  const handleFinalizeToExpression = useCallback(() => {
    const headers = buildHeaders(liveSettings);
    const rowHeaders = buildRowHeaders(liveSettings.noOfReadings);

    // Shape inputs for the frozen snapshot (clone current config-level inputs if present; otherwise minimal defaults)
    const frozenStandardInputs: LabeledInputField[] = liveSettings
      .standardInputs?.length
      ? liveSettings.standardInputs.map((input) => ({
          ...input,
          key:
            liveSettings.variableKeyFormat ===
            UniversalVariableKeyFormat.CanonicalAlphanumeric
              ? canonicalInputKey(input.key)
              : input.key,
        }))
      : [{ label: "Weight (g)", value: "", key: "weight" }];

    const samplesCount = liveSettings.noOfSamples;
    const frozenSampleInputs: LabeledInputField[][] = liveSettings.sampleInputs
      ?.length
      ? liveSettings.sampleInputs.slice(0, samplesCount).map((sample) =>
          sample.map((input) => ({
            ...input,
            key:
              liveSettings.variableKeyFormat ===
              UniversalVariableKeyFormat.CanonicalAlphanumeric
                ? canonicalInputKey(input.key)
                : input.key,
          })),
        )
      : Array(samplesCount)
          .fill(null)
          .map(() => [{ label: "Weight (g)", value: "", key: "weight" }]);

    const frozen: FrozenSnapshot = {
      settings: { ...liveSettings }, // frozen copy
      headers,
      rowHeaders,
      standardInputs: frozenStandardInputs,
      sampleInputs: frozenSampleInputs,
      columnExpressions: { ...columnExpressions },
      constants: { ...constants },
      tableData: [], // start fresh
      manualVars: {},
    };

    setSnapshot(frozen);
    setStage("expression");
    setShowTest(false);
  }, [liveSettings, columnExpressions, constants]);

  const handleBackToSettings = useCallback(() => {
    setStage("settings");
    setShowTest(false);
  }, []);

  // Emit changes ONLY in expression stage: ExpressionPanel will call this with a fully aggregated payload
  const handleEmitFromExpression = useCallback(
    (payload: EmitPayload) => {
      if (stage !== "expression") return;
      const percentage =
        typeof payload?.percentageResults === "boolean"
          ? payload.percentageResults
          : liveSettings.percentageResults;
      const mergedPayload = {
        ...payload,
        // Both fields emitted for backward compatibility: some consumers use
        // "percent" (legacy), others use "percentageResults" (canonical).
        percent: percentage,
        percentageResults: percentage,
        type: FormulaTypes.Universal,
      };
      const serialized = JSON.stringify({
        expression:
          typeof mergedPayload.expression === "string"
            ? mergedPayload.expression
            : expression,
        decimalPlaces,
        ...mergedPayload,
      });
      onUniversalPayloadChange?.(serialized);
      if (serialized === value) return;
      try {
        isInternalUpdateRef.current = true;
        lastParsedValueRef.current = serialized;
        onChange?.(serialized);
        isInternalUpdateRef.current = false;
      } catch {
        isInternalUpdateRef.current = false;
      }
    },
    [
      stage,
      expression,
      decimalPlaces,
      liveSettings.percentageResults,
      value,
      onChange,
      onUniversalPayloadChange,
    ],
  );

  return (
    <div className={["w-full mx-auto", className].filter(Boolean).join(" ")}>
      {stage === "settings" && (
        <SettingsPanel
          disabled={disabled}
          settings={liveSettings}
          onSettingsChange={setLiveSettings}
          onFinalize={handleFinalizeToExpression}
        />
      )}

      {stage === "expression" && snapshot && !showTest && (
        <ExpressionPanel
          disabled={disabled}
          expression={expression}
          onExpressionChange={setExpression}
          snapshot={snapshot}
          onUpdateSnapshot={(next) => setSnapshot(next)}
          constants={constants}
          onConstantsChange={setConstants}
          columnExpressions={columnExpressions}
          onColumnExpressionsChange={setColumnExpressions}
          onEmit={handleEmitFromExpression}
          onBackToSettings={handleBackToSettings}
        />
      )}

      {stage === "expression" && snapshot && showTest && (
        <UniversalEvaluate
          settings={JSON.stringify({
            // Core formula and flags
            expression,
            firstColumnPurpose: snapshot.settings.firstColumnPurpose,
            standardInTable: snapshot.settings.standardInTable,
            standardInput: snapshot.settings.standardInput,
            sampleInput: snapshot.settings.sampleInput,
            formulaInTable: snapshot.settings.formulaInTable,
            calculateAvgInTable: snapshot.settings.calculateAvgInTable,
            calculateSdInTable: snapshot.settings.calculateSdInTable,
            calculateRsdInTable: snapshot.settings.calculateRsdInTable,
            averageAllResults: snapshot.settings.averageAllResults,
            percentageResults: snapshot.settings.percentageResults,
            decimalPlaces: snapshot.settings.decimalPlaces,
            inputDecimalPlaces: snapshot.settings.inputDecimalPlaces,
            tableCalculationDecimalPlaces:
              snapshot.settings.tableCalculationDecimalPlaces,
            finalResultDecimalPlaces:
              snapshot.settings.finalResultDecimalPlaces,
            // Counts (canonical)
            numberOfSamples: snapshot.settings.noOfSamples,
            numberOfReadings: snapshot.settings.noOfReadings,
            // Structural data
            headers: snapshot.headers,
            rowHeaders: snapshot.rowHeaders,
            // Data & definitions
            constants,
            standardInputs: snapshot.standardInputs,
            sampleInputs: snapshot.sampleInputs,
            // Expressions are editable after the structural snapshot is
            // created, so the test view must receive the current governed
            // definitions rather than the initial frozen copy.
            columnExpressions,
            namedExpressionsEnabled: snapshot.settings.namedExpressionsEnabled,
            namedExpressions: snapshot.settings.namedExpressions,
            variableKeyFormat: snapshot.settings.variableKeyFormat,

            // manualVars: manualVars, // current manual vars (raw + evaluated)
            tableData: snapshot.tableData, // includes latest cell edits
          })}
          onBack={() => setShowTest(false)}
          testMode
          value={""}
          onChange={() => {}}
        />
      )}

      {stage === "expression" && snapshot && !showTest && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            className="text-xs text-info underline"
            onClick={() => setShowTest(true)}
            disabled={disabled}
          >
            Test Formula
          </button>
        </div>
      )}
    </div>
  );
};

export default UniversalConfig;
