import type { FormulaInput } from "../input";
import {
  decodeFormulaDefinitionV1,
  evaluateCompiledFormulaV1,
  hashCompiledFormulaDefinitionV1,
  sha256CanonicalJson,
} from "../../../apps/web/src/shared/formula/core";
import {
  FormulaServiceOperation,
  FormulaServiceStatus,
  type FormulaCalculationService,
  type FormulaServiceResponseV1,
} from "./contracts";
import { verifyServiceConfiguration } from "./configuration-verification";
import {
  decodeEvaluateRequestV1,
  decodeValidateRequestV1,
  type RequestDecodeResult,
} from "./request-decode";
import {
  DEFAULT_SERVICE_EVALUATION_LIMITS,
  DEFAULT_SERVICE_FORMULA_LIMITS,
  type FormulaCalculationServiceConfig,
  validateServiceConfig,
} from "./service-config";
import {
  createServiceResponseFactory,
  type PreparedFormulaRequest,
} from "./service-response";
import { BoundedLruCache } from "./compiled-cache";
import { executeAuthoritativeFormulaTests } from "./test-execution";
import { validateWorksheetPreprocessor } from "./worksheet-preprocessor-validation";

const INPUT_HASH_DOMAIN = "oryx:formula-resolved-inputs:v1";

export const createFormulaCalculationService = (
  config: FormulaCalculationServiceConfig,
): FormulaCalculationService => {
  validateServiceConfig(config);
  const formulaLimits = config.formulaLimits ?? DEFAULT_SERVICE_FORMULA_LIMITS;
  const evaluationLimits =
    config.evaluationLimits ?? DEFAULT_SERVICE_EVALUATION_LIMITS;
  const { completed, response } = createServiceResponseFactory(
    config.engineBuildHash,
  );
  const cache = new BoundedLruCache<{
    definition: PreparedFormulaRequest<FormulaInput>["definition"];
    hash: string;
    canonical: string;
  }>(config.maxCompiledDefinitions ?? 256);

  const prepare = async <
    T extends {
      requestId: string;
      definitionHash: string;
      numericPolicyVersion: string;
      definition: FormulaInput;
    },
  >(
    operation: FormulaServiceOperation,
    decoded: RequestDecodeResult<T>,
  ): Promise<
    { response: FormulaServiceResponseV1 } | PreparedFormulaRequest<T>
  > => {
    if (!config.enabled) {
      return { response: response(operation, FormulaServiceStatus.Disabled) };
    }
    if (!decoded.ok) {
      return {
        response: response(operation, FormulaServiceStatus.InvalidRequest, {
          requestIssues: decoded.issues,
        }),
      };
    }
    const { request } = decoded;
    if (request.numericPolicyVersion !== config.supportedNumericPolicyVersion) {
      return {
        response: response(
          operation,
          FormulaServiceStatus.UnsupportedNumericPolicy,
          {
            requestId: request.requestId,
            claimedDefinitionHash: request.definitionHash,
          },
        ),
      };
    }
    let payloadHash: string;
    try {
      payloadHash = await sha256CanonicalJson(
        "oryx:formula-service-definition-payload:v1",
        request.definition,
      );
    } catch {
      return {
        response: response(operation, FormulaServiceStatus.InvalidDefinition, {
          requestId: request.requestId,
          claimedDefinitionHash: request.definitionHash,
        }),
      };
    }
    const cacheKey = `${request.definitionHash}:${request.numericPolicyVersion}:${payloadHash}`;
    const cached = cache.get(cacheKey);
    if (cached) return { request, ...cached };
    const compiled = decodeFormulaDefinitionV1(
      request.definition,
      formulaLimits,
    );
    if (!compiled.ok) {
      return {
        response: response(operation, FormulaServiceStatus.InvalidDefinition, {
          requestId: request.requestId,
          claimedDefinitionHash: request.definitionHash,
          definitionIssues: compiled.issues,
        }),
      };
    }
    const worksheetIssues = await validateWorksheetPreprocessor(
      compiled.definition.worksheetPolicy?.preprocessor,
      formulaLimits,
      evaluationLimits,
    );
    if (worksheetIssues.length > 0) {
      return {
        response: response(operation, FormulaServiceStatus.InvalidDefinition, {
          requestId: request.requestId,
          claimedDefinitionHash: request.definitionHash,
          definitionIssues: worksheetIssues,
        }),
      };
    }
    if (
      compiled.definition.numericPolicyVersion !== request.numericPolicyVersion
    ) {
      return {
        response: response(
          operation,
          FormulaServiceStatus.UnsupportedNumericPolicy,
          {
            requestId: request.requestId,
            claimedDefinitionHash: request.definitionHash,
          },
        ),
      };
    }
    const hash = await hashCompiledFormulaDefinitionV1(compiled.definition);
    if (hash !== request.definitionHash) {
      return {
        response: response(
          operation,
          FormulaServiceStatus.DefinitionHashMismatch,
          {
            requestId: request.requestId,
            claimedDefinitionHash: request.definitionHash,
            computedDefinitionHash: hash,
          },
        ),
      };
    }
    const prepared = {
      definition: compiled.definition,
      hash,
      canonical: compiled.canonical,
    };
    cache.set(cacheKey, prepared);
    return { request, ...prepared };
  };

  return {
    metrics: () => ({ cache: cache.metrics() }),
    async validate(input) {
      const prepared = await prepare(
        FormulaServiceOperation.Validate,
        decodeValidateRequestV1(input),
      );
      if ("response" in prepared) return prepared.response;
      return completed(FormulaServiceOperation.Validate, prepared, {
        testOutcomes: executeAuthoritativeFormulaTests(
          prepared.definition,
          prepared.request.testCases,
          evaluationLimits,
        ),
      });
    },
    async evaluate(input) {
      const prepared = await prepare(
        FormulaServiceOperation.Evaluate,
        decodeEvaluateRequestV1(
          input,
          formulaLimits.maxVariables,
          evaluationLimits.maxInputDigits + 2,
        ),
      );
      if ("response" in prepared) return prepared.response;
      const request = prepared.request;
      const configuration = await verifyServiceConfiguration(
        request.configuration,
        request.configurationHash,
        prepared.hash,
        prepared.definition,
      );
      if (!configuration.ok) {
        const status = configuration.computedHash
          ? FormulaServiceStatus.ConfigurationHashMismatch
          : FormulaServiceStatus.InvalidConfiguration;
        return completed(
          FormulaServiceOperation.Evaluate,
          prepared,
          {
            claimedConfigurationHash: request.configurationHash,
            computedConfigurationHash: configuration.computedHash,
            placementKey: configuration.placementKey,
            configurationIssues: configuration.issues,
          },
          status,
        );
      }
      const computedInputHash = await sha256CanonicalJson(
        INPUT_HASH_DOMAIN,
        request.resolvedInputs,
      );
      return completed(FormulaServiceOperation.Evaluate, prepared, {
        claimedConfigurationHash: request.configurationHash,
        computedConfigurationHash: configuration.computedHash,
        computedInputHash,
        placementKey: configuration.placementKey,
        evaluation: evaluateCompiledFormulaV1(
          prepared.definition,
          request.resolvedInputs,
          evaluationLimits,
        ),
      });
    },
  };
};
