import { db } from '../../_lib/db';
import { json, readBody } from '../../_lib/http';
import { requireRole } from '../../_lib/auth';
import bcrypt from 'bcryptjs';
import type { UserRole } from '../../../shared/types';

const VALID_ROLES: UserRole[] = ['admin', 'teacher', 'sale'];

export default async function handler(req: any, res: any) {
    const auth = requireRole(['admin'])(req, res);
    if (!auth) {
        return;
    }

    if (req.method === 'GET') {
        try {
            const sql = db();
            const rows = await sql`
        SELECT id, username, role, created_at
        FROM users
        ORDER BY created_at DESC
      `;

            const users = rows.map((row: any) => ({
                id: row.id,
                username: row.username,
                role: row.role,
                createdAt: row.created_at,
            }));

            return json(res, 200, { data: users });
        } catch {
            return json(res, 500, { error: 'Không thể tải danh sách users' });
        }
    }

    if (req.method === 'POST') {
        try {
            const body = await readBody<{ username?: string; password?: string; role?: string }>(req);

            if (!body.username || !body.password) {
                return json(res, 400, { error: 'Username and password are required', code: 'VALIDATION_ERROR' });
            }

            if (!body.role || !VALID_ROLES.includes(body.role as UserRole)) {
                return json(res, 400, { error: 'Invalid role', code: 'INVALID_ROLE' });
            }

            const hashedPassword = await bcrypt.hash(body.password, 12);

            const sql = db();
            const rows = await sql`
        INSERT INTO users (username, password, role)
        VALUES (${body.username}, ${hashedPassword}, ${body.role})
        RETURNING id, username, role, created_at
      `;

            const user = {
                id: rows[0].id,
                username: rows[0].username,
                role: rows[0].role,
                createdAt: rows[0].created_at,
            };

            return json(res, 201, user);
        } catch (err: any) {
            if (err?.code === '23505' || err?.message?.includes('unique') || err?.message?.includes('duplicate')) {
                return json(res, 409, { error: 'Tên đăng nhập đã tồn tại', code: 'DUPLICATE_USERNAME' });
            }
            return json(res, 500, { error: 'Không thể tạo user' });
        }
    }

    return json(res, 405, { error: 'Method not allowed' });
}
