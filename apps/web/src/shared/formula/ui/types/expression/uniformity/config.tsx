import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
const ButtonGroup = ({ children }: { children: React.ReactNode }) => <div role="group" className="inline-flex flex-wrap gap-1">{children}</div>;
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormulaCard } from "../../components/formula-card";
import {
  Decimals,
  ExpressionExtract,
  TheAduseiFormulaProps,
  UniformityMode,
} from "../../type";
import {
  Calculator,
  FlaskConical,
  Settings,
  Table2,
  TestTube2,
  Undo2,
  Beaker,
} from "lucide-react";

import { UniformityOfWeightEvaluate } from "./evaluate";
import { FormulaTypes } from "@/shared/formula/ui/legacy";

// Utils
const numberOrNull = (s: string): number | null => {
  if (s.trim() === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const clampInt = (n: number, min = 1, max = 200) =>
  Math.min(max, Math.max(min, Math.floor(n)));

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

// UI atoms
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

const SummaryItem: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="flex items-center justify-between bg-muted/30 border border-border rounded px-2 py-1">
    <span className="text-[11px] text-muted-foreground">{label}</span>
    <span className="text-[12px] font-medium text-foreground">{value}</span>
  </div>
);

const TypeSelector: React.FC<{
  value: UniformityMode;
  onChange: (m: UniformityMode) => void;
  disabled?: boolean | undefined;
}> = ({ value, onChange, disabled }) => {
  return (
    <ButtonGroup>
      <Button
        type="button"
        variant={value === "capsule" ? "default" : "outline"}
        onClick={() => onChange("capsule")}
        disabled={disabled}
        className="gap-1"
      >
        <FlaskConical className="w-3.5 h-3.5" />
        Capsules
      </Button>
      <Button
        type="button"
        variant={value === "tablet" ? "default" : "outline"}
        onClick={() => onChange("tablet")}
        disabled={disabled}
        className="gap-1"
      >
        <Table2 className="w-3.5 h-3.5" />
        Tablets
      </Button>
      <Button
        type="button"
        variant={value === "tube" ? "default" : "outline"}
        onClick={() => onChange("tube")}
        disabled={disabled}
        className="gap-1"
      >
        <TestTube2 className="w-3.5 h-3.5" />
        Tubes
      </Button>
    </ButtonGroup>
  );
};

// Main Config component (single page)
export const UniformityOfWeightConfig: React.FC<
  TheAduseiFormulaProps & { disabled?: boolean | undefined; className?: string | undefined }
> = ({ value, onChange, disabled, className }) => {
  // Controlled settings state
  const [mode, setMode] = useState<UniformityMode>("capsule");
  const [percent, setPercent] = useState<boolean>(false);
  const [decimalPlaces, setDecimalPlaces] = useState<Decimals>(2);
  const [sampleCount, setSampleCount] = useState<number>(20);
  const [nominalStr, setNominalStr] = useState<string>("");

  // Test routing (single page toggle)
  const [showTest, setShowTest] = useState<boolean>(false);

  const hydrated = useRef(false);

  // Hydrate settings from external controlled value once
  useEffect(() => {
    if (hydrated.current) return;
    if (!value || value.trim() === "") return;
    try {
      const parsed = JSON.parse(value) as Partial<ExpressionExtract>;
      if (
        parsed.mode === "capsule" ||
        parsed.mode === "tablet" ||
        parsed.mode === "tube"
      ) {
        setMode(parsed.mode);
        setSampleCount(
          typeof parsed.sampleCount === "number" && parsed.sampleCount > 0
            ? parsed.sampleCount
            : parsed.mode === "capsule"
              ? 20
              : 10,
        );
      }
      if (typeof parsed.percent === "boolean") setPercent(parsed.percent);
      if (parsed.decimalPlaces !== undefined)
        setDecimalPlaces(parsed.decimalPlaces as Decimals);
      if (typeof parsed.sampleCount === "number" && parsed.sampleCount > 0)
        setSampleCount(parsed.sampleCount);
      if (parsed.nominal !== undefined && parsed.nominal !== null)
        setNominalStr(String(parsed.nominal));
      hydrated.current = true;
    } catch (e) {
      console.warn(
        "[UniformityOfWeightConfig] Failed to parse 'value' JSON:",
        e,
      );
    }
  }, [value]);

  const nominal = useMemo(() => numberOrNull(nominalStr), [nominalStr]);

  // Emit controlled payload on every change
  const emit = useCallback(
    (next?: Partial<ExpressionExtract>) => {
      const payload = {
        type: FormulaTypes.Uniformity,
        mode: next?.mode ?? mode,
        percent: next?.percent ?? percent,
        decimalPlaces:
          next?.decimalPlaces !== undefined
            ? next.decimalPlaces
            : decimalPlaces,
        sampleCount: next?.sampleCount ?? sampleCount,
        nominal: next?.nominal !== undefined ? next.nominal : nominal,
      };
      onChange?.(JSON.stringify(payload));
    },
    [mode, percent, decimalPlaces, sampleCount, nominal, onChange],
  );

  useEffect(() => {
    emit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, percent, decimalPlaces, sampleCount, nominal]);

  // Expression preview strings
  const nominalToken = mode === "capsule" ? "nominal_wt" : "nominal_wt";
  const maxToken = mode === "capsule" ? "max_wt" : "max_wt";
  const minToken = mode === "capsule" ? "min_wt" : "min_wt";

  const nominalExpr = useMemo(
    () => fmtExprNum(nominal, decimalPlaces) ?? `:${nominalToken}`,
    [nominal, decimalPlaces, nominalToken],
  );

  const plusExpr = useMemo(
    () => `(${`:${maxToken}`} - ${nominalExpr}) / ${nominalExpr}`,
    [maxToken, nominalExpr],
  );
  const minusExpr = useMemo(
    () => `(${`:${minToken}`} - ${nominalExpr}) / ${nominalExpr}`,
    [minToken, nominalExpr],
  );

  const onReset = () => {
    const defaultN = mode === "capsule" ? 20 : 10;
    setSampleCount(defaultN);
    setDecimalPlaces(2);
    setPercent(false);
    setNominalStr("");
    emit({
      sampleCount: defaultN,
      decimalPlaces: 2,
      percent: false,
      nominal: null,
      type: FormulaTypes.Uniformity,
    });
  };

  // Guard: when test is opened, render test component (single page)
  if (showTest) {
    const testSettings = JSON.stringify({
      type: FormulaTypes.Uniformity,
      mode,
      percent,
      decimalPlaces,
      sampleCount,
      nominal,
    });
    return (
      <UniformityOfWeightEvaluate
        settings={testSettings}
        onBack={() => setShowTest(false)}
        testMode
        value={""}
        onChange={() => {}}
      />
    );
  }

  // Config + Deviation preview (single compact page)
  return (
    <div className={["w-full", className].filter(Boolean).join(" ")}>
      <div className="bg-background border border-border rounded-lg px-4 py-3 mb-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              Uniformity of Weight — Configuration
            </h2>
          </div>
          <TypeSelector
            value={mode}
            onChange={(m) => {
              setMode(m);
              const defaultN = m === "capsule" ? 20 : 10;
              if (sampleCount !== defaultN) {
                setSampleCount(defaultN);
                emit({ mode: m, sampleCount: defaultN });
              } else {
                emit({ mode: m });
              }
            }}
            disabled={disabled}
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onReset}
              className="gap-1"
            >
              <Undo2 className="w-4 h-4" />
              Reset
            </Button>
            <Button
              type="button"
              onClick={() => setShowTest(true)}
              className="gap-2 bg-muted text-foreground hover:bg-muted"
              title="Open a single-page tester with these settings"
            >
              <Beaker className="w-4 h-4" />
              Test Formula
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1  gap-3 space-y-5">
        {/* Left: Config form */}
        <div className=" space-y-3">
          <Section title="General">
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center justify-start gap-2">
                <Label className="min-w-[80px] text-xs">Sample Count</Label>
                <Input
                  className="text-xs max-w-40"
                  type="number"
                  min={1}
                  max={200}
                  value={String(sampleCount)}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!(v === "" || /^\d+$/.test(v))) return;
                    if (v === "") return;
                    const n = clampInt(Number(v), 1, 200);
                    setSampleCount(n);
                    emit({ sampleCount: n });
                  }}
                  disabled={disabled}
                />
              </div>

              <div className="flex items-center gap-2">
                <Label className="min-w-[70px] text-xs">
                  {mode === "capsule" ? "Nominal wt" : "Nominal wt"}
                </Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  className="text-xs"
                  value={nominalStr}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "" || /^-?\d*\.?\d*$/.test(v)) {
                      setNominalStr(v);
                      emit({ nominal: v === "" ? null : Number(v) });
                    }
                  }}
                  disabled={disabled}
                />
              </div>

              <div className="flex items-center gap-2">
                <Label className="min-w-[60px] text-xs">Decimals</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  className="text-xs max-w-20"
                  placeholder="auto"
                  value={decimalPlaces === "" ? "" : String(decimalPlaces)}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") {
                      setDecimalPlaces("");
                      emit({ decimalPlaces: "" });
                      return;
                    }
                    if (!/^\d+$/.test(v)) return;
                    const n = Math.max(0, Math.min(10, Number(v)));
                    setDecimalPlaces(n);
                    emit({ decimalPlaces: n });
                  }}
                  disabled={disabled}
                />
              </div>

              <div className="flex items-center gap-2">
                <Label className="min-w-[60px] text-xs">Percentage</Label>
                <ButtonGroup>
                  <Button
                    type="button"
                    variant={percent ? "default" : "outline"}
                    onClick={() => {
                      setPercent(true);
                      emit({ percent: true });
                    }}
                    disabled={disabled}
                  >
                    On
                  </Button>
                  <Button
                    type="button"
                    variant={!percent ? "default" : "outline"}
                    onClick={() => {
                      setPercent(false);
                      emit({ percent: false });
                    }}
                    disabled={disabled}
                  >
                    Off
                  </Button>
                </ButtonGroup>
              </div>
            </div>
          </Section>

          <Section
            title="Compact Summary"
            right={
              <div className="text-[11px] text-muted-foreground">
                Only these settings are saved.
              </div>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-xs">
              <SummaryItem
                label="Type"
                value={
                  mode === "capsule"
                    ? "Capsules"
                    : mode === "tablet"
                      ? "Tablets"
                      : "Tubes"
                }
              />
              <SummaryItem label="Sample Count" value={String(sampleCount)} />
              <SummaryItem
                label={mode === "capsule" ? "Nominal wt" : "Nominal wt"}
                value={toFixedSmart(nominal, decimalPlaces)}
              />
              <SummaryItem
                label="Decimals"
                value={decimalPlaces === "" ? "auto" : String(decimalPlaces)}
              />
              <SummaryItem label="Percentage" value={percent ? "On" : "Off"} />
            </div>
          </Section>
        </div>

        {/* Right: Deviation preview */}
        <div className=" space-y-3">
          <Section
            title="Deviation Preview"
            right={
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Calculator className="w-3.5 h-3.5" />
                Expressions show live nominal substitution
              </div>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <FormulaCard
                title="+ Dev"
                subtitle={
                  mode === "capsule"
                    ? "(Max wt − Nominal wt) / Nominal wt"
                    : "(Max wt − Nominal wt) / Nominal wt"
                }
                expression={plusExpr}
                result={null}
                className="text-sm"
                showPercentage={percent}
                showFootnote
              />
              <FormulaCard
                title="- Dev"
                subtitle={
                  mode === "capsule"
                    ? "(Min wt − Nominal wt) / Nominal wt"
                    : "(Min wt − Nominal wt) / Nominal wt"
                }
                expression={minusExpr}
                result={null}
                showPercentage={percent}
                showFootnote
              />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};
