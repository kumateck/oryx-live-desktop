import { expect, it } from "vitest";
import { packingOrderFormSchema, packingOrderSourceSchema, richTextEmpty } from "./packing-order-schema";

it("treats rich text with nothing to read as empty", () => {
  expect(["", null, "<p></p>", "<p>  </p>", "<p><br></p>", "<p>&nbsp;</p><ul><li></li></ul>"].map(richTextEmpty)).toEqual([true, true, true, true, true, true]);
  expect(["<p>Fill 100 ml</p>", "<p><img src=\"a.png\"></p>", "plain"].map(richTextEmpty)).toEqual([false, false, false]);
});

it("needs all three packs described, each named in its message", () => {
  const result = packingOrderFormSchema.safeParse({ primaryPackDescription: "<p>Bottle</p>", secondaryPackDescription: "<p></p>", tertiaryPackDescription: "" });
  expect(result.success ? [] : result.error.issues.map((issue) => issue.message)).toEqual(["Describe the secondary pack", "Describe the tertiary pack"]);
});

it("reads a product that has no packing order yet as three empty descriptions", () => {
  expect(packingOrderSourceSchema.parse({ primaryPackDescription: null })).toEqual({ primaryPackDescription: "", secondaryPackDescription: "", tertiaryPackDescription: "" });
});
