import { expect, it } from "vitest";
import { attachmentFromLink, documentFormat } from "./file-type";

it("recognizes rich-text file links without treating ordinary navigation as an attachment", () => {
  const base = "https://oryx.example";
  const file = attachmentFromLink("/api/v1/file/orders/id/reference", "Evidence", base);
  expect(file?.link).toBe(`${base}/api/v1/file/orders/id/reference`);
  const document = attachmentFromLink("https://minio.example/results.xlsx?X-Amz-Signature=preserved", "Results", base);
  expect(document?.name).toBe("results.xlsx");
  expect(document ? documentFormat(document) : null).toBe("xlsx");
  expect(document?.link).toContain("X-Amz-Signature=preserved");
  for (const href of ["#section", "/settings/suppliers/id", "https://example.com/help", "mailto:ada@example.com", "javascript:alert(1)", "https://user:password@example.com/file.pdf", "//untrusted/file.pdf"]) {
    expect(attachmentFromLink(href, "Open", base)).toBeNull();
  }
});
