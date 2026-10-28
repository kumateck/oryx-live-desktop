import React from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Settings,
  FunctionSquare,
  Calculator,
  Beaker,
  Plus,
} from "lucide-react";
import type { ConfigSettings, FirstColumnPurpose } from "../types";
import DecimalPolicyFields from "../decimal-policy-fields";

type Props = {
  disabled?: boolean | undefined;
  settings: ConfigSettings;
  onSettingsChange: (next: ConfigSettings) => void;
  onFinalize: () => void;
};

const SettingsPanel: React.FC<Props> = ({
  disabled,
  settings,
  onSettingsChange,
  onFinalize,
}) => {
  return (
    <>
      <header className="flex items-center justify-between bg-background border-b border-border py-3 mb-6 px-2">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-foreground" />
          <span className="text-lg font-semibold text-foreground">
            Formula Configuration
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onFinalize}
            disabled={disabled}
            type="button"
          >
            <FunctionSquare className="w-4 h-4 mr-1" />
            Show Expression Panel
          </Button>
        </div>
      </header>

      <div className="bg-background border border-border rounded-lg p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground">
            Configuration Settings
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 gap-x-24">
          {/* Table Settings */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">
              Table Settings
            </h4>
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="standardInTable" className="cursor-pointer">
                Include First Column
              </Label>
              <Switch
                id="standardInTable"
                checked={settings.standardInTable}
                onCheckedChange={(checked) =>
                  onSettingsChange({ ...settings, standardInTable: checked })
                }
                disabled={disabled}
              />
            </div>
            {settings.standardInTable && (
              <div className="flex flex-col items-start gap-1 md:flex-row md:items-center md:justify-between md:gap-2">
                <Label
                  htmlFor="firstColumnPurpose"
                  className="cursor-pointer w-full md:w-auto"
                >
                  First Column Purpose
                </Label>
                <select
                  id="firstColumnPurpose"
                  value={settings.firstColumnPurpose}
                  onChange={(e) =>
                    onSettingsChange({
                      ...settings,
                      firstColumnPurpose: e.target.value as FirstColumnPurpose,
                    })
                  }
                  className="w-full md:w-auto text-xs bg-background border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-info/40"
                  disabled={disabled}
                >
                  <option value="standard">Standard</option>
                  <option value="blank">Blank</option>
                  <option value="titre">Titre</option>
                  <option value="control">Control</option>
                </select>
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="formulaInTable" className="cursor-pointer">
                Formula in Table (derived columns)
              </Label>
              <Switch
                id="formulaInTable"
                checked={settings.formulaInTable}
                onCheckedChange={(checked) =>
                  onSettingsChange({ ...settings, formulaInTable: checked })
                }
                disabled={disabled}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="percentageResults" className="cursor-pointer">
                Display Results as Percentage
              </Label>
              <Switch
                id="percentageResults"
                checked={settings.percentageResults}
                onCheckedChange={(checked) =>
                  onSettingsChange({ ...settings, percentageResults: checked })
                }
                disabled={disabled}
              />
            </div>
          </div>

          {/* Calculation Settings */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">
              Calculation Settings
            </h4>
            <div className="flex items-center justify-between">
              <Label htmlFor="calculateAvgInTable" className="cursor-pointer">
                Column Average
              </Label>
              <Switch
                id="calculateAvgInTable"
                checked={settings.calculateAvgInTable}
                onCheckedChange={(checked) =>
                  onSettingsChange({
                    ...settings,
                    calculateAvgInTable: checked,
                  })
                }
                disabled={disabled}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="calculateSdInTable" className="cursor-pointer">
                Column SD
              </Label>
              <Switch
                id="calculateSdInTable"
                checked={settings.calculateSdInTable}
                onCheckedChange={(checked) =>
                  onSettingsChange({ ...settings, calculateSdInTable: checked })
                }
                disabled={disabled}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="calculateRsdInTable" className="cursor-pointer">
                Column RSD
              </Label>
              <Switch
                id="calculateRsdInTable"
                checked={settings.calculateRsdInTable}
                onCheckedChange={(checked) =>
                  onSettingsChange({
                    ...settings,
                    calculateRsdInTable: checked,
                  })
                }
                disabled={disabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="averageAllResults" className="cursor-pointer">
                Average All Results
              </Label>
              <Switch
                id="averageAllResults"
                checked={settings.averageAllResults}
                onCheckedChange={(checked) =>
                  onSettingsChange({ ...settings, averageAllResults: checked })
                }
                disabled={disabled}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Label
                htmlFor="namedExpressionsEnabled"
                className="cursor-pointer"
              >
                Named Expressions
              </Label>
              <Switch
                id="namedExpressionsEnabled"
                checked={settings.namedExpressionsEnabled}
                onCheckedChange={(checked) =>
                  onSettingsChange({
                    ...settings,
                    namedExpressionsEnabled: checked,
                  })
                }
                disabled={disabled}
              />
            </div>
          </div>

          {/* Inputs Settings */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">
              Inputs Settings
            </h4>
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="standardInput" className="cursor-pointer">
                Enable Standard Weight
              </Label>
              <Switch
                id="standardInput"
                checked={settings.standardInput}
                onCheckedChange={(checked) =>
                  onSettingsChange({ ...settings, standardInput: checked })
                }
                disabled={disabled}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="sampleInput" className="cursor-pointer">
                Enable Sample Weight
              </Label>
              <Switch
                id="sampleInput"
                checked={settings.sampleInput}
                onCheckedChange={(checked) =>
                  onSettingsChange({ ...settings, sampleInput: checked })
                }
                disabled={disabled}
              />
            </div>
            <div className="flex flex-col items-start gap-1 md:flex-row md:items-center md:justify-between md:gap-2">
              <Label
                htmlFor="noOfSamples"
                className="cursor-pointer flex-nowrap w-full md:w-auto"
              >
                Number of Samples
              </Label>
              <input
                id="noOfSamples"
                type="number"
                min={1}
                value={settings.noOfSamples}
                onChange={(e) => {
                  const v = Math.max(1, Number(e.target.value));
                  onSettingsChange({ ...settings, noOfSamples: v });
                }}
                className="w-full md:w-28 text-xs bg-background border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-info/40"
                disabled={disabled}
              />
            </div>
            <div className="flex flex-col items-start gap-1 md:flex-row md:items-center md:justify-between md:gap-2">
              <Label
                htmlFor="noOfReadings"
                className="cursor-pointer w-full md:w-auto flex-nowrap"
              >
                Number of Readings
              </Label>
              <input
                id="noOfReadings"
                type="number"
                min={1}
                value={settings.noOfReadings}
                onChange={(e) => {
                  const v = Math.max(1, Number(e.target.value));
                  onSettingsChange({ ...settings, noOfReadings: v });
                }}
                className="w-full md:w-28 text-xs bg-background border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-info/40"
                disabled={disabled}
              />
            </div>
            <DecimalPolicyFields
              disabled={disabled}
              settings={settings}
              onSettingsChange={onSettingsChange}
            />
          </div>
        </div>
      </div>

      {/* Quick visual tags */}
      <section className="bg-background border border-border rounded-lg px-5 py-4 mb-6">
        <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider">
          Settings Summary
        </h3>
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
          {[
            {
              label: "First Column",
              value: settings.standardInTable ? "Enabled" : "Disabled",
              icon: <Settings className="w-4 h-4 text-info" />,
              active: settings.standardInTable,
            },
            {
              label: "Standard Inputs",
              value: settings.standardInput ? "Enabled" : "Disabled",
              icon: <FunctionSquare className="w-4 h-4 text-info" />,
              active: settings.standardInput,
            },
            {
              label: "Sample Inputs",
              value: settings.sampleInput ? "Enabled" : "Disabled",
              icon: <Plus className="w-4 h-4 text-success" />,
              active: settings.sampleInput,
            },
            {
              label: "Formula in Table",
              value: settings.formulaInTable ? "Enabled" : "Disabled",
              icon: <Calculator className="w-4 h-4 text-warning" />,
              active: settings.formulaInTable,
            },
            {
              label: "Average in Table",
              value: settings.calculateAvgInTable ? "Yes" : "No",
              icon: <Beaker className="w-4 h-4 text-info" />,
              active: settings.calculateAvgInTable,
            },
            {
              label: "SD in Table",
              value: settings.calculateSdInTable ? "Yes" : "No",
              icon: <Beaker className="w-4 h-4 text-info" />,
              active: settings.calculateSdInTable,
            },
            {
              label: "RSD in Table",
              value: settings.calculateRsdInTable ? "Yes" : "No",
              icon: <Beaker className="w-4 h-4 text-info" />,
              active: settings.calculateRsdInTable,
            },
            {
              label: "Percentage",
              value: settings.percentageResults ? "Yes" : "No",
              icon: <Calculator className="w-4 h-4 text-warning" />,
              active: settings.percentageResults,
            },
            {
              label: "Avg All Results",
              value: settings.averageAllResults ? "Yes" : "No",
              icon: <Calculator className="w-4 h-4 text-warning" />,
              active: settings.averageAllResults,
            },
            {
              label: "Input Decimals",
              value: settings.inputDecimalPlaces,
              icon: <FunctionSquare className="w-4 h-4 text-info" />,
              active: true,
            },
            {
              label: "Table Decimals",
              value: settings.tableCalculationDecimalPlaces,
              icon: <FunctionSquare className="w-4 h-4 text-info" />,
              active: true,
            },
            {
              label: "Result Decimals",
              value: settings.finalResultDecimalPlaces,
              icon: <FunctionSquare className="w-4 h-4 text-info" />,
              active: true,
            },
            {
              label: "Samples",
              value: settings.noOfSamples,
              icon: <Plus className="w-4 h-4 text-success" />,
              active: true,
            },
            {
              label: "Readings",
              value: settings.noOfReadings,
              icon: <Plus className="w-4 h-4 text-success" />,
              active: true,
            },
          ].map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2 p-2 rounded-lg shadow-sm border ${
                item.active
                  ? "border-border bg-muted"
                  : "border-border bg-background"
              } w-full`}
            >
              <div>{item.icon}</div>
              <div className="flex-1">
                <div className="text-xs font-medium text-foreground">
                  {item.label}
                </div>
                <div
                  className={`text-sm font-bold ${item.active ? "text-info" : "text-muted-foreground/80"}`}
                >
                  {item.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default SettingsPanel;
