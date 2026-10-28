import { expect, it } from "vitest";
import { ardAnswersSchema } from "../schemas/ard-result-schema";
import { ardSignatories } from "./ard-signatories";

it("includes every recorded analyst once, scoped to the current response", () => {
  const first = { id: "a", firstName: "Ama", lastName: "Analyst" };
  const batch = ardAnswersSchema.parse([
    { responseId: "response", value: "Complies", createdBy: first },
    { responseId: "response", value: "1.25", createdBy: first },
    { responseId: "response", value: "", attachments: [{ name: "Reading", link: "/reading" }], createdBy: { id: "b", firstName: "Kojo", lastName: "Analyst" } },
    { responseId: "other", value: "Complies", createdBy: { firstName: "Other" } },
    { value: "Complies", createdBy: { firstName: "Unattributed response" } },
    { responseId: "response", createdBy: { firstName: "No result" } },
  ]);
  const embedded = ardAnswersSchema.parse([{ value: "Complies", createdBy: first }]);
  expect(ardSignatories("response", embedded, batch, { firstName: "  Esi ", lastName: "Checker" })).toEqual({
    analysts: ["Ama Analyst", "Kojo Analyst"], checker: "Esi Checker",
  });
});

it("leaves missing names unresolved rather than using the response creator or print operator", () => {
  expect(ardSignatories("response", ardAnswersSchema.parse([{ value: "Complies" }]), [], null)).toEqual({ analysts: [], checker: null });
});
