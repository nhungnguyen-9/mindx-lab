import { db } from '../_lib/db';
import { json, parseQuery } from '../_lib/http';
import { toProduct } from '../_lib/mappers';
import type { Category } from '../../shared/types';

const allowedCategories: Category[] = ['scratch', 'game', 'app-python', 'web', 'computer-science'];

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    const query = parseQuery(req);
    const categoryParam = query.get('category') || '';
    const search = (query.get('search') || '').trim();
    const sort = query.get('sort') === 'popular' ? 'popular' : 'newest';
    const page = Math.max(1, Number(query.get('page') || '1'));
    const limit = Math.min(12, Math.max(1, Number(query.get('limit') || '12')));
    const offset = (page - 1) * limit;

    if (categoryParam && !allowedCategories.includes(categoryParam as Category)) {
      return json(res, 400, { error: 'Category khong hop le' });
    }

    const sql = db();
    const searchLike = `%${search}%`;

    const totalResult = await sql`
      SELECT COUNT(*)::int AS total
      FROM products
      WHERE published = true
        AND (${categoryParam} = '' OR category = ${categoryParam})
        AND (
          ${search} = '' OR
          name ILIKE ${searchLike} OR
          student_name ILIKE ${searchLike}
        )
    `;
    const total = Number(totalResult[0]?.total ?? 0);

    const rows = await sql`
      SELECT *
      FROM products
      WHERE published = true
        AND (${categoryParam} = '' OR category = ${categoryParam})
        AND (
          ${search} = '' OR
          name ILIKE ${searchLike} OR
          student_name ILIKE ${searchLike}
        )
      ORDER BY
        CASE WHEN ${sort} = 'popular' THEN view_count ELSE 0 END DESC,
        created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const data = rows.map((row: any) => {
      const product = toProduct(row);
      const { published, ...publicProduct } = product;
      return publicProduct;
    });

    return json(res, 200, {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    });
  } catch {
    return json(res, 500, { error: 'Khong the tai danh sach san pham' });
  }
}
