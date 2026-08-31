import { json, readBody } from '../_lib/http';
import { db } from '../_lib/db';
import bcrypt from 'bcryptjs';
import { computeTokenExpiryIso, signToken } from '../_lib/jwt';
import { clearBucket, getClientIp, isRateLimited, recordHit } from '../_lib/rate-limit';

interface LoginBody {
    username?: string;
    password?: string;
}

// Max failed attempts per (IP + username) within the window before we lock out.
// Keying by IP+username avoids locking out a whole class behind one shared IP.
const MAX_ATTEMPTS = 8;
const WINDOW_SECONDS = 15 * 60;

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return json(res, 405, { error: 'Method not allowed' });
    }

    try {
        const body = await readBody<LoginBody>(req);
        if (!body.username || !body.password) {
            return json(res, 400, { error: 'Thieu ten dang nhap hoac mat khau' });
        }

        const ip = getClientIp(req);
        const bucket = `login:${ip}:${body.username.toLowerCase()}`;

        if (await isRateLimited(bucket, MAX_ATTEMPTS, WINDOW_SECONDS)) {
            res.setHeader('Retry-After', String(WINDOW_SECONDS));
            return json(res, 429, {
                error: 'Quá nhiều lần đăng nhập sai. Vui lòng thử lại sau ít phút.',
                code: 'TOO_MANY_ATTEMPTS'
            });
        }

        const sql = db();
        const users = await sql`
      SELECT id, username, password, role
      FROM users
      WHERE username = ${body.username}
      LIMIT 1
    `;
        const user = users[0];

        if (!user) {
            await recordHit(bucket);
            return json(res, 401, { error: 'Sai ten dang nhap hoac mat khau' });
        }

        const ok = await bcrypt.compare(body.password, String(user.password));
        if (!ok) {
            await recordHit(bucket);
            return json(res, 401, { error: 'Sai ten dang nhap hoac mat khau' });
        }

        // Successful login clears this identity's failure history.
        await clearBucket(bucket);

        const token = signToken(String(user.id), user.role as any);
        const expiresAt = computeTokenExpiryIso();

        return json(res, 200, {
            token,
            expiresAt,
            user: {
                id: String(user.id),
                username: String(user.username),
                role: String(user.role),
            },
        });
    } catch {
        return json(res, 500, { error: 'Dang nhap that bai' });
    }
}
