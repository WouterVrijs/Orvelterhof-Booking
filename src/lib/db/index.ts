import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Use a single connection for queries (connection pooling handled by postgres.js)
const client = postgres(connectionString, { max: 10 });

export const db = drizzle(client, { schema });
