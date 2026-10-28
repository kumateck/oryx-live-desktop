export const templatesPath = "/settings/templates";
export const createTemplatePath = (copyFrom: string | null = null) => copyFrom ? `${templatesPath}/create?copyFrom=${encodeURIComponent(copyFrom)}` : `${templatesPath}/create`;
export const editTemplatePath = (id: string) => `${templatesPath}/${id}/edit`;
export const templatesAudit = { module: "Settings", subModule: "Work Flow" } as const;
export const templatePermissions = { view: "CanViewTemplate", create: "CanCreateTemplate", edit: "CanEditTemplate", remove: "CanDeleteTemplate" } as const;
/** What a template is for. The numbers are the server's. */
export const templateTypes = [{ value: "0", label: "Analytical raw data" }, { value: "1", label: "Specification" }] as const;
export const templateTypeLabel = (type: number | null | undefined) => templateTypes.find((entry) => entry.value === String(type))?.label ?? "Unknown";
