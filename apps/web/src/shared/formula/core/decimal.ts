const DECIMAL_PATTERN = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;
const LITERAL_PATTERN = /^(?:\d+(?:\.\d*)?|\.\d+)$/;

export const isCanonicalDecimal = (value: string): boolean =>
  DECIMAL_PATTERN.test(value) && !/^-0(?:\.0+)?$/.test(value);

export const normalizeDecimalLiteral = (value: string): string | null => {
  if (!LITERAL_PATTERN.test(value)) return null;

  const [rawInteger = "0", rawFraction = ""] = value.split(".");
  const integer = (rawInteger || "0").replace(/^0+(?=\d)/, "");
  const fraction = rawFraction.replace(/0+$/, "");
  return fraction ? `${integer}.${fraction}` : integer;
};

export const normalizeCanonicalDecimal = (value: string): string | null => {
  if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)) return null;
  const negative = value.startsWith("-");
  const literal = normalizeDecimalLiteral(negative ? value.slice(1) : value);
  if (literal === null) return null;
  if (literal === "0") return "0";
  return negative ? `-${literal}` : literal;
};
