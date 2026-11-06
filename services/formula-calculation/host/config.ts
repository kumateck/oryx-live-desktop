import { readFileSync } from "node:fs";

import { isFormulaV2InternalServiceEnabled } from "../service";

export interface FormulaHostConfig {
  enabled: boolean;
  hostname: string;
  port: number;
  workloadToken: string;
  engineBuildHash: string;
  numericPolicyVersion: string;
  maxRequestBytes: number;
  concurrency: number;
  deadlineMs: number;
  maxCompiledDefinitions: number;
}

const integer = (
  value: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
  name: string,
): number => {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum)
    throw new Error(`${name} is outside its permitted range.`);
  return parsed;
};

export type FormulaHostEnvironment = Readonly<
  Record<string, string | undefined>
>;

const secret = (env: FormulaHostEnvironment): string => {
  const path = env.FORMULA_SERVICE_AUTH_SECRET_FILE;
  const value = path
    ? readFileSync(path, "utf8").trim()
    : (env.FORMULA_SERVICE_AUTH_SECRET ?? "");
  if (value.length < 32 || value.length > 512)
    throw new Error("Formula service authentication secret is invalid.");
  return value;
};

export const loadFormulaHostConfig = (
  env: FormulaHostEnvironment,
): FormulaHostConfig => {
  const enabled = isFormulaV2InternalServiceEnabled(
    env.FORMULA_V2_INTERNAL_SERVICE_ENABLED,
  );
  const engineBuildHash = env.FORMULA_SERVICE_ENGINE_BUILD_HASH ?? "";
  const numericPolicyVersion = env.FORMULA_SERVICE_NUMERIC_POLICY_VERSION ?? "";
  const releasedHash = env.FORMULA_SERVICE_RELEASE_ENGINE_HASH;
  if (enabled && releasedHash && releasedHash !== engineBuildHash)
    throw new Error("Configured engine hash does not match the released image.");
  if (enabled && !/^[a-f0-9]{64}$/.test(engineBuildHash))
    throw new Error("Enabled formula service requires an engine build hash.");
  if (
    enabled &&
    !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(numericPolicyVersion)
  )
    throw new Error(
      "Enabled formula service requires a numeric policy version.",
    );
  return {
    enabled,
    hostname: env.FORMULA_SERVICE_HOST ?? "127.0.0.1",
    port: integer(env.FORMULA_SERVICE_PORT, 3101, 1, 65_535, "port"),
    workloadToken: enabled ? secret(env) : "",
    engineBuildHash,
    numericPolicyVersion,
    maxRequestBytes: integer(
      env.FORMULA_SERVICE_MAX_REQUEST_BYTES,
      262_144,
      1_024,
      1_048_576,
      "max request bytes",
    ),
    concurrency: integer(
      env.FORMULA_SERVICE_CONCURRENCY,
      2,
      1,
      32,
      "concurrency",
    ),
    deadlineMs: integer(
      env.FORMULA_SERVICE_DEADLINE_MS,
      2_000,
      100,
      10_000,
      "deadline",
    ),
    maxCompiledDefinitions: integer(
      env.FORMULA_SERVICE_CACHE_ENTRIES,
      256,
      1,
      2_048,
      "cache entries",
    ),
  };
};
