export function resolveAssetUrl(assetPath: string): string {
  if (!assetPath) return assetPath;
  if (/^(https?:|data:|blob:)/.test(assetPath)) {
    return assetPath;
  }

  const normalizedPath = assetPath.replace(/^\/+/, '');
  const rawBase =
    typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL
      ? (import.meta as unknown as { env: { BASE_URL: string } }).env.BASE_URL
      : './';

  const normalizedBase = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
  return `${normalizedBase}${normalizedPath}`;
}
