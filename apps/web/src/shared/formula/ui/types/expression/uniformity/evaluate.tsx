import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormulaCard } from "../../components/formula-card";
import { ArrowLeft, Beaker, RotateCcw } from "lucide-react";

import {
  Decimals,
  ExpressionExtract,
  TheAduseiFormulaProps,
  UniformityMode,
} from "../../type";
import { sanitizeNumber } from "@/shared/formula/ui/legacy";

// —— Types and Utils ——

type CapsuleInputs = {
  bulkCapsules: string;
  bulkShells: string;
  capsWts: string[];
  shellWts: string[];
};

type TabletTubeInputs = {
  bulkTotal: string;
  indWts: string[];
};

type Inputs = Partial<CapsuleInputs & TabletTubeInputs>;

type Results = {
  // Capsules
  totalContent: number | null;
  avgCapsule: number | null;
  minCaps: number | null;
  maxCaps: number | null;
  minContent: number | null;
  maxContent: number | null;

  // Tablets/Tubes
  avg: number | null;
  minW: number | null;
  maxW: number | null;

  // Common
  plusDev: number | null; // percentage value (e.g. 3.2 means 3.2%)
  minusDev: number | null; // percentage value
};

export type UniformityOfWeightValue = {
  settings: string;
  inputs: Inputs;
  results: Results;
};

