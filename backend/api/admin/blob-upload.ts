import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { json, readBody } from '../_lib/http';
import { verifyToken } from '../_lib/jwt';
import { MAX_FILE_BYTES } from '../../shared/bundle';

/**
 * POST /api/admin/blob-upload
 *
 * Token endpoint for client-side direct uploads to Vercel Blob. The browser
 * (see frontend/src/lib/bundle-upload.ts) extracts a project bundle and uploads
 * each file straight to Blob, which avoids the ~4.5MB serverless request body
 * limit — important for GameMaker HTML5 / pygbag builds.
 *
 * The @vercel/blob client cannot forward our Authorization header, so the caller
 * passes its JWT via `clientPayload`, which we verify here before issuing a token.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return json(res, 500, { error: 'Chua cau hinh luu tru. Thieu BLOB_READ_WRITE_TOKEN' });
  }

  let body: HandleUploadBody;
  try {
    body = await readBody<HandleUploadBody>(req);
  } catch {
    return json(res, 400, { error: 'Body khong hop le' });
  }

  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const auth = clientPayload ? verifyToken(clientPayload) : null;
        if (!auth || (auth.role !== 'teacher' && auth.role !== 'admin')) {
          throw new Error('Unauthorized');
        }
        if (!pathname.startsWith('projects/') || pathname.includes('..')) {
          throw new Error('Duong dan khong hop le');
        }
        return {
          addRandomSuffix: false,
          maximumSizeInBytes: MAX_FILE_BYTES
        };
      },
      // Server-to-server notification; not required for the client to succeed.
      onUploadCompleted: async () => {
        /* no-op */
      }
    });

    return json(res, 200, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Khong the cap token upload';
    const status = message === 'Unauthorized' ? 401 : 400;
    return json(res, status, { error: message });
  }
}
