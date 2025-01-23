import 'dotenv/config';

import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';

import * as schema from './schemas';

const sqlite = new Database(process.env.DB_NAME!);
const db = drizzle({ client: sqlite, schema });

export { db, schema }