const numberOrNull = (s: string): number | null => {
  if (s.trim() === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const minNum = (arr: Array<number>): number | null =>
  arr.length ? Math.min(...arr) : null;
const maxNum = (arr: Array<number>): number | null =>
  arr.length ? Math.max(...arr) : null;

const toFixedSmart = (
  n: number | null | undefined,
  decimalPlaces: Decimals,
  options?: { suffix?: string; dashIfNull?: boolean },
) => {
  if (n === null || n === undefined || Number.isNaN(n)) {
    return options?.dashIfNull === false ? "" : "—";
  }
  const digits =
    decimalPlaces === "" || decimalPlaces === undefined
      ? undefined
      : decimalPlaces;
  let formatted: string;
  if (digits !== undefined) {
    formatted = n.toLocaleString(undefined, {
      maximumFractionDigits: digits,
      minimumFractionDigits: digits,
    });
  } else {
    formatted = n.toLocaleString(undefined, { maximumFractionDigits: 6 });
  }
  return `${formatted}${options?.suffix || ""}`;
};

const fmtExprNum = (
  n: number | null,
  decimalPlaces: Decimals,
): string | null => {
  if (n === null || Number.isNaN(n)) return null;
  const digits =
    decimalPlaces === "" || decimalPlaces === undefined
      ? 6
      : Math.max(0, Math.min(10, decimalPlaces));
  const s = Number(n)
    .toFixed(digits)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
  return s;
};

/** A deviation result at the configured decimals (kept as text so 2 decimals shows -94.00), or trimmed when none are set. */
const fmtResult = (n: number | null, decimalPlaces: Decimals): string | null => {
  if (n === null || !Number.isFinite(n)) return null;
  if (decimalPlaces === "" || decimalPlaces === undefined) return fmtExprNum(n, decimalPlaces);
  return n.toFixed(Math.max(0, Math.min(10, decimalPlaces)));
};

const Section: React.FC<{
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode | undefined;
  className?: string | undefined;
}> = ({ title, children, right, className }) => (
  <div
    className={`bg-background border border-border rounded-md p-3 shadow-sm ${className || ""}`}
  >
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 bg-muted rounded-full" />
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
          {title}
        </h3>
      </div>
      {right}
    </div>
    {children}
  </div>
);

const Metric: React.FC<{
  label: string;
  value: number | null;
  decimalPlaces: Decimals;
  showPercentage?: boolean | undefined;
}> = ({ label, value, decimalPlaces, showPercentage }) => {
  return (
    <div className="flex items-center justify-between bg-muted/30 border border-border rounded px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">
        {showPercentage
          ? toFixedSmart(value, decimalPlaces, { suffix: "%" })
          : toFixedSmart(value, decimalPlaces)}
      </span>
    </div>
  );
};

const ReadonlyPill: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="flex items-center gap-2">
    <div className="text-sm text-muted-foreground">{label}</div>
    <div className="text-sm font-medium border border-border rounded px-2 py-0.5 bg-muted/30">
      {value}
    </div>
  </div>
);

// —— Controlled value helpers ——

const ensureArrayLen = (arr: string[] | undefined, len: number): string[] => {
  const base = Array.isArray(arr) ? arr.slice(0, len) : [];
  while (base.length < len) base.push("");
  return base;
};

const buildDefaultInputs = (
  mode: UniformityMode,
  sampleCount: number,
): Inputs => {
  if (mode === "capsule") {
    return {
      bulkCapsules: "",
      bulkShells: "",
      capsWts: Array(sampleCount).fill(""),
      shellWts: Array(sampleCount).fill(""),
    };
  }
  // tablet or tube
  return {
    bulkTotal: "",
    indWts: Array(sampleCount).fill(""),
  };
};

const sanitizeInputs = (
  raw: Inputs | undefined,
  mode: UniformityMode,
  sampleCount: number,
): Inputs => {
  const defaults = buildDefaultInputs(mode, sampleCount);
  if (mode === "capsule") {
    return {
      bulkCapsules: raw?.bulkCapsules ?? defaults.bulkCapsules ?? "",
      bulkShells: raw?.bulkShells ?? defaults.bulkShells ?? "",
      capsWts: ensureArrayLen(raw?.capsWts, sampleCount),
      shellWts: ensureArrayLen(raw?.shellWts, sampleCount),
    };
  } else {
    return {
      bulkTotal: raw?.bulkTotal ?? defaults.bulkTotal ?? "",
      indWts: ensureArrayLen(raw?.indWts, sampleCount),
    };
  }
};

const computeResults = (
  mode: UniformityMode,
  sampleCount: number,
  // decimalPlaces: Decimals,
  nominal: number | null | undefined,
  inputs: Inputs,
): Results => {
  if (mode === "capsule") {
    const bulkC = numberOrNull(inputs.bulkCapsules ?? "");
    const bulkS = numberOrNull(inputs.bulkShells ?? "");
    const totalContent = bulkC != null && bulkS != null ? bulkC - bulkS : null;
    const avgCapsule =
      bulkC != null && sampleCount > 0 ? bulkC / sampleCount : null;

    const capNums: number[] = [];
    const contentNums: number[] = [];
    const capsWts = ensureArrayLen(inputs.capsWts, sampleCount);
    const shellWts = ensureArrayLen(inputs.shellWts, sampleCount);
    for (let i = 0; i < sampleCount; i++) {
      const c = numberOrNull(capsWts[i] || "");
      const s = numberOrNull(shellWts[i] || "");
      if (c != null) capNums.push(c);
      if (c != null && s != null) contentNums.push(c - s);
    }
    const minCaps = minNum(capNums);
    const maxCaps = maxNum(capNums);
    const minContent = minNum(contentNums);
    const maxContent = maxNum(contentNums);

    const plusDev =
      nominal != null && nominal !== 0 && maxContent != null
        ? ((maxContent - nominal) / nominal) * 100
        : null;
    const minusDev =
      nominal != null && nominal !== 0 && minContent != null
        ? ((minContent - nominal) / nominal) * 100
        : null;

    return {
      totalContent,
      avgCapsule,
      minCaps,
      maxCaps,
      minContent,
      maxContent,
      avg: null,
      minW: null,
      maxW: null,
      plusDev,
      minusDev,
    };
  } else {
    const bulk = numberOrNull(inputs.bulkTotal ?? "");
    const individuals = ensureArrayLen(inputs.indWts, sampleCount)
      .map(numberOrNull)
      .filter((v): v is number => v != null);

    const avg = bulk != null && sampleCount > 0 ? bulk / sampleCount : null;
    const minW = minNum(individuals);
    const maxW = maxNum(individuals);

    const plusDev =
      nominal != null && nominal !== 0 && maxW != null
        ? ((maxW - nominal) / nominal) * 100
        : null;
    const minusDev =
      nominal != null && nominal !== 0 && minW != null
        ? ((minW - nominal) / nominal) * 100
        : null;

    return {
      totalContent: null,
      avgCapsule: null,
      minCaps: null,
      maxCaps: null,
      minContent: null,
      maxContent: null,
      avg,
      minW,
      maxW,
      plusDev,
      minusDev,
    };
  }
};

const tryParseJson = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const safeParseValue = (
  s: string | undefined,
): Partial<UniformityOfWeightValue> | undefined => {
  if (!s) return undefined;
  const firstPass = tryParseJson(s);
  const secondPass = tryParseJson(firstPass);
  const parsed = secondPass;
  if (parsed && typeof parsed === "object") {
    return parsed as Partial<UniformityOfWeightValue>;
  }
  return undefined;
};

interface Props extends TheAduseiFormulaProps {
  settings: string; // Serialized ExpressionExtract from the builder
}
// —— Test component (controlled) ——
export const UniformityOfWeightEvaluate: React.FC<Props> = ({
  settings,
  onBack,
  value,
  onChange,
  testMode,
}) => {
  const parsedValue = useMemo(
    () => (testMode ? undefined : safeParseValue(value)),
    [value, testMode],
  );

  // Parse the saved builder output
  const parsedSettings = useMemo<ExpressionExtract | null>(() => {
    const parseSettings = (raw: unknown): ExpressionExtract | null => {
      if (!raw || typeof raw !== "string" || raw.trim() === "") return null;
      try {
        return JSON.parse(raw) as ExpressionExtract;
      } catch {
        return null;
      }
    };

    try {
      const direct = parseSettings(settings);
      if (direct) return direct;

      const fallbackRaw = parsedValue?.settings;
      const fallback =
        typeof fallbackRaw === "string"
          ? parseSettings(fallbackRaw)
          : fallbackRaw && typeof fallbackRaw === "object"
            ? (fallbackRaw as ExpressionExtract)
            : null;
      return fallback;
    } catch (e) {
      console.error("[SimpleEvaluate] Failed to parse option JSON:", e);
      return null;
    }
  }, [settings, parsedValue?.settings]);
  // const { mode, sampleCount, decimalPlaces, percent, nominal } = parsedSettings;
  const mode = parsedSettings?.mode as UniformityMode;
  const sampleCount = sanitizeNumber(parsedSettings?.sampleCount);
  const decimalPlaces = parsedSettings?.decimalPlaces as Decimals;
  const percent = parsedSettings?.percent;
  const nominal = parsedSettings?.nominal;
  // Local state for test mode (do not collect external value/onChange)
  const [testInputs, setTestInputs] = useState<Inputs>(() =>
    buildDefaultInputs(mode, sampleCount),
  );

  // Keep local inputs shape in sync with settings when in test mode
  useEffect(() => {
    if (!testMode) return;
    setTestInputs((prev) => sanitizeInputs(prev, mode, sampleCount));
  }, [testMode, mode, sampleCount]);

  const inputs = useMemo(
    () =>
      sanitizeInputs(
        testMode ? testInputs : parsedValue?.inputs,
        mode,
        sampleCount,
      ),
    [testMode, testInputs, parsedValue?.inputs, mode, sampleCount],
  );

  // Compute results for current inputs/settings
  const results: Results = useMemo(
    () => computeResults(mode, sampleCount, nominal ?? null, inputs),
    [mode, sampleCount, nominal, inputs],
  );

  // Build the canonical JSON string (only when not in test mode)
  const canonicalValueString = useMemo(() => {
    if (testMode) return "";
    const payload: UniformityOfWeightValue = {
      settings,
      inputs,
      results,
    };
    return JSON.stringify(payload);
  }, [testMode, settings, inputs, results]);

  // Keep external value in sync with the canonical string ONLY when not in test mode
  useEffect(() => {
    if (testMode) return;
    if (value !== canonicalValueString && onChange) {
      onChange(canonicalValueString);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testMode, canonicalValueString]); // intentionally not depending on `value` to avoid redundant calls

  // Helpers for updating inputs in a controlled fashion
  const updateInputs = (nextInputs: Inputs) => {
    const sanitized = sanitizeInputs(nextInputs, mode, sampleCount);

    // In test mode, do not collect or emit value via onChange
    if (testMode) {
      setTestInputs(sanitized);
      return;
    }

    const nextResults = computeResults(
      mode,
      sampleCount,

      nominal ?? null,
      sanitized,
    );
    const payload: UniformityOfWeightValue = {
      settings,
      inputs: sanitized,
      results: nextResults,
    };
    if (onChange) {
      onChange(JSON.stringify(payload));
    }
  };

  const resetInputs = () => {
    updateInputs(buildDefaultInputs(mode, sampleCount));
  };

  // Expressions
  const nominalToken = mode === "capsule" ? "nominal_content_wt" : "nominal_wt";
  const nominalExpr = useMemo(
    () => fmtExprNum(nominal ?? null, decimalPlaces) ?? `:${nominalToken}`,
    [nominal, decimalPlaces, nominalToken],
  );

  const plusExpr = useMemo(() => {
    if (mode === "capsule") {
      const maxContent = results.maxContent ?? null;
      return `(${fmtExprNum(maxContent, decimalPlaces) ?? ":max_content_wt"} - ${nominalExpr}) / ${nominalExpr}`;
    }
    const maxW = results.maxW ?? null;
    return `(${fmtExprNum(maxW, decimalPlaces) ?? ":max_wt"} - ${nominalExpr}) / ${nominalExpr}`;
  }, [mode, results.maxContent, results.maxW, decimalPlaces, nominalExpr]);

  const minusExpr = useMemo(() => {
    if (mode === "capsule") {
      const minContent = results.minContent ?? null;
      return `(${fmtExprNum(minContent, decimalPlaces) ?? ":min_content_wt"} - ${nominalExpr}) / ${nominalExpr}`;
    }
    const minW = results.minW ?? null;
    return `(${fmtExprNum(minW, decimalPlaces) ?? ":min_wt"} - ${nominalExpr}) / ${nominalExpr}`;
  }, [mode, results.minContent, results.minW, decimalPlaces, nominalExpr]);

  return (
    <div className="w-full">
      <div className="bg-background border border-border rounded-lg px-4 py-3 mb-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {testMode && (
              <Button variant="outline" className="gap-1" onClick={onBack}>
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            <div className="flex items-center gap-2 ml-1">
              <Beaker className="w-4 h-4 text-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                Uniformity of Weight — {testMode ? "Test" : "Evaluate"}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ReadonlyPill
              label="Type"
              value={
                mode === "capsule"
                  ? "Capsules"
                  : mode === "tablet"
                    ? "Tablets"
                    : "Tubes"
              }
            />
            <ReadonlyPill label="N" value={String(sampleCount)} />
            <ReadonlyPill
              label="Decimals"
              value={decimalPlaces === "" ? "auto" : String(decimalPlaces)}
            />
            <ReadonlyPill label="Percentage" value={percent ? "On" : "Off"} />
            <ReadonlyPill
              label={mode === "capsule" ? "Nominal content wt" : "Nominal wt"}
              value={toFixedSmart(nominal ?? null, decimalPlaces)}
            />
          </div>
        </div>
      </div>

      {/* Inputs */}
      {mode === "capsule" ? (
        <div className="space-y-4">
          <Section title={`Summary (N = ${sampleCount})`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <Label className="min-w-[220px] text-xs">
                  Weight of {sampleCount} Capsules
                </Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  className="text-xs"
                  value={inputs.bulkCapsules ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "" || /^-?\d*\.?\d*$/.test(v)) {
                      updateInputs({ ...inputs, bulkCapsules: v });
                    }
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="min-w-[220px] text-xs">
                  Weight of {sampleCount} empty shells
                </Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  className="text-xs"
                  value={inputs.bulkShells ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "" || /^-?\d*\.?\d*$/.test(v)) {
                      updateInputs({ ...inputs, bulkShells: v });
                    }
                  }}
                />
              </div>
            </div>
          </Section>

          <Section title="Per-Capsule Weights">
            {/* Single header row for all columns */}
            <div className="mb-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {Array.from({ length: Math.min(sampleCount, 4) }).map(
                (_, colIndex) => (
                  <div
                    key={`header-${colIndex}`}
                    className="grid bg-muted/30 border border-border rounded-md overflow-hidden"
                    style={{ gridTemplateColumns: "56px 1fr 1fr 1fr" }}
                  >
                    <div className="px-2 py-1 text-sm font-semibold text-foreground border-b border-border text-center">
                      #
                    </div>
                    <div className="px-2 py-1 text-sm font-semibold text-foreground border-b border-border">
                      Caps wt
                    </div>
                    <div className="px-2 py-1 text-sm font-semibold text-foreground border-b border-border">
                      Shell wt
                    </div>
                    <div className="px-2 py-1 text-sm font-semibold text-foreground border-b border-border text-center">
                      Content wt
                    </div>
                  </div>
                ),
              )}
              {/* Empty divs to maintain grid alignment */}
              {Array.from({ length: sampleCount > 0 ? 1 : 0 }).map((_, i) => (
                <div key={`spacer-${i}`} className="hidden md:block" />
              ))}
            </div>

            {/* Grid of data cards without headers */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {Array.from({ length: sampleCount }).map((_, i) => {
                const capsWts = ensureArrayLen(inputs.capsWts, sampleCount);
                const shellWts = ensureArrayLen(inputs.shellWts, sampleCount);
                const c = numberOrNull(capsWts[i] || "");
                const s = numberOrNull(shellWts[i] || "");
                const content = c != null && s != null ? c - s : null;
                return (
                  <div
                    key={`caps-${i}`}
                    className="border border-border rounded-md overflow-hidden bg-background"
                  >
                    <div
                      className="grid items-center"
                      style={{ gridTemplateColumns: "56px 1fr 1fr 1fr" }}
                    >
                      <div className="px-2 py-1 text-center text-sm font-semibold text-muted-foreground bg-muted/30">
                        #{i + 1}
                      </div>
                      <div className="p-1">
                        <Input
                          type="text"
                          inputMode="decimal"
                          className="text-xs text-center"
                          placeholder="0.000"
                          aria-label={`Capsule ${i + 1} weight`}
                          value={capsWts[i] || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "" || /^-?\d*\.?\d*$/.test(v)) {
                              const next = [...capsWts];
                              next[i] = v;
                              updateInputs({ ...inputs, capsWts: next });
                            }
                          }}
                        />
                      </div>
                      <div className="p-1">
                        <Input
                          type="text"
                          inputMode="decimal"
                          className="text-xs text-center"
                          placeholder="0.000"
                          aria-label={`Shell ${i + 1} weight`}
                          value={shellWts[i] || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "" || /^-?\d*\.?\d*$/.test(v)) {
                              const next = [...shellWts];
                              next[i] = v;
                              updateInputs({ ...inputs, shellWts: next });
                            }
                          }}
                        />
                      </div>
                      <div className="px-2 py-1 text-center">
                        <span className="inline-block text-sm px-1.5 py-0.5 rounded border border-border bg-muted/30 text-foreground min-w-[64px]">
                          {toFixedSmart(content, decimalPlaces)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Derived and deviation */}
          <Section title="Results">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
              <Metric
                label="Weight of content"
                value={results.totalContent}
                decimalPlaces={decimalPlaces}
              />
              <Metric
                label="Average Weight of Capsule (bulk ÷ N)"
                value={results.avgCapsule}
                decimalPlaces={decimalPlaces}
              />
              <Metric
                label="Capsule min (caps wt)"
                value={results.minCaps}
                decimalPlaces={decimalPlaces}
              />
              <Metric
                label="Capsule max (caps wt)"
                value={results.maxCaps}
                decimalPlaces={decimalPlaces}
              />
              <Metric
                label="Content min"
                value={results.minContent}
                decimalPlaces={decimalPlaces}
              />
              <Metric
                label="Content max"
                value={results.maxContent}
                decimalPlaces={decimalPlaces}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <FormulaCard
                title="+ Dev"
                subtitle="(Max content wt − Nominal content wt) / Nominal content wt"
                expression={plusExpr}
                result={fmtResult(results.plusDev, decimalPlaces)}
                showPercentage={percent}
                showFootnote
              />
              <FormulaCard
                title="- Dev"
                subtitle="(Min content wt − Nominal content wt) / Nominal content wt"
                expression={minusExpr}
                result={fmtResult(results.minusDev, decimalPlaces)}
                showPercentage={percent}
                showFootnote
              />
            </div>
          </Section>
        </div>
      ) : (
        <>
          <Section
            title={`${mode === "tablet" ? "Tablets" : "Tubes"} — Bulk Weight (N = ${sampleCount})`}
          >
            <div className="flex items-center gap-2">
              <Label className="min-w-[240px] text-xs">
                Combined Weight of {sampleCount}{" "}
                {mode === "tablet" ? "Tablets" : "Tubes"}
              </Label>
              <Input
                type="text"
                inputMode="decimal"
                className="text-xs"
                value={inputs.bulkTotal ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "" || /^-?\d*\.?\d*$/.test(v)) {
                    updateInputs({ ...inputs, bulkTotal: v });
                  }
                }}
              />
            </div>
          </Section>

          <Section
            title={`${mode === "tablet" ? "Tablets" : "Tubes"} — Individual Weights`}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {ensureArrayLen(inputs.indWts, sampleCount).map((val, i, arr) => (
                <div key={`ind-${i}`} className="flex items-center gap-2">
                  <Label className="text-sm min-w-[46px]">#{i + 1}</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    className="text-xs"
                    value={val || ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "" || /^-?\d*\.?\d*$/.test(v)) {
                        const next = [...arr];
                        next[i] = v;
                        updateInputs({ ...inputs, indWts: next });
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </Section>

          <Section title="Results">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
              <Metric
                label="Average Weight (bulk ÷ N)"
                value={results.avg}
                decimalPlaces={decimalPlaces}
              />
              <Metric
                label="Minimum Weight (individual)"
                value={results.minW}
                decimalPlaces={decimalPlaces}
              />
              <Metric
                label="Maximum Weight (individual)"
                value={results.maxW}
                decimalPlaces={decimalPlaces}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <FormulaCard
                title="+ Dev"
                subtitle="(Max wt − Nominal wt) / Nominal wt"
                expression={plusExpr}
                result={fmtResult(results.plusDev, decimalPlaces)}
                showPercentage
                showFootnote
              />
              <FormulaCard
                title="- Dev"
                subtitle="(Min wt − Nominal wt) / Nominal wt"
                expression={minusExpr}
                result={fmtResult(results.minusDev, decimalPlaces)}
                showPercentage
                showFootnote
              />
            </div>
          </Section>
        </>
      )}

      {testMode && (
        <div className="flex items-center justify-end gap-2 mt-3">
          <Button variant="outline" className="gap-1" onClick={resetInputs}>
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          <Button className="gap-1" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
            Back to Config
          </Button>
        </div>
      )}
    </div>
  );
};
