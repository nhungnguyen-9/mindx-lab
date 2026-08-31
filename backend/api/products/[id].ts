import { db } from '../_lib/db';
import { json } from '../_lib/http';
import { toProduct } from '../_lib/mappers';
import { optionalAuth } from '../_lib/auth';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const id = req.query?.id;
  if (typeof id !== 'string') {
    return json(res, 400, { error: 'Invalid product id' });
  }

  try {
    const auth = optionalAuth(req, res);

    const sql = db();

    // Only count views from anonymous visitors; authenticated staff previewing
    // a product (sale/teacher/admin) must not inflate the counter.
    const rows = auth
      ? await sql`
          SELECT * FROM products
          WHERE id = ${id} AND published = true
          LIMIT 1
        `
      : await sql`
          UPDATE products
          SET view_count = view_count + 1
          WHERE id = ${id} AND published = true
          RETURNING *
        `;

    const row = rows[0];
    if (!row) {
      return json(res, 404, { error: 'Product not found' });
    }

    const product = toProduct(row);
    const { published, ...publicProduct } = product;

    // If guest (no auth), hide source code
    if (!auth) {
      return json(res, 200, { ...publicProduct, sourceCode: null });
    }

    // Authenticated user (sale, teacher, admin) — include source code
    return json(res, 200, publicProduct);
  } catch {
    return json(res, 500, { error: 'Khong the tai chi tiet san pham' });
  }
}
