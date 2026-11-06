import type { FormulaHostAuditEvent } from "./contracts";

export const writeFormulaHostAuditEvent = (
  event: FormulaHostAuditEvent,
): void => {
  process.stdout.write(
    `${JSON.stringify({
      eventType: "FORMULA_SERVICE_REQUEST",
      occurredAtUtc: new Date().toISOString(),
      ...event,
    })}\n`,
  );
};
