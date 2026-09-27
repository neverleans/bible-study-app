import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

async function runMigrations() {
  const connectionString =
    process.env.DATABASE_URL || 'postgresql://biblia:biblia@localhost:5434/biblia';
  console.log('⏳ Running Drizzle migrations on:', connectionString);

  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient);

  await migrate(db, {
    migrationsFolder: path.join(__dirname, 'migrations'),
  });

  console.log('✅ Migrations completed successfully!');
  await migrationClient.end();
}

runMigrations().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
