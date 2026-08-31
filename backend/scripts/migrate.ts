/// <reference path="../shared/external-modules.d.ts" />

import { neon } from '@neondatabase/serverless';

declare const process: {
  env: Record<string, string | undefined>;
  exit: (code: number) => never;
};

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const sql = neon(databaseUrl);

async function run() {
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto;`;

  // Canonical user table with role-based access control.
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'sale' CHECK (role IN ('admin', 'teacher', 'sale')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);`;

  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      student_name VARCHAR(255) NOT NULL,
      class_name VARCHAR(100) NOT NULL,
      category VARCHAR(50) NOT NULL CHECK (category IN ('scratch','game','app-python','web','computer-science')),
      embed_type VARCHAR(20) NOT NULL DEFAULT 'link' CHECK (embed_type IN ('link','web','scratch','gamemaker','pygame','python-script')),
      thumbnail_url TEXT NOT NULL,
      embed_url TEXT NOT NULL,
      source_code TEXT,
      published BOOLEAN NOT NULL DEFAULT FALSE,
      view_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  // Idempotent upgrade for databases created before embed_type existed.
  await sql`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS embed_type VARCHAR(20) NOT NULL DEFAULT 'link';
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_products_category_published ON products (category, published);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_products_created_at ON products (created_at DESC);`;

  // Records failed login attempts for DB-backed rate limiting.
  await sql`
    CREATE TABLE IF NOT EXISTS rate_limit_hits (
      id BIGSERIAL PRIMARY KEY,
      bucket TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_rate_limit_bucket_time ON rate_limit_hits (bucket, created_at);`;

  console.log('Migration complete');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
