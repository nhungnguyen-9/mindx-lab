import { json, readBody } from '../_lib/http';
import { requireRole } from '../_lib/auth';

interface UploadBody {
  fileName?: string;
  mimeType?: string;
  size?: number;
}

const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'mindx-lab';

  if (!cloudName || !uploadPreset) {
    return null;
  }

  return {
    cloudName,
    uploadPreset,
    folder
  };
}

export default async function handler(req: any, res: any) {
  const auth = requireRole(['teacher', 'admin'])(req, res);
  if (!auth) {
    return;
  }

  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    const body = await readBody<UploadBody>(req);
    const cloudinary = getCloudinaryConfig();

    if (!cloudinary) {
      return json(res, 500, {
        error: 'Cloudinary chua duoc cau hinh. Thieu CLOUDINARY_CLOUD_NAME hoac CLOUDINARY_UPLOAD_PRESET'
      });
    }

    if (!body.fileName || !body.mimeType || typeof body.size !== 'number') {
      return json(res, 400, { error: 'Thieu thong tin file upload' });
    }

    if (!allowedMime.includes(body.mimeType)) {
      return json(res, 400, { error: 'File khong dung dinh dang JPG/PNG/WebP' });
    }

    if (body.size > 5 * 1024 * 1024) {
      return json(res, 400, { error: 'File vuot qua 5MB' });
    }

    return json(res, 200, {
      provider: 'cloudinary',
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudinary.cloudName}/image/upload`,
      fields: {
        upload_preset: cloudinary.uploadPreset,
        folder: cloudinary.folder
      }
    });
  } catch {
    return json(res, 400, { error: 'Du lieu upload khong hop le' });
  }
}
