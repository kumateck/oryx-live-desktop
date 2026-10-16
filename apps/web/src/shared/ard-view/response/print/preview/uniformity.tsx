import React, { useMemo } from "react";
import {
  Decimals,
  ExpressionExtract,
  UniformityMode,
} from "@/shared/formula/ui/types/type";
import { FormulaCard } from "../formula-card";
import { sanitizeNumber } from "@/shared/ard-view/legacy";

// ——— Shared types (mirrored from uniformity/evaluate.tsx) ———

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
  totalContent: number | null;
  avgCapsule: number | null;
  minCaps: number | null;
  maxCaps: number | null;
  minContent: number | null;
  maxContent: number | null;
  avg: number | null;
  minW: number | null;
  maxW: number | null;
  plusDev: number | null;
  minusDev: number | null;
};

type UniformityOfWeightValue = {
  settings: string;
  inputs: Inputs;
  results: Results;
};

// ——— Helpers ———

const ensureArrayLen = (arr: string[] | undefined, len: number): string[] => {
  const base = Array.isArray(arr) ? arr.slice(0, len) : [];
  while (base.length < len) base.push("");
  return base;
};

const numberOrNull = (s: string): number | null => {
  if (s.trim() === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const toFixedSmart = (
  n: number | null | undefined,
  decimalPlaces: Decimals,
  options?: { suffix?: string; dashIfNull?: boolean },
): string => {
  if (n === null || n === undefined || Number.isNaN(n)) {
    return options?.dashIfNull === false ? "" : "—";
  }
  const digits =
    decimalPlaces === "" || decimalPlaces === undefined
      ? undefined
      : decimalPlaces;
  const formatted =
    digits !== undefined
      ? n.toLocaleString(undefined, {
          maximumFractionDigits: digits,
          minimumFractionDigits: digits,
        })
      : n.toLocaleString(undefined, { maximumFractionDigits: 6 });
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
  return Number(n)
    .toFixed(digits)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
};

const safeParseResponse = (
  s: string | undefined,
): Partial<UniformityOfWeightValue> | undefined => {
  if (!s) return undefined;
  try {
    const obj = JSON.parse(s);
    if (obj && typeof obj === "object") return obj;
  } catch {
    // ignore
  }
  return undefined;
};

// ——— Sub-components ———

const Section: React.FC<{
  title: string;
  children: React.ReactNode;
  className?: string | undefined;
}> = ({ title, children, className }) => (
  <div className={` p-2 ${className || ""}`}>
    <div className="flex items-center gap-2 mb-1">
      <div className="w-1 h-3 bg-muted rounded-full" />
      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
        {title}
      </h3>
    </div>
    {children}
  </div>
);

const Metric: React.FC<{
  label: string;
  value: number | null;
  decimalPlaces: Decimals;
  showPercentage?: boolean | undefined;
}> = ({ label, value, decimalPlaces, showPercentage }) => (
  <div className="flex items-center justify-between bg-muted border border-border rounded px-2 py-1">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-semibold text-foreground">
      {showPercentage
        ? toFixedSmart(value, decimalPlaces, { suffix: "%" })
        : toFixedSmart(value, decimalPlaces)}
    </span>
  </div>
);

// const ReadonlyPill: React.FC<{ label: string; value: string }> = ({
//   label,
//   value,
// }) => (
//   <div className="flex items-center gap-2">
//     <div className="text-sm text-muted-foreground">{label}</div>
//     <div className="text-sm font-medium border border-border rounded px-2 py-0.5 bg-muted">
//       {value}
//     </div>
//   </div>
// );

interface Props {
  settings: string;
  response: string;
}

/**
 * UniformityPreview
 * Read-only preview of a Uniformity of Weight formula response.
 * All weight inputs are replaced with static value labels.
 * Results are either taken from the stored response or recomputed from inputs.
 */
export const UniformityPreview: React.FC<Props> = ({ settings, response }) => {
  const parsedSettings = useMemo<ExpressionExtract | null>(() => {
    try {
      if (!settings || settings.trim() === "") return null;
      const firstPass = JSON.parse(settings) as unknown;
      const parsed =
        typeof firstPass === "string"
          ? (JSON.parse(firstPass) as ExpressionExtract)
          : (firstPass as ExpressionExtract);
      return parsed;
    } catch {
      return null;
    }
  }, [settings]);

  const mode = (parsedSettings?.mode ?? "tablet") as UniformityMode;
  const sampleCount = sanitizeNumber(parsedSettings?.sampleCount);
  const decimalPlaces = parsedSettings?.decimalPlaces as Decimals;
  const percent = parsedSettings?.percent;
  const nominal = parsedSettings?.nominal;

  const parsedResponse = useMemo(() => safeParseResponse(response), [response]);

  // Hydrate inputs from the stored response
  const inputs = useMemo<Inputs>(() => {
    const raw = parsedResponse?.inputs;
    if (mode === "capsule") {
      return {
        bulkCapsules: raw?.bulkCapsules ?? "",
        bulkShells: raw?.bulkShells ?? "",
        capsWts: ensureArrayLen(raw?.capsWts, sampleCount),
        shellWts: ensureArrayLen(raw?.shellWts, sampleCount),
      };
    }
    return {
      bulkTotal: raw?.bulkTotal ?? "",
      indWts: ensureArrayLen(raw?.indWts, sampleCount),
    };
  }, [parsedResponse, mode, sampleCount]);

  // Use stored results if available; fall back to re-computed
  const results = useMemo<Results>(() => {
    if (parsedResponse?.results) return parsedResponse.results as Results;

    // Recompute from inputs
    if (mode === "capsule") {
      const bulkC = numberOrNull(inputs.bulkCapsules ?? "");
      const bulkS = numberOrNull(inputs.bulkShells ?? "");
      const totalContent =
        bulkC != null && bulkS != null ? bulkC - bulkS : null;
      const avgCapsule =
        bulkC != null && sampleCount > 0 ? bulkC / sampleCount : null;
      const capsWts = ensureArrayLen(inputs.capsWts, sampleCount);
      const shellWts = ensureArrayLen(inputs.shellWts, sampleCount);
      const capNums: number[] = [];
      const contentNums: number[] = [];
      for (let i = 0; i < sampleCount; i++) {
        const c = numberOrNull(capsWts[i] || "");
        const s = numberOrNull(shellWts[i] || "");
        if (c != null) capNums.push(c);
        if (c != null && s != null) contentNums.push(c - s);
      }
      const minCaps = capNums.length ? Math.min(...capNums) : null;
      const maxCaps = capNums.length ? Math.max(...capNums) : null;
      const minContent = contentNums.length ? Math.min(...contentNums) : null;
      const maxContent = contentNums.length ? Math.max(...contentNums) : null;
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
    }

    const bulk = numberOrNull(inputs.bulkTotal ?? "");
    const individuals = ensureArrayLen(inputs.indWts, sampleCount)
      .map(numberOrNull)
      .filter((v): v is number => v != null);
    const avg = bulk != null && sampleCount > 0 ? bulk / sampleCount : null;
    const minW = individuals.length ? Math.min(...individuals) : null;
    const maxW = individuals.length ? Math.max(...individuals) : null;
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
  }, [parsedResponse, mode, sampleCount, inputs, nominal]);

  const nominalToken = mode === "capsule" ? "nominal_content_wt" : "nominal_wt";
  const nominalExpr =
    fmtExprNum(nominal ?? null, decimalPlaces) ?? `:${nominalToken}`;

  const plusExpr =
    mode === "capsule"
      ? `(${fmtExprNum(results.maxContent, decimalPlaces) ?? ":max_content_wt"} - ${nominalExpr}) / ${nominalExpr}`
      : `(${fmtExprNum(results.maxW, decimalPlaces) ?? ":max_wt"} - ${nominalExpr}) / ${nominalExpr}`;

  const minusExpr =
    mode === "capsule"
      ? `(${fmtExprNum(results.minContent, decimalPlaces) ?? ":min_content_wt"} - ${nominalExpr}) / ${nominalExpr}`
      : `(${fmtExprNum(results.minW, decimalPlaces) ?? ":min_wt"} - ${nominalExpr}) / ${nominalExpr}`;

  return (
    <div className="space-y-3 w-full">
      {/* Header */}
      {/* <div className="bg-card border border-border rounded px-3 py-2">
        <div className="flex items-center justify-between">
         
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
      </div> */}

      {mode === "capsule" ? (
        <>
          <Section title={`Summary (N = ${sampleCount})`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <span className="min-w-[200px] text-sm text-foreground">
                  Weight of {sampleCount} Capsules
                </span>
                <span className="flex-1 bg-muted border border-border rounded px-2 py-1 text-sm text-foreground tabular-nums">
                  {inputs.bulkCapsules || (
                    <span className="text-muted-foreground italic">—</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="min-w-[200px] text-sm text-foreground">
                  Weight of {sampleCount} empty shells
                </span>
                <span className="flex-1 bg-muted border border-border rounded px-2 py-1 text-sm text-foreground tabular-nums">
                  {inputs.bulkShells || (
                    <span className="text-muted-foreground italic">—</span>
                  )}
                </span>
              </div>
            </div>
          </Section>

          <Section title="Per-Capsule Weights">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {Array.from({ length: sampleCount }).map((_, i) => {
                const capsWts = ensureArrayLen(inputs.capsWts, sampleCount);
                const shellWts = ensureArrayLen(inputs.shellWts, sampleCount);
                const c = numberOrNull(capsWts[i] || "");
                const s = numberOrNull(shellWts[i] || "");
                const content = c != null && s != null ? c - s : null;
                return (
                  <div
                    key={i}
                    className="border border-border rounded overflow-hidden bg-card"
                  >
                    <div
                      className="grid items-center"
                      style={{ gridTemplateColumns: "56px 1fr 1fr 1fr" }}
                    >
                      <div className="px-2 py-1 text-center text-sm font-semibold text-muted-foreground bg-muted">
                        #{i + 1}
                      </div>
                      <div className="p-1 text-center">
                        <span className="inline-block w-full text-sm text-center tabular-nums text-foreground bg-muted border border-border rounded px-1 py-1">
                          {capsWts[i] || (
                            <span className="text-muted-foreground"></span>
                          )}
                        </span>
                      </div>
                      <div className="p-1 text-center">
                        <span className="inline-block w-full text-sm text-center tabular-nums text-foreground bg-muted border border-border rounded px-1 py-1">
                          {shellWts[i] || (
                            <span className="text-muted-foreground"></span>
                          )}
                        </span>
                      </div>
                      <div className="px-2 py-1 text-center">
                        <span className="inline-block text-sm px-1 py-0.5 rounded border border-border bg-muted text-foreground min-w-[64px]">
                          {toFixedSmart(content, decimalPlaces)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title="">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
              <Metric
                label={"Nominal content wt"}
                value={sanitizeNumber(nominal)}
                decimalPlaces={decimalPlaces}
              />
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
                result={results.plusDev}
                showPercentage={percent}
              />
              <FormulaCard
                title="- Dev"
                subtitle="(Min content wt − Nominal content wt) / Nominal content wt"
                expression={minusExpr}
                result={results.minusDev}
                showPercentage={percent}
              />
            </div>
          </Section>
        </>
      ) : (
        <>
          <Section
            title={`${mode === "tablet" ? "Tablets" : "Tubes"} — Bulk Weight & Results (N = ${sampleCount})`}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="min-w-[220px] text-sm text-foreground">
                  Combined Weight of {sampleCount}{" "}
                  {mode === "tablet" ? "Tablets" : "Tubes"}:
                </span>
                <span className="flex-1 px-2 py-1 text-sm text-foreground tabular-nums">
                  {inputs.bulkTotal || (
                    <span className="text-muted-foreground italic"></span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-sm text-foreground">Nominal Weight:</span>
                <span className="text-sm font-semibold text-foreground">
                  {toFixedSmart(sanitizeNumber(nominal), decimalPlaces)}
                </span>
              </div>
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-sm text-foreground">
                  Average Weight (bulk ÷ N):
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {toFixedSmart(results.avg, decimalPlaces)}
                </span>
              </div>
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-sm text-foreground">
                  Minimum Weight (individual):
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {toFixedSmart(results.minW, decimalPlaces)}
                </span>
              </div>
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-sm text-foreground">
                  Maximum Weight (individual):
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {toFixedSmart(results.maxW, decimalPlaces)}
                </span>
              </div>
            </div>
          </Section>

          <Section
            title={`${mode === "tablet" ? "Tablets" : "Tubes"} — Individual Weights`}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {ensureArrayLen(inputs.indWts, sampleCount).map((val, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm  font-medium text-muted-foreground">
                    #{i + 1}
                  </span>
                  <span className="flex-1 border-b border-border px-1 py-0.5 text-sm text-foreground tabular-nums leading-tight">
                    {val || <span className="text-muted-foreground"></span>}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <FormulaCard
                title="+ Dev"
                subtitle="(Max wt − Nominal wt) / Nominal wt"
                expression={plusExpr}
                result={results.plusDev}
                showPercentage
              />
              <FormulaCard
                title="- Dev"
                subtitle="(Min wt − Nominal wt) / Nominal wt"
                expression={minusExpr}
                result={results.minusDev}
                showPercentage
              />
            </div>
          </Section>
        </>
      )}
    </div>
  );
};
