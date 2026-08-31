import { db } from '../../_lib/db';
import { json, parseQuery, readBody } from '../../_lib/http';
import type { Category, EmbedType } from '../../../shared/types';
import { EMBED_TYPES } from '../../../shared/types';
import { toProduct } from '../../_lib/mappers';
import { requireRole } from '../../_lib/auth';

interface CreateBody {
  name?: string;
  studentName?: string;
  className?: string;
  category?: Category;
  embedType?: EmbedType;
  thumbnailUrl?: string;
  embedUrl?: string;
  sourceCode?: string;
}

const allowedCategories: Category[] = ['scratch', 'game', 'app-python', 'web', 'computer-science'];

export default async function handler(req: any, res: any) {
  const auth = requireRole(['teacher', 'admin'])(req, res);
  if (!auth) {
    return;
  }

  if (req.method === 'GET') {
    try {
      const query = parseQuery(req);
      const page = Math.max(1, Number(query.get('page') || '1'));
      const limit = Math.max(1, Number(query.get('limit') || '20'));
      const search = (query.get('search') || '').trim();
      const category = query.get('category') || '';
      const offset = (page - 1) * limit;

      if (category && !allowedCategories.includes(category as Category)) {
        return json(res, 400, { error: 'Category khong hop le' });
      }

      const sql = db();
      const searchLike = `%${search}%`;

      let total = 0;
      let rows: any[] = [];

      if (category) {
        const totalRows = await sql`
          SELECT COUNT(*)::int AS total
          FROM products
          WHERE category = ${category}
            AND (
              ${search} = '' OR
              name ILIKE ${searchLike} OR
              student_name ILIKE ${searchLike}
            )
        `;
        total = Number(totalRows[0]?.total ?? 0);

        rows = await sql`
          SELECT *
          FROM products
          WHERE category = ${category}
            AND (
              ${search} = '' OR
              name ILIKE ${searchLike} OR
              student_name ILIKE ${searchLike}
            )
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      } else {
        const totalRows = await sql`
          SELECT COUNT(*)::int AS total
          FROM products
          WHERE (
            ${search} = '' OR
            name ILIKE ${searchLike} OR
            student_name ILIKE ${searchLike}
          )
        `;
        total = Number(totalRows[0]?.total ?? 0);

        rows = await sql`
          SELECT *
          FROM products
          WHERE (
            ${search} = '' OR
            name ILIKE ${searchLike} OR
            student_name ILIKE ${searchLike}
          )
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      }

      return json(res, 200, {
        data: rows.map(toProduct),
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

  if (req.method === 'POST') {
    try {
      const body = await readBody<CreateBody>(req);
      const required = ['name', 'studentName', 'className', 'category', 'thumbnailUrl', 'embedUrl'] as const;
      const missing = required.filter((key) => !body[key]);

      if (missing.length > 0) {
        return json(res, 400, {
          error: 'Thieu truong bat buoc',
          details: Object.fromEntries(missing.map((k) => [k, 'Required']))
        });
      }

      if (!allowedCategories.includes(body.category as Category)) {
        return json(res, 400, { error: 'Category khong hop le' });
      }

      const embedType: EmbedType = EMBED_TYPES.includes(body.embedType as EmbedType)
        ? (body.embedType as EmbedType)
        : 'link';

      const sql = db();
      const rows = await sql`
        INSERT INTO products (
          name,
          student_name,
          class_name,
          category,
          embed_type,
          thumbnail_url,
          embed_url,
          source_code,
          published,
          view_count
        )
        VALUES (
          ${body.name!},
          ${body.studentName!},
          ${body.className!},
          ${body.category!},
          ${embedType},
          ${body.thumbnailUrl!},
          ${body.embedUrl!},
          ${body.sourceCode ?? null},
          false,
          0
        )
        RETURNING *
      `;

      const created = toProduct(rows[0]);

      return json(res, 201, created);
    } catch {
      return json(res, 500, { error: 'Khong the tao san pham' });
    }
  }

  return json(res, 405, { error: 'Method not allowed' });
}
