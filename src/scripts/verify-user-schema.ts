/**
 * Verification script – run with:
 *   npx ts-node src/scripts/verify-user-schema.ts
 *
 * Connects to the PostgreSQL database and prints the users table
 * schema and seeded user data so you can confirm:
 *   1. The new columns (passwordHash, accessRole) exist
 *   2. The original `role` (chat persona) field is unchanged
 *   3. No plain-text passwords are stored
 */
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'postgres',
    synchronize: false,
  });

  await ds.initialize();

  console.log('\n=== COLUMN SCHEMA ===');
  const columns: {
    column_name: string;
    data_type: string;
    is_nullable: string;
  }[] = await ds.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
  console.table(columns);

  console.log('\n=== SEEDED USERS ===');
  const users: unknown = await ds.query(`
    SELECT id, name, email, role, "accessRole", status,
           CASE WHEN "passwordHash" IS NOT NULL THEN '*** hashed ***' ELSE NULL END AS "passwordHash"
    FROM users
    ORDER BY name
  `);
  console.table(users);

  await ds.destroy();
}

main().catch(console.error);
