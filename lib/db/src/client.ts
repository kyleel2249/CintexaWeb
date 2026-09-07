import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/customer.js";

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/cintexa";

const queryClient = postgres(connectionString);

/** Shared Drizzle client for the API server. Import `db` and query the tables in `./schema`. */
export const db = drizzle(queryClient, { schema });
