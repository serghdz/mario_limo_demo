/** Shared asset paths for the root preview and repository-scoped Pages demo. */
export function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}
