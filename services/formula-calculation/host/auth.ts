import { timingSafeEqual } from "node:crypto";

const bearerToken = (authorization: string | undefined): string =>
  authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";

export const hasValidWorkloadToken = (
  authorization: string | undefined,
  expectedToken: string,
): boolean => {
  const supplied = Buffer.from(bearerToken(authorization), "utf8");
  const expected = Buffer.from(expectedToken, "utf8");
  return (
    supplied.length === expected.length && timingSafeEqual(supplied, expected)
  );
};
