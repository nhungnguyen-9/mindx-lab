import { db } from '../../../_lib/db';
import { json, readBody } from '../../../_lib/http';
import { toProduct } from '../../../_lib/mappers';
import { requireRole } from '../../../_lib/auth';

interface PublishBody {
  published?: boolean;
}

export default async function handler(req: any, res: any) {
  const auth = requireRole(['teacher', 'admin'])(req, res);
  if (!auth) {
    return;
  }

  if (req.method !== 'PATCH') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const id = req.query?.id;
  if (typeof id !== 'string') {
    return json(res, 400, { error: 'Invalid product id' });
  }

  try {
    const body = await readBody<PublishBody>(req).catch(() => ({} as PublishBody));
    const sql = db();
    const publishedValue = body.published ?? null;
    const rows = await sql`
      UPDATE products
      SET
        published = COALESCE(${publishedValue}, NOT published),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!rows[0]) {
      return json(res, 404, { error: 'Product not found' });
    }

    return json(res, 200, toProduct(rows[0]));
  } catch {
    return json(res, 500, { error: 'Khong the doi trang thai san pham' });
  }
}
