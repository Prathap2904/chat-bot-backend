/**
 * fix-passwords.ts
 *
 * One-shot script to patch passwordHash for existing users who were seeded
 * before the passwordHash column was added.
 *
 * Run with: npx ts-node fix-passwords.ts
 * (from the backend/src directory)
 */

import * as bcrypt from 'bcryptjs';
import { Client } from 'pg';

const DEV_PASSWORD = 'dev-password-2024';

async function main() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '123456',
    database: 'postgres',
  });

  await client.connect();
  console.log('Connected to PostgreSQL');

  // Find users with null passwordHash
  const { rows } = await client.query(
    'SELECT id, email FROM "users" WHERE "passwordHash" IS NULL'
  );

  if (rows.length === 0) {
    console.log('All users already have a passwordHash. Nothing to do.');
    await client.end();
    return;
  }

  console.log(`Found ${rows.length} user(s) with null passwordHash:`);
  rows.forEach((r: any) => console.log(`  - ${r.email}`));

  const hash = await bcrypt.hash(DEV_PASSWORD, 10);
  console.log(`\nGenerated bcrypt hash for password "${DEV_PASSWORD}"`);

  for (const row of rows) {
    await client.query(
      'UPDATE "users" SET "passwordHash" = $1 WHERE id = $2',
      [hash, row.id]
    );
    console.log(`  ✓ Updated ${row.email}`);
  }

  console.log('\nDone. All users now have passwordHash set.');
  await client.end();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
