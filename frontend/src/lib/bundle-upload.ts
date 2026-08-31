import { upload } from '@vercel/blob/client';
import {
  makeBundleId,
  prepareWebBundle,
  SCRATCH_CONTENT_TYPE
} from '@shared/bundle';
import type { BundleUploadResult, EmbedType } from '@shared/types';

const TOKEN_KEY = 'mindx_admin_token';
const HANDLE_UPLOAD_URL = '/api/admin/blob-upload';
const MULTIPART_THRESHOLD = 8 * 1024 * 1024; // use multipart for files > 8MB

export type BundleUploadType = 'web' | 'gamemaker' | 'scratch';

/**
 * Uploads a project bundle straight from the browser to Vercel Blob.
 *
 * For `web` / `gamemaker` the .zip is extracted client-side and every file is
 * uploaded individually (preserving relative paths) so the hosted site's
 * relative references resolve. For `scratch` the raw .sb3 is uploaded as-is.
 *
 * Uploading directly to Blob bypasses the serverless request body limit, so
 * large GameMaker HTML5 builds work. Each upload authorizes against
 * `/api/admin/blob-upload`, passing the JWT via `clientPayload`.
 */
export async function uploadProjectBundle(
  type: BundleUploadType,
  file: File
): Promise<BundleUploadResult> {
  const token = localStorage.getItem(TOKEN_KEY) ?? '';
  const bundleId = makeBundleId();

  if (type === 'scratch') {
    const res = await upload(`projects/${bundleId}/project.sb3`, file, {
      access: 'public',
      contentType: SCRATCH_CONTENT_TYPE,
      handleUploadUrl: HANDLE_UPLOAD_URL,
      clientPayload: token
    });
    return { embedType: 'scratch', entryUrl: res.url };
  }

  const buffer = new Uint8Array(await file.arrayBuffer());
  const bundle = prepareWebBundle(buffer);

  let entryUrl = '';
  for (const f of bundle.files) {
    // Copy into a fresh ArrayBuffer-backed array so it is a valid BlobPart.
    const bytes = new Uint8Array(f.data.length);
    bytes.set(f.data);
    const res = await upload(`projects/${bundleId}/${f.path}`, new Blob([bytes], { type: f.contentType }), {
      access: 'public',
      contentType: f.contentType,
      handleUploadUrl: HANDLE_UPLOAD_URL,
      clientPayload: token,
      multipart: f.data.length > MULTIPART_THRESHOLD
    });
    if (f.path === bundle.entryPath) {
      entryUrl = res.url;
    }
  }

  if (!entryUrl) {
    throw new Error('Không xác định được file index.html sau khi upload');
  }

  const embedType: EmbedType = type === 'gamemaker' ? 'gamemaker' : 'web';
  return { embedType, entryUrl };
}
