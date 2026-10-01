import { expect, it } from "vitest";
import { apiErrorMessage } from "./api-error-message";

it("shows the backend's explanation for a refused change", () => {
  expect(apiErrorMessage({ status: 409, data: { title: "Conflict", errors: [
    { code: "Permission.Pending", description: "A permission update is already pending for this role." },
  ] } })).toBe("A permission update is already pending for this role.");
});

it("keeps generic wording when the server gives no usable explanation", () => {
  expect(apiErrorMessage({ status: 403, data: { errors: [{ description: "internal" }] } }))
    .toBe("You do not have permission for this action.");
  expect(apiErrorMessage({ status: 404, data: "Role missing" })).toBe("This record could not be found.");
  expect(apiErrorMessage({ status: 500, data: { errors: [{ description: "stack" }] } }))
    .toBe("The server could not complete the request (500).");
  expect(apiErrorMessage({ status: "FETCH_ERROR", error: "offline" }))
    .toBe("Cannot reach the customer server. Check the connection and retry.");
});
