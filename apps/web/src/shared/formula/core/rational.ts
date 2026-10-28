const DECIMAL_INPUT = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;
const ZERO = BigInt(0);
const ONE = BigInt(1);
const TWO = BigInt(2);
const TEN = BigInt(10);
const NEGATIVE_ONE = BigInt(-1);

export interface Rational {
  numerator: bigint;
  denominator: bigint;
}

const absolute = (value: bigint): bigint => (value < ZERO ? -value : value);

const greatestCommonDivisor = (left: bigint, right: bigint): bigint => {
  let a = absolute(left);
  let b = absolute(right);
  while (b !== ZERO) [a, b] = [b, a % b];
  return a || ONE;
};

const normalized = (numerator: bigint, denominator: bigint): Rational => {
  if (denominator === ZERO)
    throw new Error("Rational denominator cannot be zero.");
  const sign = denominator < ZERO ? NEGATIVE_ONE : ONE;
  const divisor = greatestCommonDivisor(numerator, denominator);
  const reducedNumerator = (numerator * sign) / divisor;
  return {
    numerator: reducedNumerator === ZERO ? ZERO : reducedNumerator,
    denominator: absolute(denominator) / divisor,
  };
};

export const parseRationalDecimal = (
  source: string,
  maxDigits: number,
): Rational | null => {
  if (!DECIMAL_INPUT.test(source)) return null;
  const digits = source.replaceAll(/[-.]/g, "");
  if (digits.length > maxDigits) return null;
  const negative = source.startsWith("-");
  const unsigned = negative ? source.slice(1) : source;
  const [integer, fraction = ""] = unsigned.split(".");
  const denominator = TEN ** BigInt(fraction.length);
  const numerator =
    BigInt(`${integer}${fraction}`) * (negative ? NEGATIVE_ONE : ONE);
  return normalized(numerator, denominator);
};

export const addRational = (left: Rational, right: Rational): Rational =>
  normalized(
    left.numerator * right.denominator + right.numerator * left.denominator,
    left.denominator * right.denominator,
  );

export const subtractRational = (left: Rational, right: Rational): Rational =>
  normalized(
    left.numerator * right.denominator - right.numerator * left.denominator,
    left.denominator * right.denominator,
  );

export const multiplyRational = (left: Rational, right: Rational): Rational =>
  normalized(
    left.numerator * right.numerator,
    left.denominator * right.denominator,
  );

export const divideRational = (left: Rational, right: Rational): Rational => {
  if (right.numerator === ZERO) throw new Error("DIVIDE_BY_ZERO");
  return normalized(
    left.numerator * right.denominator,
    left.denominator * right.numerator,
  );
};

export const negateRational = (value: Rational): Rational => ({
  numerator: -value.numerator,
  denominator: value.denominator,
});

export const compareRational = (left: Rational, right: Rational): number => {
  const difference =
    left.numerator * right.denominator - right.numerator * left.denominator;
  return difference < ZERO ? -1 : difference > ZERO ? 1 : 0;
};

export const rationalEvidence = (value: Rational): string =>
  value.denominator === ONE
    ? value.numerator.toString()
    : `${value.numerator}/${value.denominator}`;

export const roundRationalHalfUp = (
  value: Rational,
  decimalPlaces: number,
): string => {
  if (!Number.isSafeInteger(decimalPlaces) || decimalPlaces < 0) {
    throw new Error("Invalid decimal-place count.");
  }
  const scale = TEN ** BigInt(decimalPlaces);
  const magnitude = absolute(value.numerator) * scale;
  let quotient = magnitude / value.denominator;
  const remainder = magnitude % value.denominator;
  if (remainder * TWO >= value.denominator) quotient += ONE;
  const sign = value.numerator < ZERO && quotient !== ZERO ? "-" : "";
  const digits = quotient.toString().padStart(decimalPlaces + 1, "0");
  if (decimalPlaces === 0) return `${sign}${digits}`;
  const split = digits.length - decimalPlaces;
  return `${sign}${digits.slice(0, split)}.${digits.slice(split)}`;
};
