import { del, list } from '@vercel/blob';

const BLOB_HOST_SUFFIX = 'blob.vercel-storage.com';

/**
 * Derives the bundle prefix (e.g. "projects/<bundleId>/") from a stored Blob URL,
 * or null if the URL is not a Vercel Blob bundle URL (e.g. an external `link`).
 */
export function bundlePrefixFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith(BLOB_HOST_SUFFIX)) return null;
    const path = parsed.pathname.replace(/^\/+/, '');
    const parts = path.split('/');
    if (parts[0] !== 'projects' || parts.length < 2 || !parts[1]) return null;
    return `${parts[0]}/${parts[1]}/`;
  } catch {
    return null;
  }
}

/**
 * Best-effort deletion of every file under a bundle's prefix on Vercel Blob.
 * Safe to call with any URL: no-ops for non-bundle URLs or when Blob is not
 * configured. Never throws — bundle cleanup must not block product mutations.
 */
export async function deleteBundle(url: string | null | undefined): Promise<void> {
  if (!url || !process.env.BLOB_READ_WRITE_TOKEN) return;
  const prefix = bundlePrefixFromUrl(url);
  if (!prefix) return;

  try {
    const { blobs } = await list({ prefix });
    if (blobs.length === 0) return;
    await del(blobs.map((blob) => blob.url));
  } catch (err) {
    console.error('Blob cleanup failed for', prefix, err);
  }
}
