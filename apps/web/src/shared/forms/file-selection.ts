export function acceptsFile(file: File, accept?: string, maxSizeBytes?: number): boolean {
  if (maxSizeBytes !== undefined && file.size > maxSizeBytes) return false;
  if (!accept?.trim()) return true;
  return accept.split(",").some((entry) => {
    const token = entry.trim().toLowerCase();
    const mime = file.type.toLowerCase();
    if (!token) return false;
    if (token.startsWith(".")) return file.name.toLowerCase().endsWith(token);
    if (token.endsWith("/*")) return mime.startsWith(token.slice(0, -1));
    return mime === token;
  });
}

export function mergeFiles(current: readonly File[], incoming: readonly File[]): File[] {
  const result = [...current];
  const keys = new Set(current.map((file) => `${file.name}:${file.size}:${file.lastModified}`));
  for (const file of incoming) {
    const key = `${file.name}:${file.size}:${file.lastModified}`;
    if (!keys.has(key)) {
      result.push(file);
      keys.add(key);
    }
  }
  return result;
}
