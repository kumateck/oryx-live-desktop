import { z } from "zod";

const attachment = z.object({ id: z.string().nullish(), name: z.string().nullish(), link: z.string().nullish(), reference: z.string().nullish() });
/** Keep saved file metadata alongside an answer; it cannot be restored into a browser file input. */
export const storedAnswerRowSchema = z.object({
  responseId: z.string().nullish(), value: z.string().nullish(), createdAt: z.string().nullish(),
  formField: z.object({ id: z.string().nullish() }).nullish(), attachments: z.array(attachment).nullish(),
}).transform(row => ({
  formFieldId: row.formField?.id ?? null, responseId: row.responseId ?? null, createdAt: row.createdAt ?? null,
  value: row.value?.trim() ? row.value : row.attachments?.length ? "form response attachment." : null,
  attachments: (row.attachments ?? []).map((file, index) => ({
    id: `${file.id ?? "attachment"}:${file.reference ?? file.link ?? index}`,
    name: file.name?.trim() || `Attachment ${index + 1}`, ...(file.link ? { url: file.link } : {}),
  })),
}));
export const storedAnswerRowsSchema = z.array(storedAnswerRowSchema);
