import { tokenStore } from "@/shared/auth/token-store";
import { refreshTokens, sessionUserId } from "@/shared/auth/session-api";
import { readBounded } from "@/shared/attachments/read-file";
import { attachmentLimit } from "@/shared/attachments/file-type";
import { payrollPermissions as p } from "../schemas/contracts";
export async function readPayrollExport(id: string, kind: "advice" | "register", signal: AbortSignal, allowed: (permission: string) => boolean): Promise<Blob> {
  const permission = kind === "advice" ? p.advice : p.register;
  if (!allowed(permission)) throw new Error("You do not have permission to view this payroll export.");
  const path = `/api/v1/payroll/runs/${encodeURIComponent(id)}/${kind === "advice" ? "bank-advice" : "register"}?FileType=xlsx`;
  const owner = sessionUserId();
  if (!owner) throw new Error("Your signed-in user could not be verified.");
  const request = () =>
    fetch(path, {
      signal,
      credentials: "omit",
      cache: "no-store",
      redirect: "error",
      headers: { Authorization: `Bearer ${tokenStore.accessToken() ?? ""}`, Module: "HR Management", SubModule: "Payroll Exports" },
    });
  let response = await request();
  if (response.status === 401 && (await refreshTokens(signal))) response = await request();
  const bytes = await readBounded(response, attachmentLimit);
  if (!allowed(permission) || !tokenStore.accessToken() || sessionUserId() !== owner)
    throw new Error("Your session or access changed before this export could be opened.");
  const magic = new Uint8Array(bytes);
  if (magic[0] !== 0x50 || magic[1] !== 0x4b) throw new Error("The server did not return an Excel workbook.");
  return new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
