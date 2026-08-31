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
    console.log('Starting RBAC migration...');

    // Step 1: Ensure pgcrypto extension exists
    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto;`;
    console.log('✓ pgcrypto extension ready');

    // Step 2: Create users table with role constraint
    await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'sale' CHECK (role IN ('admin', 'teacher', 'sale')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
    console.log('✓ users table created');

    // Step 3: Create indexes on username and role
    await sql`CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);`;
    console.log('✓ indexes created');

    // Step 4: Migrate data from admins table (if it exists)
    try {
        await sql`
      INSERT INTO users (id, username, password, role, created_at)
      SELECT id, username, password, 'admin', created_at
      FROM admins
      ON CONFLICT (username) DO NOTHING;
    `;
        console.log('✓ admin data migrated to users table');
    } catch (error: any) {
        // If admins table doesn't exist, skip gracefully
        if (error.message?.includes('relation "admins" does not exist')) {
            console.log('⚠ admins table not found, skipping data migration');
        } else {
            throw error;
        }
    }

    console.log('RBAC migration complete');
}

run().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
});
