/// <reference path="../shared/external-modules.d.ts" />

import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

declare const process: {
  env: Record<string, string | undefined>;
  exit: (code: number) => never;
};

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_PASSWORD;

if (!username || !password) {
  throw new Error('ADMIN_USERNAME and ADMIN_PASSWORD are required');
}

const adminUsername = username;
const adminPassword = password;

const sql = neon(databaseUrl);

async function run() {
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await sql`
    INSERT INTO users (username, password, role)
    VALUES (${adminUsername}, ${passwordHash}, 'admin')
    ON CONFLICT (username)
    DO UPDATE SET password = EXCLUDED.password, role = 'admin';
  `;

  console.log(`Seeded admin account: ${adminUsername}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
