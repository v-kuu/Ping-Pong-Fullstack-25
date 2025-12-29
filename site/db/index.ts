import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';

const sqlite = new Database('./db/app.db', {
  strict: true,
  create: true,
});

const db = drizzle(sqlite, { schema });

const initializeDatabase = async () => {
  try {
    // Enable performance optimizations
    sqlite.exec('PRAGMA journal_mode = WAL');
    sqlite.exec('PRAGMA synchronous = NORMAL');
    sqlite.exec('PRAGMA cache_size = 1000000');
    sqlite.exec('PRAGMA temp_store = memory');

    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

export { initializeDatabase };
export { db };
