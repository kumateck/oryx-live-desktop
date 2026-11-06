import { z } from "zod";
import {
  FormulaIssueCode,
  FormulaIssueSeverity,
  buildDefaultFormulaTestCasesV1,
  compileFormulaDefinitionV1,
  hashWorksheetPreprocessorTestCasesV1,
  hashCompiledFormulaDefinitionV1,
  runFormulaTestCasesV1,
  type FormulaEvaluationLimits,
  type FormulaIssue,
  type FormulaLimits,
  type FormulaWorksheetPreprocessorV1,
} from "../../../apps/web/src/shared/formula/core";
import { verifyServiceConfiguration } from "./configuration-verification";

const issue = (path: string, message: string): FormulaIssue => ({
  code: FormulaIssueCode.InvalidDefinition,
  severity: FormulaIssueSeverity.Error,
  path,
  message,
});

export async function validateWorksheetPreprocessor(
  preprocessor: FormulaWorksheetPreprocessorV1 | undefined,
  limits: FormulaLimits,
  evaluationLimits: FormulaEvaluationLimits,
): Promise<FormulaIssue[]> {
  if (!preprocessor) return [];
  const compiled = compileFormulaDefinitionV1(preprocessor.definition, limits);
  if (!compiled.ok)
    return compiled.issues.map((item) => ({
      ...item,
      path: `worksheetPolicy.preprocessor.definition.${item.path}`,
    }));
  if (compiled.definition.worksheetPolicy?.preprocessor)
    return [
      issue(
        "worksheetPolicy.preprocessor.definition",
        "Nested worksheet preprocessors are not permitted.",
      ),
    ];
  const hash = await hashCompiledFormulaDefinitionV1(compiled.definition);
  if (hash !== preprocessor.definitionHash)
    return [
      issue(
        "worksheetPolicy.preprocessor.definitionHash",
        "Worksheet preprocessor definition hash does not match.",
      ),
    ];
  const validationCases = buildDefaultFormulaTestCasesV1(
    compiled.definition,
    evaluationLimits,
  );
  const validationCaseHash =
    await hashWorksheetPreprocessorTestCasesV1(validationCases);
  if (validationCaseHash !== preprocessor.validationCaseHash)
    return [
      issue(
        "worksheetPolicy.preprocessor.validationCaseHash",
        "Worksheet preprocessor validation evidence does not match.",
      ),
    ];
  if (
    !runFormulaTestCasesV1(
      compiled.definition,
      validationCases,
      evaluationLimits,
    ).passed
  )
    return [
      issue(
        "worksheetPolicy.preprocessor.validationCaseHash",
        "Worksheet preprocessor validation cases do not pass.",
      ),
    ];
  const decodedConfiguration = z.json().safeParse(preprocessor.configuration);
  if (!decodedConfiguration.success)
    return [issue("worksheetPolicy.preprocessor.configuration", "Invalid preprocessor configuration.")];
  const configuration = await verifyServiceConfiguration(
    decodedConfiguration.data,
    preprocessor.configurationHash,
    hash,
    compiled.definition,
  );
  if (!configuration.ok)
    return [
      issue(
        "worksheetPolicy.preprocessor.configurationHash",
        "Worksheet preprocessor configuration is invalid or does not match.",
      ),
    ];
  const variableKeys = new Set(
    compiled.definition.variables.map((item) => item.key),
  );
  const resultKeys = new Set(
    compiled.definition.results.map((item) => item.key),
  );
  if (
    preprocessor.inputs.some((item) => !variableKeys.has(item.variableKey)) ||
    preprocessor.outputs.some((item) => !resultKeys.has(item.resultKey))
  )
    return [
      issue(
        "worksheetPolicy.preprocessor",
        "Worksheet preprocessor input/output mapping is incomplete.",
      ),
    ];
  return [];
}
