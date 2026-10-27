import { object, string, type Json } from "../customer-server/data.ts";
import { version } from "../customer-server/config.ts";

/** Hosted frontend requirements are independent of the legacy host-Nginx fingerprint policy. */
export function requirements(value: Json): { deploymentProtocol: number; minimumShellVersion: string } {
  const source = object(value);
  if (source.deploymentProtocol !== 1) throw new Error("This release requires a different Docker deployment protocol");
  const minimumShellVersion = string(source.minimumShellVersion);
  version(minimumShellVersion);
  return { deploymentProtocol: 1, minimumShellVersion };
}
