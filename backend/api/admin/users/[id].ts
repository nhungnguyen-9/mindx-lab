import { db } from '../../_lib/db';
import { json, readBody } from '../../_lib/http';
import { requireRole } from '../../_lib/auth';
import type { UserRole } from '../../../shared/types';

const VALID_ROLES: UserRole[] = ['admin', 'teacher', 'sale'];

export default async function handler(req: any, res: any) {
    const auth = requireRole(['admin'])(req, res);
    if (!auth) {
        return;
    }

    const id = req.query?.id;
    if (typeof id !== 'string') {
        return json(res, 400, { error: 'Invalid user id' });
    }

    if (req.method === 'PUT') {
        try {
            const body = await readBody<{ role?: string }>(req);

            if (!body.role || !VALID_ROLES.includes(body.role as UserRole)) {
                return json(res, 400, { error: 'Invalid role', code: 'INVALID_ROLE' });
            }

            const sql = db();
            const rows = await sql`
        UPDATE users
        SET role = ${body.role}
        WHERE id = ${id}
        RETURNING id, username, role, created_at
      `;

            if (rows.length === 0) {
                return json(res, 404, { error: 'User not found', code: 'NOT_FOUND' });
            }

            const user = {
                id: rows[0].id,
                username: rows[0].username,
                role: rows[0].role,
                createdAt: rows[0].created_at,
            };

            return json(res, 200, user);
        } catch {
            return json(res, 500, { error: 'Không thể cập nhật user' });
        }
    }

    if (req.method === 'DELETE') {
        if (id === auth.userId) {
            return json(res, 400, { error: 'Cannot delete own account', code: 'SELF_DELETE' });
        }

        try {
            const sql = db();
            const rows = await sql`
        DELETE FROM users
        WHERE id = ${id}
        RETURNING id
      `;

            if (rows.length === 0) {
                return json(res, 404, { error: 'User not found', code: 'NOT_FOUND' });
            }

            return json(res, 200, { message: 'User deleted' });
        } catch {
            return json(res, 500, { error: 'Không thể xóa user' });
        }
    }

    return json(res, 405, { error: 'Method not allowed' });
}
