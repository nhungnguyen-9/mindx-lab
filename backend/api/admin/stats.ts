import { db } from '../_lib/db';
import { json } from '../_lib/http';
import { requireRole } from '../_lib/auth';
import type { Category } from '../../shared/types';

const categories: Category[] = ['scratch', 'game', 'app-python', 'web', 'computer-science'];

export default async function handler(req: any, res: any) {
  const auth = requireRole(['admin'])(req, res);
  if (!auth) {
    return;
  }

  if (req.method !== 'GET') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    const sql = db();

    const totals = await sql`
      SELECT
        COUNT(*)::int AS total_products,
        COUNT(*) FILTER (WHERE published = true)::int AS published_products,
        COUNT(*) FILTER (WHERE published = false)::int AS unpublished_products,
        COALESCE(SUM(view_count), 0)::int AS total_views
      FROM products
    `;

    const byCategoryRows = await sql`
      SELECT category, COUNT(*)::int AS count
      FROM products
      GROUP BY category
    `;

    const byCategory = categories.reduce((acc, category) => {
      acc[category] = 0;
      return acc;
    }, {} as Record<Category, number>);

    for (const row of byCategoryRows) {
      const category = row.category as Category;
      if (category in byCategory) {
        byCategory[category] = Number(row.count ?? 0);
      }
    }

    const row = totals[0] ?? {};
    return json(res, 200, {
      totalProducts: Number(row.total_products ?? 0),
      publishedProducts: Number(row.published_products ?? 0),
      unpublishedProducts: Number(row.unpublished_products ?? 0),
      totalViews: Number(row.total_views ?? 0),
      byCategory
    });
  } catch {
    return json(res, 500, { error: 'Khong the tai thong ke' });
  }
}
