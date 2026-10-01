export function fieldDescription(id: string, description?: string, error?: string): string | undefined {
  const parts = [description ? `${id}-description` : null, error ? `${id}-error` : null].filter(Boolean);
  return parts.length ? parts.join(" ") : undefined;
}
