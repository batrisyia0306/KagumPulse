import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

let client: Client | undefined;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getLibsqlClient(): Client {
  if (client) {
    return client;
  }

  const url = process.env.TURSO_DATABASE_URL ?? "file:./data/kagum.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;

  client = createClient({
    url,
    authToken: authToken || undefined,
  });

  return client;
}

export function getDb() {
  if (!dbInstance) {
    dbInstance = drizzle(getLibsqlClient(), { schema });
  }
  return dbInstance;
}
