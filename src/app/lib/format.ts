/** Capitalize first letter, lowercase rest, replace underscores with spaces */
export function capitalize(str: string): string {
  const lower = str.toLowerCase().replace(/_/g, " ");
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
