import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";

let dbInstance: NeonHttpDatabase | null = null;

function getDb(): NeonHttpDatabase {
  if (dbInstance) {
    return dbInstance;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const sql = neon(databaseUrl);
  dbInstance = drizzle({ client: sql });
  return dbInstance;
}

// Export a proxy that lazy-loads the db
export const db = new Proxy({} as NeonHttpDatabase, {
  get(_, prop) {
    const instance = getDb();
    const value = instance[prop as keyof NeonHttpDatabase];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});
