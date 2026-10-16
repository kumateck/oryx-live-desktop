import { z } from "zod";
import { qcApi } from "@/shared/api/generated/qc";

export const aiExtractionPermission = "CanManageAiWorksheetExtractionSettings";
export const aiExtractionAudit = { module: "Quality Control", subModule: "QC AI Extraction Settings" } as const;
export const providerLabels: Record<Provider, string> = { 0: "Anthropic", 1: "OpenAI" };
export type Provider = 0 | 1;

const settingsTag = { type: "QcAiExtractionSettings" as const, id: "all" };
export const aiExtractionApi = qcApi.enhanceEndpoints({ addTagTypes: ["QcAiExtractionSettings"],
  endpoints: {
    getApiV1QcAiExtractionSettings: { providesTags: [settingsTag] },
    putApiV1QcAiExtractionSettingsByProviderKey: { invalidatesTags: (_result, error) => error ? [] : [settingsTag] },
    putApiV1QcAiExtractionSettingsActive: { invalidatesTags: (_result, error) => error ? [] : [settingsTag] },
  },
});

const providerSchema = z.union([z.literal(0), z.literal(1)]);
const statusSchema = z.object({
  provider: providerSchema, model: z.string().nullish().transform((value) => value ?? ""), hasKey: z.boolean().default(false),
  keyPreview: z.string().nullish().transform((value) => value ?? null), updatedByName: z.string().nullish().transform((value) => value ?? null),
  updatedAt: z.string().nullish().transform((value) => value ?? null),
});
export const settingsSchema = z.object({ activeProvider: providerSchema.default(0), providers: z.array(statusSchema).default([]) });
export type ProviderStatus = z.infer<typeof statusSchema>;
export type AiExtractionSettings = z.infer<typeof settingsSchema>;

/** Before any provider is activated the server reports the enum default, so a provider only counts as active once it has a key. */
export const isActiveProvider = (settings: AiExtractionSettings, status: ProviderStatus) => status.provider === settings.activeProvider && status.hasKey;

export const keyFormSchema = z.object({ model: z.string().trim().min(1, "Enter the model."), apiKey: z.string() });
export type KeyFormValues = z.infer<typeof keyFormSchema>;
/** A blank key keeps the stored one: keys are write-only once saved. */
export const keyRequest = (values: KeyFormValues) => ({ model: values.model.trim(), apiKey: values.apiKey.trim() ? values.apiKey.trim() : null });
