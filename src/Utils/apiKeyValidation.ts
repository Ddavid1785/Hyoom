export function isValidApiKey(key: string | undefined | null): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  return trimmed.length >= 20;
}