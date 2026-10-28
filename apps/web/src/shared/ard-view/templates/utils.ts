// A helper to format date strings to match the image's format (MM/YYYY or DD/MM/YYYY)
export const formatDate = (
  dateString: string | undefined | null,
  format: "month-year" | "full" = "full",
) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (format === "month-year") {
    // Format to MM/YYYY
    return `${String(date.getUTCMonth() + 1).padStart(2, "0")}/${date.getUTCFullYear()}`;
  }
  // Format to DD/MM/YYYY
  return `${String(date.getUTCDate()).padStart(2, "0")}/${String(
    date.getUTCMonth() + 1,
  ).padStart(2, "0")}/${date.getUTCFullYear()}`;
};
