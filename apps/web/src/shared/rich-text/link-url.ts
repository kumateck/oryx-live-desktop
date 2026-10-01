export function isSafeEditorLink(input: string): boolean {
  const value = input.trim();
  if (!value || value.startsWith("//")) return false;
  if (value.startsWith("/") || value.startsWith("#")) return true;
  if (value.startsWith("mailto:")) return /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(value);
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
