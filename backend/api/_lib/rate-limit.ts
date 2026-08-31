import { db } from './db';

/**
 * Extracts the client IP, trusting the leftmost X-Forwarded-For entry set by
 * Vercel's edge. Falls back to the socket address for local development.
 */
export function getClientIp(req: any): string {
  const xff = req.headers?.['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    return xff.split(',')[0].trim();
  }
  if (Array.isArray(xff) && xff.length > 0) {
    return String(xff[0]).split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.connection?.remoteAddress || 'unknown';
}

/**
 * Returns true if `bucket` has reached `max` recorded hits within the last
 * `windowSeconds`. DB-backed so it works across stateless serverless instances.
 */
export async function isRateLimited(
  bucket: string,
  max: number,
  windowSeconds: number
): Promise<boolean> {
  const sql = db();
  const rows = await sql`
    SELECT COUNT(*)::int AS count
    FROM rate_limit_hits
    WHERE bucket = ${bucket}
      AND created_at > NOW() - make_interval(secs => ${windowSeconds})
  `;
  return Number(rows[0]?.count ?? 0) >= max;
}

export async function recordHit(bucket: string): Promise<void> {
  const sql = db();
  await sql`INSERT INTO rate_limit_hits (bucket) VALUES (${bucket})`;
  // Opportunistic cleanup of old rows to keep the table small.
  await sql`DELETE FROM rate_limit_hits WHERE created_at < NOW() - INTERVAL '1 day'`;
}

export async function clearBucket(bucket: string): Promise<void> {
  const sql = db();
  await sql`DELETE FROM rate_limit_hits WHERE bucket = ${bucket}`;
}
