import { json } from './http';
import { verifyToken } from './jwt';
import type { UserRole, AuthContext } from '../../shared/types';

export function getBearerToken(req: any): string | null {
  const raw = req.headers?.authorization;
  if (typeof raw !== 'string' || !raw.startsWith('Bearer ')) {
    return null;
  }
  return raw.slice(7).trim();
}

/**
 * Returns a function that checks if the request has a valid token
 * with one of the allowed roles. Sends 401/403 and returns null on failure.
 */
export function requireRole(allowedRoles: UserRole[]) {
  return function (req: any, res: any): AuthContext | null {
    const token = getBearerToken(req);
    if (!token) {
      json(res, 401, { error: 'Unauthorized', code: 'UNAUTHORIZED' });
      return null;
    }

    const payload = verifyToken(token);
    if (!payload) {
      json(res, 401, { error: 'Unauthorized', code: 'UNAUTHORIZED' });
      return null;
    }

    if (!allowedRoles.includes(payload.role)) {
      json(res, 403, { error: 'Insufficient permissions', code: 'FORBIDDEN' });
      return null;
    }

    return { userId: payload.sub, role: payload.role };
  };
}

/**
 * Convenience: allows any authenticated user regardless of role.
 * Returns AuthContext or sends 401 and returns null.
 */
export function requireAuth(req: any, res: any): AuthContext | null {
  const token = getBearerToken(req);
  if (!token) {
    json(res, 401, { error: 'Unauthorized', code: 'UNAUTHORIZED' });
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    json(res, 401, { error: 'Unauthorized', code: 'UNAUTHORIZED' });
    return null;
  }

  return { userId: payload.sub, role: payload.role };
}

/**
 * Optional auth: returns context if a valid token is present,
 * null otherwise (no error response sent).
 */
export function optionalAuth(req: any, res: any): AuthContext | null {
  const token = getBearerToken(req);
  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  return { userId: payload.sub, role: payload.role };
}

/**
 * @deprecated Use requireRole(['admin']) instead
 */
export const requireAdmin = requireRole(['admin']);
