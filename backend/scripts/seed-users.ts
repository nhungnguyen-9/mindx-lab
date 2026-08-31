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

const sql = neon(databaseUrl);

async function run() {
    const users = [
        { username: 'admin', password: 'admin123', role: 'admin' },
        { username: 'teacher1', password: 'teacher123', role: 'teacher' },
        { username: 'sale1', password: 'sale123', role: 'sale' },
    ];

    for (const u of users) {
        const hash = await bcrypt.hash(u.password, 12);
        await sql`
      INSERT INTO users (username, password, role)
      VALUES (${u.username}, ${hash}, ${u.role})
      ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role;
    `;
        console.log(`✓ Seeded user: ${u.username} (${u.role})`);
    }

    console.log('Done!');
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
