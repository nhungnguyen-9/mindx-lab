import jwt, { type JwtPayload } from 'jsonwebtoken';
import type { UserRole } from '../../shared/types';

const TOKEN_TTL_SECONDS = 8 * 60 * 60;

interface TokenPayload {
  sub: string;
  role: UserRole;
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
}

export function signToken(userId: string, role: UserRole): string {
  return jwt.sign({ sub: userId, role }, getJwtSecret(), {
    algorithm: 'HS256',
    expiresIn: TOKEN_TTL_SECONDS
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const payload = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as JwtPayload;
    if (!payload.sub || typeof payload.sub !== 'string') return null;
    const role = (payload as Record<string, unknown>).role;
    if (!role || typeof role !== 'string' || !['admin', 'teacher', 'sale'].includes(role)) return null;
    return { sub: payload.sub, role: role as UserRole };
  } catch {
    return null;
  }
}

export function computeTokenExpiryIso() {
  return new Date(Date.now() + TOKEN_TTL_SECONDS * 1000).toISOString();
}
