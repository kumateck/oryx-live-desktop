import { sha256Hex } from "./sha256";

type CanonicalJsonValue =
  | null
  | boolean
  | number
  | string
  | CanonicalJsonValue[]
  | { [key: string]: CanonicalJsonValue };

const serialize = (value: unknown, path: string): string => {
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "string"
  ) {
    return JSON.stringify(value);
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      throw new TypeError(
        `Only finite integer metadata is allowed at ${path}.`,
      );
    }
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item, index) => serialize(item, `${path}[${index}]`)).join(",")}]`;
  }

  if (typeof value === "object") {
    const object = value as Record<string, unknown>;
    const entries = Object.keys(object)
      .sort()
      .map((key) => {
        const item = object[key];
        if (item === undefined) {
          throw new TypeError(
            `Undefined is not canonical JSON at ${path}.${key}.`,
          );
        }
        return `${JSON.stringify(key)}:${serialize(item, `${path}.${key}`)}`;
      });
    return `{${entries.join(",")}}`;
  }

  throw new TypeError(`Unsupported canonical JSON value at ${path}.`);
};

export const canonicalJson = (value: CanonicalJsonValue | unknown): string =>
  serialize(value, "$");

const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

export const sha256CanonicalJson = async (
  domain: string,
  value: CanonicalJsonValue | unknown,
): Promise<string> => {
  const canonicalValue = `${domain}\0${canonicalJson(value)}`;
  const subtle = globalThis.crypto?.subtle;
  if (typeof subtle?.digest === "function") {
    const input = new TextEncoder().encode(canonicalValue);
    const digest = await subtle.digest("SHA-256", input);
    return bytesToHex(new Uint8Array(digest));
  }

  return sha256Hex(canonicalValue);
};
