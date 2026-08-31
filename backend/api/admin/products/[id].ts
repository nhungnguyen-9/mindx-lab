import { db } from '../../_lib/db';
import { json, readBody } from '../../_lib/http';
import { toProduct } from '../../_lib/mappers';
import { requireRole } from '../../_lib/auth';
import { deleteBundle } from '../../_lib/blob-cleanup';
import type { Category, EmbedType } from '../../../shared/types';
import { EMBED_TYPES } from '../../../shared/types';

const allowedCategories: Category[] = ['scratch', 'game', 'app-python', 'web', 'computer-science'];

export default async function handler(req: any, res: any) {
  const id = req.query?.id;
  if (typeof id !== 'string') {
    return json(res, 400, { error: 'Invalid product id' });
  }

  if (req.method === 'GET') {
    const auth = requireRole(['teacher', 'admin'])(req, res);
    if (!auth) {
      return;
    }
    try {
      const sql = db();
      const rows = await sql`SELECT * FROM products WHERE id = ${id} LIMIT 1`;
      if (!rows[0]) {
        return json(res, 404, { error: 'Product not found' });
      }
      return json(res, 200, toProduct(rows[0]));
    } catch {
      return json(res, 500, { error: 'Khong the tai san pham' });
    }
  }

  if (req.method === 'PUT') {
    const auth = requireRole(['teacher', 'admin'])(req, res);
    if (!auth) {
      return;
    }
    try {
      const body = await readBody<Record<string, string>>(req);
      if (body.category && !allowedCategories.includes(body.category as Category)) {
        return json(res, 400, { error: 'Category khong hop le' });
      }
      if (body.embedType && !EMBED_TYPES.includes(body.embedType as EmbedType)) {
        return json(res, 400, { error: 'Embed type khong hop le' });
      }

      const sql = db();

      // Capture the previous bundle URL so we can clean it up if it is replaced.
      const previous = await sql`SELECT embed_url FROM products WHERE id = ${id} LIMIT 1`;
      const previousEmbedUrl: string | null = previous[0]?.embed_url ?? null;

      const rows = await sql`
        UPDATE products
        SET
          name = COALESCE(${body.name ?? null}, name),
          student_name = COALESCE(${body.studentName ?? null}, student_name),
          class_name = COALESCE(${body.className ?? null}, class_name),
          category = COALESCE(${(body.category as Category | undefined) ?? null}, category),
          embed_type = COALESCE(${(body.embedType as EmbedType | undefined) ?? null}, embed_type),
          thumbnail_url = COALESCE(${body.thumbnailUrl ?? null}, thumbnail_url),
          embed_url = COALESCE(${body.embedUrl ?? null}, embed_url),
          source_code = COALESCE(${body.sourceCode ?? null}, source_code),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;

      if (!rows[0]) {
        return json(res, 404, { error: 'Product not found' });
      }

      const updated = toProduct(rows[0]);

      // If the bundle URL changed, remove the old bundle's files from Blob.
      if (previousEmbedUrl && previousEmbedUrl !== updated.embedUrl) {
        await deleteBundle(previousEmbedUrl);
      }

      return json(res, 200, updated);
    } catch {
      return json(res, 500, { error: 'Khong the cap nhat san pham' });
    }
  }

  if (req.method === 'DELETE') {
    const auth = requireRole(['admin'])(req, res);
    if (!auth) {
      return;
    }
    try {
      const sql = db();
      const rows = await sql`DELETE FROM products WHERE id = ${id} RETURNING embed_url`;
      if (!rows[0]) {
        return json(res, 404, { error: 'Product not found' });
      }
      await deleteBundle(rows[0].embed_url ?? null);
    } catch {
      return json(res, 500, { error: 'Khong the xoa san pham' });
    }

    return json(res, 204, null);
  }

  return json(res, 405, { error: 'Method not allowed' });
}
